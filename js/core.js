'use strict';

// ---------------------------------------------------------------------------
// Hollowwing — shared setup, helpers, audio
// ---------------------------------------------------------------------------

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const gameEl = document.getElementById('game');

const ui = {
  hud: document.getElementById('hud'),
  flasks: [...document.querySelectorAll('.flask')],
  souls: document.getElementById('soulCount'),
  distance: document.getElementById('distanceCount'),
  bossHud: document.getElementById('bossHud'),
  bossName: document.getElementById('bossName'),
  bossKicker: document.querySelector('.boss-kicker'),
  bossFill: document.getElementById('bossFill'),
  castBtn: document.getElementById('castBtn'),
  hint: document.getElementById('hint'),
  banner: document.getElementById('banner'),
  bannerKicker: document.getElementById('bannerKicker'),
  bannerTitle: document.getElementById('bannerTitle'),
  titleScreen: document.getElementById('titleScreen'),
  pauseScreen: document.getElementById('pauseScreen'),
  deathScreen: document.getElementById('deathScreen'),
  victoryScreen: document.getElementById('victoryScreen'),
  startBtn: document.getElementById('startBtn'),
  resumeBtn: document.getElementById('resumeBtn'),
  restartBtn: document.getElementById('restartBtn'),
  retryBtn: document.getElementById('retryBtn'),
  deathTitleBtn: document.getElementById('deathTitleBtn'),
  againBtn: document.getElementById('againBtn'),
  victoryTitleBtn: document.getElementById('victoryTitleBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  muteBtn: document.getElementById('muteBtn'),
  bestScore: document.getElementById('bestScore'),
  deathSouls: document.getElementById('deathSouls'),
  deathDepth: document.getElementById('deathDepth'),
  deathBosses: document.getElementById('deathBosses'),
  deathLine: document.getElementById('deathLine'),
  victorySouls: document.getElementById('victorySouls'),
  victoryDepth: document.getElementById('victoryDepth'),
  victoryBest: document.getElementById('victoryBest'),
  fatalError: document.getElementById('fatalError'),
};

const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const TAU = Math.PI * 2;

function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function circleRect(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r;
}

function roundRectPath(c, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.lineTo(x + w - rr, y);
  c.quadraticCurveTo(x + w, y, x + w, y + rr);
  c.lineTo(x + w, y + h - rr);
  c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  c.lineTo(x + rr, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - rr);
  c.lineTo(x, y + rr);
  c.quadraticCurveTo(x, y, x + rr, y);
  c.closePath();
}

function safeGet(key, fallback = '') {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

// ---------------------------------------------------------------------------
// Boss definitions
// ---------------------------------------------------------------------------

const BOSS_DEFS = [
  {
    id: 'bellwarden',
    name: 'Bellwarden of the Deep',
    kicker: 'First keeper',
    threshold: 150,
    hp: 164,
    reward: 260,
    color: '#efb15d',
    dark: '#7b3d2b',
    patterns: ['fan', 'radial', 'dive', 'fan', 'radial', 'fan'],
    cooldown: 1.6,
    cooldown2: 1.12,
  },
  {
    id: 'choir',
    name: 'The Rotten Choir',
    kicker: 'Second keeper',
    threshold: 390,
    hp: 238,
    reward: 430,
    color: '#8be6f5',
    dark: '#2e6b82',
    patterns: ['fan', 'rain', 'beam', 'radial', 'fan', 'rain'],
    cooldown: 1.72,
    cooldown2: 1.2,
  },
  {
    id: 'cinder',
    name: 'Cinder Monarch',
    kicker: 'Final keeper',
    threshold: 680,
    hp: 326,
    reward: 760,
    color: '#ff8242',
    dark: '#8c2d16',
    patterns: ['rain', 'dash', 'fan', 'beam', 'radial', 'rain'],
    cooldown: 1.62,
    cooldown2: 1.0,
  },
];

const DEATH_LINES = [
  'Your embers join the dark.',
  'The cave remembers your name. It will not repeat it.',
  'Another hollow feeds the deep.',
  'Rest is a kindness this place forgot.',
  'The keepers barely stirred.',
  'You were so close to the light.',
];

// ---------------------------------------------------------------------------
// The mutable run state
// ---------------------------------------------------------------------------

const G = {
  state: 'title',
  prevState: 'playing',
  time: 0,
  stateTime: 0,
  bgScroll: 0,
  distance: 0,
  souls: 0,
  speed: 0,
  best: Number(safeGet('hollowwing-best', '0')) || 0,
  nextBoss: 0,
  boss: null,
  player: null,
  obstacles: [],
  pickups: [],
  bolts: [],
  projectiles: [],
  beams: [],
  particles: [],
  floaters: [],
  motes: [],
  metrics: null,
  spawnTimer: 1.25,
  prevGap: 0.5,
  startHover: 0,
  shake: 0,
  hurtFlash: 0,
  healFlash: 0,
  flash: 0,
  flashColor: '#ffffff',
  lowHealth: 0,
  hintTime: 0,
  heartTimer: 0,
  deathTimer: 0,
  bossDefeatTimer: 0,
  castHeld: false,
  pendingVictory: false,
  muted: safeGet('hollowwing-muted', '0') === '1',
  bannerTimer: 0,
  reducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

// ---------------------------------------------------------------------------
// Procedural audio
// ---------------------------------------------------------------------------

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.enabled = !G.muted;
    this.ambient = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    try {
      this.ctx = new AudioCtor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? 0.42 : 0;
      this.master.connect(this.ctx.destination);
      this.noise = this.makeNoise();
      this.startAmbient();
    } catch {
      this.ctx = null;
    }
  }

  makeNoise() {
    if (!this.ctx) return null;
    const length = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[i] = last * 5;
    }
    return buffer;
  }

  startAmbient() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const bus = this.ctx.createGain();
    bus.gain.value = 0.18;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 210;
    filter.Q.value = 0.8;
    bus.connect(filter);
    filter.connect(this.master);

    const a = this.ctx.createOscillator();
    a.type = 'sine';
    a.frequency.value = 55;
    const ag = this.ctx.createGain();
    ag.gain.value = 0.17;
    a.connect(ag);
    ag.connect(bus);
    a.start(now);

    const b = this.ctx.createOscillator();
    b.type = 'triangle';
    b.frequency.value = 82.41;
    const bg = this.ctx.createGain();
    bg.gain.value = 0.045;
    b.connect(bg);
    bg.connect(bus);
    b.start(now);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.06;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);

    if (this.noise) {
      const wind = this.ctx.createBufferSource();
      wind.buffer = this.noise;
      wind.loop = true;
      const wf = this.ctx.createBiquadFilter();
      wf.type = 'bandpass';
      wf.frequency.value = 280;
      wf.Q.value = 0.5;
      const wg = this.ctx.createGain();
      wg.gain.value = 0.026;
      wind.connect(wf);
      wf.connect(wg);
      wg.connect(this.master);
      wind.start(now);
    }
    this.ambient = bus;
  }

  setMuted(muted) {
    G.muted = muted;
    this.enabled = !muted;
    safeSet('hollowwing-muted', muted ? '1' : '0');
    if (!this.master || !this.ctx) return;
    const target = muted ? 0 : 0.42;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.15);
  }

  tone(freq, dur = 0.2, type = 'sine', vol = 0.1, endFreq = null, delay = 0) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  noiseBurst(dur = 0.16, frequency = 600, vol = 0.05, type = 'bandpass') {
    if (!this.ctx || !this.enabled || !this.noise) return;
    const t0 = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  flap() {
    this.noiseBurst(0.12, 520, 0.055, 'bandpass');
    this.tone(176, 0.12, 'sine', 0.032, 108);
  }

  cast() {
    this.tone(620, 0.13, 'triangle', 0.045, 1120);
    this.noiseBurst(0.08, 1650, 0.018, 'highpass');
  }

  hitBoss() {
    this.tone(150, 0.12, 'square', 0.035, 56);
    this.noiseBurst(0.09, 900, 0.03, 'bandpass');
    this.tone(880, 0.18, 'sine', 0.022, 1420);
  }

  hurt() {
    this.tone(120, 0.42, 'sawtooth', 0.1, 48);
    this.noiseBurst(0.23, 220, 0.075, 'lowpass');
  }

  heal() {
    this.tone(523.25, 0.5, 'sine', 0.05, 523.25);
    this.tone(783.99, 0.7, 'sine', 0.032, 783.99, 0.12);
    this.tone(1046.5, 0.9, 'sine', 0.02, 1046.5, 0.26);
  }

  collect() {
    this.tone(1244, 0.11, 'sine', 0.018, 1760);
  }

  roar() {
    this.tone(64, 1.15, 'sawtooth', 0.13, 31);
    this.tone(96, 0.95, 'square', 0.035, 47);
    this.noiseBurst(1.1, 170, 0.08, 'lowpass');
  }

  thump(heavy = false) {
    this.tone(heavy ? 46 : 55, 0.22, 'sine', heavy ? 0.11 : 0.075, 30);
  }

  death() {
    this.tone(146.8, 1.6, 'sawtooth', 0.09, 36.7);
    this.tone(110, 2.1, 'sine', 0.05, 27.5, 0.15);
    this.noiseBurst(1.3, 200, 0.04, 'lowpass');
  }

  victory() {
    const notes = [261.6, 329.6, 392, 523.25, 659.25];
    notes.forEach((n, i) => {
      this.tone(n, 2.2, 'sine', 0.032, n, i * 0.17);
      this.tone(n * 2, 1.3, 'triangle', 0.014, n * 2, i * 0.17 + 0.02);
    });
  }

  ui() {
    this.tone(330, 0.08, 'sine', 0.025, 390);
  }
}

const sound = new SoundEngine();
