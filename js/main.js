'use strict';

// ---------------------------------------------------------------------------
// Screen state, UI, rendering orchestration, input, and main loop
// ---------------------------------------------------------------------------

let W = Math.max(320, window.innerWidth);
let H = Math.max(400, window.innerHeight);
let DPR = Math.min(window.devicePixelRatio || 1, 2);
let bannerTimeout = 0;
let lastFrame = performance.now();

function setState(next) {
  G.state = next;
  G.stateTime = 0;
  document.body.dataset.state = next;
}

function showScreen(screen) {
  screen.classList.add('is-visible');
}

function hideAllScreens() {
  ui.titleScreen.classList.remove('is-visible');
  ui.pauseScreen.classList.remove('is-visible');
  ui.deathScreen.classList.remove('is-visible');
  ui.victoryScreen.classList.remove('is-visible');
}

function updateRecordDisplay() {
  ui.bestScore.textContent = G.best.toLocaleString('en-US');
}

function syncFlasks(effect = '') {
  const p = G.player;
  const health = p ? p.health : 3;
  ui.flasks.forEach((el, i) => {
    const wasFull = el.classList.contains('is-full');
    const isFull = i < health;
    el.classList.toggle('is-full', isFull);
    el.classList.remove('just-filled', 'just-lost');
    if (effect === 'hurt' && wasFull && !isFull) {
      el.classList.add('just-lost');
      window.setTimeout(() => el.classList.remove('just-lost'), 550);
    }
    if (effect === 'heal' && !wasFull && isFull) {
      el.classList.add('just-filled');
      window.setTimeout(() => el.classList.remove('just-filled'), 800);
    }
  });
}

function showBossHud(def) {
  ui.bossKicker.textContent = def.kicker;
  ui.bossName.textContent = def.name;
  ui.bossFill.style.width = '100%';
  ui.bossHud.classList.add('is-active');
}

function hideBossHud() {
  ui.bossHud.classList.remove('is-active');
  ui.bossFill.style.width = '0%';
}

function updateBossFill() {
  if (!G.boss) {
    ui.bossFill.style.width = '0%';
    return;
  }
  ui.bossFill.style.width = `${clamp(G.boss.hp / G.boss.maxHp, 0, 1) * 100}%`;
}

function showBanner(kicker, title, modifier = '', duration = 2200) {
  window.clearTimeout(bannerTimeout);
  ui.bannerKicker.textContent = kicker;
  ui.bannerTitle.textContent = title;
  ui.banner.className = 'banner';
  if (modifier) {
    const type = modifier.startsWith('is-') ? modifier : `is-${modifier}`;
    ui.banner.classList.add(type);
  }
  void ui.banner.offsetWidth;
  ui.banner.classList.add('is-visible');
  bannerTimeout = window.setTimeout(() => {
    ui.banner.classList.remove('is-visible');
  }, duration);
}

function clearBanner() {
  window.clearTimeout(bannerTimeout);
  ui.banner.classList.remove('is-visible');
}

function beginRun() {
  sound.init();
  sound.ui();
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  hideAllScreens();
  clearBanner();
  hideBossHud();
  resetRun();
  setState('playing');
  updateRecordDisplay();
}

function togglePause() {
  if (G.state === 'playing' || G.state === 'boss' || G.state === 'bossDefeat') {
    G.prevState = G.state;
    G.castHeld = false;
    setState('paused');
    showScreen(ui.pauseScreen);
    sound.ui();
  } else if (G.state === 'paused') {
    setState(G.prevState || 'playing');
    ui.pauseScreen.classList.remove('is-visible');
    lastFrame = performance.now();
    sound.ui();
  }
}

function resumeRun() {
  if (G.state !== 'paused') return;
  setState(G.prevState || 'playing');
  ui.pauseScreen.classList.remove('is-visible');
  lastFrame = performance.now();
  sound.ui();
}

function showDeathScreen() {
  if (G.state !== 'dying') return;
  saveBest();
  setState('gameover');
  hideBossHud();
  clearBanner();
  ui.hint.classList.add('is-hidden');
  ui.deathSouls.textContent = G.souls.toLocaleString('en-US');
  ui.deathDepth.textContent = `${Math.floor(G.distance)} m`;
  ui.deathBosses.textContent = String(G.nextBoss);
  ui.deathLine.textContent = DEATH_LINES[randInt(0, DEATH_LINES.length - 1)];
  showScreen(ui.deathScreen);
}

function triggerVictory() {
  saveBest();
  setState('victory');
  hideBossHud();
  clearBanner();
  ui.hint.classList.add('is-hidden');
  G.projectiles = [];
  G.beams = [];
  G.bolts = [];
  ui.victorySouls.textContent = G.souls.toLocaleString('en-US');
  ui.victoryDepth.textContent = `${Math.floor(G.distance)} m`;
  ui.victoryBest.textContent = G.best.toLocaleString('en-US');
  showScreen(ui.victoryScreen);
  sound.init();
  sound.victory();
  G.flash = 0.35;
  G.flashColor = '#ffd997';
  G.shake = 14;
}

function returnToTitle() {
  hideAllScreens();
  hideBossHud();
  clearBanner();
  G.boss = null;
  G.obstacles = [];
  G.pickups = [];
  G.bolts = [];
  G.projectiles = [];
  G.beams = [];
  G.particles = [];
  G.floaters = [];
  G.player = makePlayer();
  G.player.y = H * 0.5;
  G.castHeld = false;
  G.shake = 0;
  G.hurtFlash = 0;
  G.healFlash = 0;
  G.flash = 0;
  G.lowHealth = 0;
  setState('title');
  updateRecordDisplay();
  ui.titleScreen.classList.remove('is-visible');
  void ui.titleScreen.offsetWidth;
  ui.titleScreen.classList.add('is-visible');
  sound.ui();
}

function toggleMute() {
  sound.init();
  sound.setMuted(!G.muted);
  document.body.classList.toggle('is-muted', G.muted);
  ui.muteBtn.setAttribute('aria-label', G.muted ? 'Unmute sound' : 'Mute sound');
  ui.muteBtn.setAttribute('title', G.muted ? 'Unmute sound' : 'Mute sound');
}

function resize() {
  W = Math.max(320, window.innerWidth);
  H = Math.max(400, window.innerHeight);
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  G.metrics = computeMetrics();

  if (G.player) {
    G.player.x = G.metrics.playerX;
    G.player.r = G.metrics.playerR;
    G.player.y = clamp(G.player.y, G.metrics.playerR + 10, H - G.metrics.playerR - 10);
  }
  if (G.boss) {
    const sc = clamp(Math.min(W, H) / 650, 0.78, 1.34);
    G.boss.scale = sc;
    G.boss.targetX = W * (W < 760 ? 0.705 : 0.735);
    G.boss.baseY = H * (G.boss.def.id === 'choir' ? 0.43 : 0.405);
    G.boss.hitR = 59 * sc;
  }
  makeMotes();
}

function drawScene() {
  const shake = G.shake;
  const sx = shake > 0.1 ? rand(-shake, shake) : 0;
  const sy = shake > 0.1 ? rand(-shake, shake) : 0;

  ctx.save();
  ctx.translate(W * 0.5 + sx, H * 0.5 + sy);
  ctx.scale(1.012, 1.012);
  ctx.translate(-W * 0.5, -H * 0.5);

  if (G.state === 'title') {
    drawBackground(G.time, G.time * 24, 'title');
    ctx.restore();
    drawPostEffects(G.time);
    return;
  }

  const mode = G.state === 'boss' || G.state === 'bossDefeat' ? 'boss' : 'game';
  drawBackground(G.time, G.bgScroll, mode);

  for (const o of G.obstacles) drawObstacle(o, G.time);
  for (const item of G.pickups) drawPickup(item, G.time);

  if (G.boss) drawBoss(G.boss, G.time);

  for (const beam of G.beams) drawBeam(beam, G.time);
  for (const pr of G.projectiles) drawProjectile(pr, G.time);
  for (const bolt of G.bolts) drawBolt(bolt, G.time);

  if (G.player) drawPlayer(G.player, G.time);

  drawParticles();
  drawFloaters();

  ctx.restore();
  drawPostEffects(G.time);
}

function updateHud() {
  if (!G.player) return;
  const souls = G.souls.toLocaleString('en-US');
  if (ui.souls.textContent !== souls) ui.souls.textContent = souls;
  const depth = `${Math.floor(G.distance)}`;
  if (ui.distance.textContent !== depth) ui.distance.textContent = depth;
  ui.castBtn.classList.toggle('is-cooling', G.player.castCd > 0.05);
}

function frame(now) {
  const raw = (now - lastFrame) / 1000;
  lastFrame = now;
  const elapsed = Math.min(raw, 0.25);

  if (G.state !== 'paused') {
    let remaining = elapsed;
    while (remaining > 0.0001) {
      const step = Math.min(remaining, 0.05);
      updateGame(step);
      remaining -= step;
      if (G.state === 'gameover' || G.state === 'victory') break;
    }
    if (G.state === 'dying' && G.deathTimer > 1.55) showDeathScreen();
  }

  updateHud();
  drawScene();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

function handlePrimaryAction() {
  if (G.state === 'title') beginRun();
  else if (G.state === 'gameover' || G.state === 'victory') beginRun();
  else if (G.state === 'paused') resumeRun();
  else flap();
}

window.addEventListener('keydown', (e) => {
  const code = e.code;
  if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
    e.preventDefault();
    if (!e.repeat) handlePrimaryAction();
    return;
  }
  if (code === 'KeyJ' || code === 'KeyF' || code === 'KeyK') {
    e.preventDefault();
    G.castHeld = true;
    if (!e.repeat) castSoulBolt();
    return;
  }
  if (code === 'KeyP' || code === 'Escape') {
    e.preventDefault();
    if (G.state === 'paused') resumeRun();
    else togglePause();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyJ' || e.code === 'KeyF' || e.code === 'KeyK') G.castHeld = false;
});

window.addEventListener('blur', () => {
  G.castHeld = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (e.button === 2) {
    castSoulBolt();
    return;
  }
  if (G.state === 'playing' || G.state === 'boss') flap();
});

ui.castBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  castSoulBolt();
});

ui.startBtn.addEventListener('click', beginRun);
ui.resumeBtn.addEventListener('click', resumeRun);
ui.restartBtn.addEventListener('click', () => {
  ui.pauseScreen.classList.remove('is-visible');
  beginRun();
});
ui.retryBtn.addEventListener('click', beginRun);
ui.againBtn.addEventListener('click', beginRun);
ui.deathTitleBtn.addEventListener('click', returnToTitle);
ui.victoryTitleBtn.addEventListener('click', returnToTitle);
ui.pauseBtn.addEventListener('click', () => {
  if (G.state === 'paused') resumeRun();
  else togglePause();
});
ui.muteBtn.addEventListener('click', toggleMute);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && (G.state === 'playing' || G.state === 'boss' || G.state === 'bossDefeat')) {
    togglePause();
  }
  lastFrame = performance.now();
});

window.addEventListener('resize', resize);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot() {
  resize();
  G.metrics = computeMetrics();
  G.player = makePlayer();
  G.player.y = H * 0.48;
  G.speed = G.metrics.speed;
  makeMotes();
  syncFlasks();
  updateRecordDisplay();
  document.body.classList.toggle('is-muted', G.muted);
  ui.muteBtn.setAttribute('aria-label', G.muted ? 'Unmute sound' : 'Mute sound');
  document.body.dataset.state = 'title';
  ui.titleScreen.classList.add('is-visible');

  if (location.search.includes('nofonts')) {
    document.documentElement.style.setProperty('--serif', '"Palatino Linotype", Palatino, serif');
    document.documentElement.style.setProperty('--body', 'Georgia, serif');
  }

  requestAnimationFrame((now) => {
    lastFrame = now;
    requestAnimationFrame(frame);
  });
}

window.addEventListener('error', (event) => {
  if (!ui.fatalError) return;
  ui.fatalError.textContent = `Hollowwing hit a snag: ${event.message}`;
  ui.fatalError.classList.add('is-visible');
});

boot();
