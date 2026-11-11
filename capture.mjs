import { createRequire } from 'node:module'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'

const project = resolve(dirname(new URL(import.meta.url).pathname))
const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR && resolve(process.env.CAPTURE_DIR)

function fail(message, code = 1) {
  const error = new Error(message)
  error.exitCode = code
  throw error
}

function isBrowserInfrastructureError(error) {
  return error.name === 'TimeoutError' ||
    /(?:browser|target|page|context).*(?:disconnected|closed)|protocol error/i.test(error.message)
}

if (!url || !output) fail('Set CAPTURE_URL and CAPTURE_DIR.')
if (!/^https?:\/\//i.test(url)) fail('CAPTURE_URL must be an absolute HTTP(S) URL.')
if (output === project || output.startsWith(project + sep)) {
  fail('CAPTURE_DIR must be outside the project source directory.')
}

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
let chromium
let config
try {
  const require = createRequire(join(runtime, 'package.json'))
  ;({ chromium } = require('playwright'))
  config = JSON.parse(readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
  if (process.platform === 'linux') {
    process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()
  }
} catch (error) {
  console.error(error)
  process.exitCode = 75
}

if (process.exitCode !== 75) {
  mkdirSync(output, { recursive: true })
  let browser
  let failureCode = 1
  try {
    try {
      browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 })
    } catch (error) {
      failureCode = 75
      throw error
    }

    const origin = new URL(url).origin
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      let page
      const defects = []
      try {
        try {
          page = await browser.newPage({ viewport: { width, height } })
        } catch (error) {
          failureCode = 75
          throw error
        }
        page.setDefaultTimeout(30000)
        page.on('pageerror', error => defects.push(`JavaScript error: ${error.message}`))
        page.on('response', response => {
          if (response.status() >= 400 && new URL(response.url()).origin === origin) {
            defects.push(`HTTP ${response.status()}: ${response.url()}`)
          }
        })

        let response
        try {
          response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
        } catch (error) {
          failureCode = 75
          throw error
        }
        if (!response?.ok()) {
          const status = response?.status()
          failureCode = !response || [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1
          fail(`HTTP ${status ?? 'no response'} loading ${url}.`, failureCode)
        }

        try {
          await page.locator('#titleScreen.is-visible').waitFor({ state: 'visible', timeout: 30000 })
          await page.locator('#startBtn').waitFor({ state: 'visible', timeout: 30000 })
          await page.waitForFunction(() => {
            const canvas = document.querySelector('#gameCanvas')
            return canvas && canvas.getBoundingClientRect().width > 0 && canvas.getBoundingClientRect().height > 0
          }, { timeout: 30000 })
        } catch (error) {
          failureCode = 1
          throw new Error(`The app did not render its title screen: ${error.message}`)
        }

        // Let the title entrance animation finish so both captures show settled content.
        await page.waitForTimeout(1400)
        if (defects.length) fail(`The page reported rendering defects: ${defects.join('; ')}`)
        try {
          await page.screenshot({ path: join(output, `final-${name}.png`), timeout: 30000 })
        } catch (error) {
          if (isBrowserInfrastructureError(error)) failureCode = 75
          throw error
        }
        console.log(`Captured ${name} (${width}x${height}) from ${url}`)
      } catch (error) {
        if (error.exitCode) failureCode = error.exitCode
        else if (isBrowserInfrastructureError(error)) failureCode = 75
        throw error
      } finally {
        await page?.close().catch(error => console.error(`Closing capture page: ${error.message}`))
      }
    }
  } catch (error) {
    console.error(error)
    process.exitCode = failureCode
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch (error) {
        console.error(`Closing capture browser: ${error.message}`)
        if (!process.exitCode) process.exitCode = 75
      }
    }
  }
}
