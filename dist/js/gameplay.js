'use strict';

// ---------------------------------------------------------------------------
// Run setup, traversal, combat, and boss logic
// ---------------------------------------------------------------------------

function computeMetrics() {
  const min = Math.min(W, H);
  const v = clamp(H / 900, 0.82, 1.08);
  return {
    scale: clamp(min / 760, 0.74, 1.1),
    speed: clamp(W * 0.205, 205, 325),
    gravity: 2550 * v,
    flap: -765 * v,
    playerX: clamp(W * 0.235, 84, 340),
    playerR: 13 * clamp(min / 760, 0.78, 1.1) + 2,
    obstacleW: clamp(W * 0.072, 42, 105),
    spacing: Math.max(290, W * 0.29),
  };
}

function makePlayer() {
  const m = G.metrics;
  return {
    x: m.playerX,
    y: H * 0.46,
    vy: 0,
    r: m.playerR,
    rot: 0,
    wing: 0.4,
    castCd: 0,
    castAnim: 0,
    health: 3,
    maxHealth: 3,
    iframes: 0,
    trailTimer: 0,
    knockX: 0,
  };
}

function resetRun() {
  G.state = 'playing';
  G.prevState = 'playing';
  G.stateTime = 0;
  G.bgScroll = 0;
  G.distance = 0;
  G.souls = 0;
  G.nextBoss = 0;
  G.boss = null;
  G.obstacles = [];
  G.pickups = [];
  G.bolts = [];
  G.projectiles = [];
  G.beams = [];
  G.particles = [];
  G.floaters = [];
  G.spawnTimer = 0;
  G.startHover = 1.35;
  G.shake = 0;
  G.hurtFlash = 0;
  G.healFlash = 0;
  G.flash = 0;
  G.lowHealth = 0;
  G.hintTime = 0;
  G.deathTimer = 0;
  G.bossDefeatTimer = 0;
  G.castHeld = false;
  G.pendingVictory = false;
  G.heartTimer = 0;
  G.metrics = computeMetrics();
  G.player = makePlayer();
  G.speed = G.metrics.speed;
  G.prevGap = H * 0.5;
  G.spawnTimer = G.metrics.spacing / G.speed;

  spawnObstacle(W + 140);
  for (let i = 0; i < 3; i++) {
    G.pickups.push({
      x: W * 0.72 + i * W * 0.11,
      baseY: H * 0.48 + Math.sin(i * 1.2) * H * 0.05,
      kind: 'soul',
      phase: i * 1.4,
    });
  }
  ui.hint.classList.remove('is-hidden');
  syncFlasks();
  hideBossHud();
  updateRecordDisplay();
}

function baseGapHeight() {
  return clamp(H * 0.315 - Math.min(64, G.distance * 0.075), 170, 305);
}

function spawnObstacle(x) {
  const m = G.metrics;
  const gapH = baseGapHeight();
  const margin = H * 0.12;
  let gapY = G.prevGap + rand(-0.21, 0.21) * H;
  gapY = clamp(gapY, gapH * 0.5 + margin, H - gapH * 0.5 - margin);
  G.prevGap = gapY;
  const w = m.obstacleW * rand(0.88, 1.12);
  const seed = rand(0, 1000);
  G.obstacles.push({ x, w, gapY, gapH, seed, passed: false });

  const soulY = clamp(gapY + rand(-gapH * 0.16, gapH * 0.16), gapY - gapH * 0.22, gapY + gapH * 0.22);
  G.pickups.push({
    x: x + w * 0.48,
    baseY: soulY,
    kind: 'soul',
    phase: rand(0, TAU),
  });

  if (Math.random() < 0.36) {
    G.pickups.push({
      x: x + w * 0.5 + rand(-18, 28),
      baseY: clamp(gapY + rand(-gapH * 0.2, gapH * 0.2), 60, H - 60),
      kind: 'soul',
      phase: rand(0, TAU),
    });
  }

  if (G.player && G.player.health < G.player.maxHealth && G.obstacles.length % 4 === 2) {
    G.pickups.push({
      x: x + w * 0.52,
      baseY: gapY,
      kind: 'estus',
      phase: rand(0, TAU),
    });
  }
}

function updateGame(dt) {
  G.time += dt;
  G.stateTime += dt;

  G.shake = Math.max(0, G.shake - dt * 32);
  G.hurtFlash = Math.max(0, G.hurtFlash - dt * 2.2);
  G.healFlash = Math.max(0, G.healFlash - dt * 2);
  G.flash = Math.max(0, G.flash - dt * 3.4);

  if (G.state === 'title' || G.state === 'paused' || G.state === 'gameover' || G.state === 'victory') {
    return;
  }

  if (G.state === 'dying') {
    updateDying(dt);
    updateParticles(dt);
    updateFloaters(dt);
    return;
  }

  if (G.state === 'bossDefeat') {
    updateBossDefeat(dt);
    updateParticles(dt);
    updateFloaters(dt);
    return;
  }

  if (G.state === 'playing') {
    updateTraversal(dt);
  } else if (G.state === 'boss') {
    updateBossFight(dt);
  }

  updateParticles(dt);
  updateFloaters(dt);

  if (G.player) {
    G.lowHealth = G.player.health === 1 ? 1 : 0;
  }
}

function updateTraversal(dt) {
  const p = G.player;
  G.speed = G.metrics.speed + Math.min(105, G.distance * 0.16);
  G.distance += dt * (8.5 + G.speed * 0.025);
  G.bgScroll += G.speed * dt;
  G.hintTime += dt;
  if (G.hintTime > 7.5) ui.hint.classList.add('is-hidden');

  updatePlayerMotion(dt);

  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0) {
    spawnObstacle(W + 120);
    G.spawnTimer = G.metrics.spacing / Math.max(180, G.speed);
  }

  for (let i = G.obstacles.length - 1; i >= 0; i--) {
    const o = G.obstacles[i];
    o.x -= G.speed * dt;
    if (!o.passed && o.x + o.w < p.x) {
      o.passed = true;
      G.souls += 4;
      spawnSpark(p.x - p.r, p.y, 3, 'rgba(127, 226, 239, ALPHA)', 1.6);
    }
    if (o.x < -220) G.obstacles.splice(i, 1);
  }

  for (let i = G.pickups.length - 1; i >= 0; i--) {
    const item = G.pickups[i];
    item.x -= G.speed * dt;
    if (item.x < -80) {
      G.pickups.splice(i, 1);
      continue;
    }
    const iy = item.baseY + Math.sin(G.time * 2.1 + item.phase) * 6;
    const rr = item.kind === 'estus' ? 26 : 21;
    if (dist(p.x, p.y, item.x, iy) < p.r + rr) {
      if (item.kind === 'estus') {
        if (p.health < p.maxHealth) {
          healPlayer('estus');
        } else {
          addSouls(24, item.x, iy);
          spawnBurst(item.x, iy, 9, ['rgba(255, 199, 105, ALPHA)', 'rgba(255, 136, 47, ALPHA)'], 120);
        }
        sound.heal();
      } else {
        addSouls(9, item.x, iy);
        sound.collect();
        spawnBurst(item.x, iy, 8, ['rgba(157, 245, 255, ALPHA)', 'rgba(82, 194, 231, ALPHA)'], 90);
      }
      G.pickups.splice(i, 1);
    }
  }

  checkObstacleCollisions();
  checkBossTrigger();
}

function updatePlayerMotion(dt) {
  const p = G.player;
  p.castCd = Math.max(0, p.castCd - dt);
  p.castAnim = Math.max(0, p.castAnim - dt * 5);
  p.iframes = Math.max(0, p.iframes - dt);
  p.wing = Math.max(0, p.wing - dt * 2.2);

  if (G.castHeld && p.castCd <= 0) castSoulBolt();

  if (G.startHover > 0 && G.state === 'playing') {
    G.startHover -= dt;
    const targetY = H * 0.455 + Math.sin(G.time * 2.2) * 7;
    p.y = lerp(p.y, targetY, 1 - Math.exp(-dt * 8));
    p.vy = 0;
    p.rot = lerp(p.rot, 0, 1 - Math.exp(-dt * 8));
    emitPlayerTrail(dt);
    if (G.startHover <= 0) p.wing = 1;
    return;
  }

  p.vy += G.metrics.gravity * dt;
  p.y += p.vy * dt;
  p.knockX = lerp(p.knockX, 0, 1 - Math.exp(-dt * 6));
  p.x = G.metrics.playerX + p.knockX;
  const rotTarget = clamp(p.vy / 1800, -0.4, 0.55);
  p.rot = lerp(p.rot, rotTarget, 1 - Math.exp(-dt * 9));

  const ceiling = 8;
  const floor = H - 8;
  if (p.y - p.r < ceiling) {
    p.y = ceiling + p.r;
    if (p.vy < 0) p.vy = 0;
    if (G.state === 'playing' || G.state === 'boss') damagePlayer('ceiling');
  }
  if (p.y + p.r > floor) {
    p.y = floor - p.r;
    p.vy = -G.metrics.flap * 0.48;
    if (G.state === 'playing' || G.state === 'boss') damagePlayer('floor');
  }

  emitPlayerTrail(dt);
}

function emitPlayerTrail(dt) {
  const p = G.player;
  p.trailTimer -= dt;
  if (p.trailTimer > 0) return;
  p.trailTimer = 0.045;
  const color = Math.random() < 0.7
    ? 'rgba(236, 127, 54, ALPHA)'
    : 'rgba(112, 210, 226, ALPHA)';
  G.particles.push({
    x: p.x - 12 + rand(-5, 5),
    y: p.y + rand(-5, 8),
    vx: -rand(15, 55) - (G.state === 'playing' ? G.speed * 0.05 : 0),
    vy: rand(-15, 16),
    life: rand(0.38, 0.8),
    maxLife: 0.8,
    size: rand(1.1, 2.6),
    color,
    glow: true,
    alpha: rand(0.25, 0.65),
    gravity: -10,
    drag: 1.5,
  });
}

function flap() {
  if (G.state !== 'playing' && G.state !== 'boss') return;
  const p = G.player;
  if (!p) return;
  if (G.startHover > 0) G.startHover = 0;
  p.vy = G.metrics.flap;
  p.wing = 1;
  p.trailTimer = 0;
  sound.flap();
  for (let i = 0; i < 4; i++) {
    G.particles.push({
      x: p.x - 12 + rand(-6, 8),
      y: p.y + rand(2, 12),
      vx: rand(-80, 8),
      vy: rand(20, 80),
      life: rand(0.24, 0.55),
      maxLife: 0.55,
      size: rand(1.4, 3.2),
      color: i % 2 ? 'rgba(248, 159, 71, ALPHA)' : 'rgba(139, 222, 235, ALPHA)',
      glow: true,
      alpha: 0.65,
      gravity: 10,
      drag: 2.2,
    });
  }
}

function checkObstacleCollisions() {
  const p = G.player;
  if (p.iframes > 0 || G.state !== 'playing') return;
  for (const o of G.obstacles) {
    const topEdge = o.gapY - o.gapH * 0.5;
    const bottomEdge = o.gapY + o.gapH * 0.5;
    const rx = o.x + 9;
    const rw = o.w - 18;
    if (circleRect(p.x, p.y, p.r, rx, -40, rw, topEdge + 46) ||
        circleRect(p.x, p.y, p.r, rx, bottomEdge - 6, rw, H - bottomEdge + 46)) {
      damagePlayer('spikes');
      p.knockX = -26;
      p.vy = p.y < o.gapY ? -G.metrics.flap * 0.45 : G.metrics.flap * 0.34;
      return;
    }
  }
}

function checkBossTrigger() {
  if (G.nextBoss >= BOSS_DEFS.length) return;
  const def = BOSS_DEFS[G.nextBoss];
  if (G.distance >= def.threshold) startBoss(def);
}

function startBoss(def) {
  G.state = 'boss';
  G.stateTime = 0;
  G.speed = 0;
  G.obstacles = [];
  G.pickups = [];
  G.bolts = [];
  G.projectiles = [];
  G.beams = [];
  G.hintTime = 99;
  ui.hint.classList.add('is-hidden');

  const sc = clamp(Math.min(W, H) / 650, 0.78, 1.34);
  const targetX = W * (W < 760 ? 0.705 : 0.735);
  const baseY = H * (def.id === 'choir' ? 0.43 : 0.405);
  G.boss = {
    def,
    type: def.id,
    x: W + 190,
    y: baseY - H * 0.06,
    targetX,
    baseY,
    bob: H * (def.id === 'choir' ? 0.028 : 0.038),
    scale: sc,
    hp: def.hp,
    maxHp: def.hp,
    enterT: 0,
    t: 0,
    attackCd: 1.6,
    windup: null,
    dive: null,
    patternIndex: 0,
    phase2: false,
    flash: 0,
    dead: false,
    deathT: 0,
    hitR: 59 * sc,
  };

  const p = G.player;
  p.iframes = Math.max(p.iframes, 1.2);
  p.vy = Math.min(p.vy, -120);
  G.heartTimer = 0.8;
  G.shake = 18;

  setState('boss');
  showBossHud(def);
  updateBossFill();
  showBanner(def.kicker, def.name, '', 2300);
  sound.roar();
  G.flash = 0.16;
  G.flashColor = '#f0b46b';
  spawnBurst(W * 0.7, H * 0.4, 22, ['rgba(230, 154, 75, ALPHA)', 'rgba(132, 67, 36, ALPHA)'], 240);
}

function updateBossFight(dt) {
  const b = G.boss;
  if (!b) return;
  const p = G.player;

  updatePlayerMotion(dt);
  b.t += dt;
  b.flash = Math.max(0, b.flash - dt * 4.5);

  if (b.dead) {
    b.deathT += dt;
    return;
  }

  if (b.enterT < 1) {
    b.enterT = Math.min(1, b.enterT + dt / 1.45);
    const k = easeOutCubic(b.enterT);
    b.x = lerp(W + 190, b.targetX, k);
    b.y = b.baseY - H * 0.06 * (1 - k) + Math.sin(b.t * 1.2) * b.bob * 0.4;
    if (b.enterT >= 0.72) b.attackCd = Math.min(b.attackCd, 0.9);
  } else if (b.dive) {
    updateBossDive(dt);
  } else {
    b.x = lerp(b.x, b.targetX, 1 - Math.exp(-dt * 4));
    const targetY = b.baseY + Math.sin(b.t * 1.15) * b.bob;
    b.y = lerp(b.y, targetY, 1 - Math.exp(-dt * 2.3));

    if (b.windup) {
      b.windup.t -= dt;
      if (b.windup.t <= 0) {
        const done = b.windup;
        b.windup = null;
        executeBossAttack(done);
      }
    } else {
      b.attackCd -= dt;
      if (b.attackCd <= 0) chooseBossAttack();
    }
  }

  if (b.enterT >= 1 && !b.dead) {
    const contactR = b.hitR * (b.dive ? 0.92 : 0.76);
    if (dist(p.x, p.y, b.x, b.y) < contactR + p.r) {
      damagePlayer('boss');
      p.vy = -G.metrics.flap * 0.65;
      p.knockX = -20;
    }
  }

  G.heartTimer -= dt;
  if (G.heartTimer <= 0) {
    sound.thump(b.phase2);
    G.heartTimer = b.phase2 ? 0.66 : 1;
  }

  updateBolts(dt);
  updateProjectiles(dt);
  updateBeams(dt);
}

function chooseBossAttack() {
  const b = G.boss;
  const p = G.player;
  const def = b.def;
  const kind = def.patterns[b.patternIndex % def.patterns.length];
  b.patternIndex++;
  const speedUp = b.phase2 ? 0.84 : 1;
  let warn = 0.55;
  const data = {};

  if (kind === 'beam') {
    warn = 0.92;
    data.y = clamp(p.y, H * 0.17, H * 0.83);
  } else if (kind === 'rain') {
    warn = 0.88;
    const total = b.phase2 ? 6 : 4;
    const base = p.x;
    const spread = Math.min(W * 0.44, 460);
    data.xs = [];
    for (let i = 0; i < total; i++) {
      const t = total === 1 ? 0.5 : i / (total - 1);
      data.xs.push(clamp(base + (t - 0.5) * spread + rand(-W * 0.04, W * 0.04), 35, W - 35));
    }
  } else if (kind === 'dive' || kind === 'dash') {
    warn = 0.6;
    data.x = clamp(W * (kind === 'dash' ? 0.48 : 0.4), W * 0.3, W * 0.55);
    data.y = p.y;
  } else if (kind === 'radial') {
    warn = 0.66;
  } else {
    warn = 0.46;
  }

  b.windup = {
    kind,
    t: warn * speedUp,
    total: warn * speedUp,
    data,
  };
  sound.tone(kind === 'beam' ? 118 : 86, 0.3, 'sine', 0.035, kind === 'beam' ? 72 : 56);
}

function executeBossAttack(w) {
  const b = G.boss;
  if (!b || b.dead) return;
  const p = G.player;
  const def = b.def;
  const color = def.id === 'choir' ? 'rgba(132, 237, 251, 0.9)' : def.id === 'cinder' ? 'rgba(255, 119, 49, 0.95)' : 'rgba(255, 178, 81, 0.95)';
  const core = def.id === 'choir' ? 'rgba(236, 255, 255, 0.98)' : 'rgba(255, 246, 210, 0.98)';

  if (w.kind === 'fan') {
    const count = b.phase2 ? 5 : 3;
    const baseAngle = Math.atan2(p.y - b.y, p.x - b.x);
    const speed = clamp(W * 0.22, 175, 325);
    for (let i = 0; i < count; i++) {
      const a = baseAngle + (i - (count - 1) / 2) * 0.17;
      spawnProjectile(b.x - 22, b.y + 5, Math.cos(a) * speed, Math.sin(a) * speed, {
        color, core, r: clamp(8 * b.scale, 6.4, 9.5),
      });
    }
    sound.tone(260, 0.2, 'sawtooth', 0.04, 520);
    sound.noiseBurst(0.18, 800, 0.025, 'bandpass');
  } else if (w.kind === 'radial') {
    const count = b.phase2 ? 14 : 10;
    const speed = clamp(W * 0.16, 120, 235);
    const offset = Math.random() * TAU;
    for (let i = 0; i < count; i++) {
      const a = offset + (i / count) * TAU;
      spawnProjectile(b.x, b.y, Math.cos(a) * speed, Math.sin(a) * speed, {
        color, core, r: clamp(8.5 * b.scale, 6.6, 10),
      });
    }
    sound.tone(330, 0.4, 'triangle', 0.045, 130);
    G.shake = Math.max(G.shake, 8);
  } else if (w.kind === 'rain') {
    const speed = H * (b.phase2 ? 0.52 : 0.43);
    for (const x of w.data.xs) {
      spawnProjectile(x, -24, rand(-12, 12), speed, {
        color,
        core,
        r: clamp(9 * b.scale, 7, 11),
        kind: 'ember',
      });
    }
    sound.tone(150, 0.5, 'sawtooth', 0.05, 70);
  } else if (w.kind === 'beam') {
    const width = clamp(H * 0.032, 18, 34);
    G.beams.push({ y: w.data.y, t: 0, life: 0.42, x2: b.x, width, hit: false });
    sound.tone(90, 0.65, 'sawtooth', 0.11, 35);
    sound.noiseBurst(0.5, 500, 0.06, 'bandpass');
    G.shake = 16;
    G.flash = 0.12;
    G.flashColor = def.color;
  } else if (w.kind === 'dive' || w.kind === 'dash') {
    b.dive = {
      t: 0,
      dur: w.kind === 'dash' ? 1.02 : 1.28,
      fromX: b.x,
      fromY: b.y,
      targetX: w.data.x,
      targetY: w.data.y,
    };
    sound.tone(80, 0.85, 'sawtooth', 0.1, 38);
    G.shake = Math.max(G.shake, 10);
  }

  b.attackCd = (b.phase2 ? def.cooldown2 : def.cooldown) * (b.phase2 ? 0.9 : 1);
}

function updateBossDive(dt) {
  const b = G.boss;
  const d = b.dive;
  d.t += dt;
  const u = clamp(d.t / d.dur, 0, 1);
  const k = u < 0.44
    ? easeInOutCubic(u / 0.44)
    : 1 - easeInOutCubic((u - 0.44) / 0.56);
  b.x = lerp(d.fromX, d.targetX, k);
  b.y = lerp(d.fromY, d.targetY, k);
  if (u >= 1) {
    b.dive = null;
    b.x = b.targetX;
    b.y = b.baseY;
    b.attackCd = Math.min(b.attackCd, 0.9);
  }
}

function spawnProjectile(x, y, vx, vy, opts = {}) {
  G.projectiles.push({
    x,
    y,
    vx,
    vy,
    r: opts.r || 8,
    kind: opts.kind || 'orb',
    color: opts.color || 'rgba(255, 148, 74, 0.9)',
    core: opts.core || 'rgba(255, 247, 218, 0.98)',
    life: opts.life || 6,
    rot: rand(0, TAU),
    phase: rand(0, TAU),
  });
}

function updateProjectiles(dt) {
  const p = G.player;
  for (let i = G.projectiles.length - 1; i >= 0; i--) {
    const pr = G.projectiles[i];
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.rot += dt * 3;
    pr.life -= dt;
    if (pr.life <= 0 || pr.x < -120 || pr.x > W + 160 || pr.y < -140 || pr.y > H + 140) {
      G.projectiles.splice(i, 1);
      continue;
    }
    if (p.iframes <= 0 && dist(p.x, p.y, pr.x, pr.y) < p.r + pr.r * 0.82) {
      G.projectiles.splice(i, 1);
      damagePlayer('projectile');
      p.vy = -G.metrics.flap * 0.5;
      for (let j = 0; j < 12; j++) {
        spawnSpark(pr.x, pr.y, 1, 'rgba(255, 128, 52, ALPHA)', 2.5);
      }
    }
  }
}

function updateBeams(dt) {
  const p = G.player;
  for (let i = G.beams.length - 1; i >= 0; i--) {
    const b = G.beams[i];
    b.t += dt;
    if (!b.hit && b.t < b.life * 0.72 && p.iframes <= 0) {
      if (Math.abs(p.y - b.y) < b.width * 1.1 + p.r) {
        b.hit = true;
        damagePlayer('beam');
        p.vy = -G.metrics.flap * 0.7;
      }
    }
    if (b.t >= b.life) G.beams.splice(i, 1);
  }
}

function castSoulBolt() {
  const p = G.player;
  if (!p || (G.state !== 'playing' && G.state !== 'boss')) return;
  if (p.castCd > 0) return;
  p.castCd = 0.34;
  p.castAnim = 1;
  const b = G.boss;
  let angle = 0;
  if (b && !b.dead) {
    angle = Math.atan2(b.y - p.y, b.x - p.x);
  }
  const speed = clamp(W * 0.68, 720, 990);
  G.bolts.push({
    x: p.x + 26,
    y: p.y - 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1.85,
    dmg: 16,
    speed,
  });
  sound.cast();
  p.vy += 16;
  for (let i = 0; i < 5; i++) {
    spawnSpark(p.x + 30, p.y - 2, 1, 'rgba(139, 237, 255, ALPHA)', 2);
  }
}

function updateBolts(dt) {
  const b = G.boss;
  for (let i = G.bolts.length - 1; i >= 0; i--) {
    const bolt = G.bolts[i];
    bolt.life -= dt;
    if (bolt.life <= 0) {
      G.bolts.splice(i, 1);
      continue;
    }

    if (b && !b.dead) {
      const dx = b.x - bolt.x;
      const dy = b.y - bolt.y;
      const d = Math.hypot(dx, dy) || 1;
      bolt.vx += (dx / d) * 1250 * dt;
      bolt.vy += (dy / d) * 1250 * dt;
      const sp = Math.hypot(bolt.vx, bolt.vy) || 1;
      const target = Math.max(bolt.speed * 1.04, 760);
      bolt.vx = bolt.vx / sp * target;
      bolt.vy = bolt.vy / sp * target;
    }

    bolt.x += bolt.vx * dt;
    bolt.y += bolt.vy * dt;

    // Soul bolts can intercept incoming missiles.
    let intercepted = false;
    for (let j = G.projectiles.length - 1; j >= 0; j--) {
      const pr = G.projectiles[j];
      if (dist(bolt.x, bolt.y, pr.x, pr.y) < pr.r + 9) {
        G.projectiles.splice(j, 1);
        G.bolts.splice(i, 1);
        interceptKill(bolt.x, bolt.y);
        intercepted = true;
        break;
      }
    }
    if (intercepted) continue;

    if (b && !b.dead && b.enterT >= 0.92 && dist(bolt.x, bolt.y, b.x, b.y) < b.hitR + 7) {
      G.bolts.splice(i, 1);
      damageBoss(bolt.dmg);
      continue;
    }

    if (bolt.x < -80 || bolt.x > W + 120 || bolt.y < -100 || bolt.y > H + 100) {
      G.bolts.splice(i, 1);
    }
  }
}

function interceptKill(x, y) {
  sound.tone(760, 0.18, 'triangle', 0.035, 1240);
  for (let i = 0; i < 10; i++) {
    spawnSpark(x, y, 1, 'rgba(186, 249, 255, ALPHA)', 2.4);
  }
}

function damageBoss(dmg) {
  const b = G.boss;
  if (!b || b.dead || b.enterT < 0.7) return;
  b.hp = Math.max(0, b.hp - dmg);
  b.flash = 1;
  G.shake = Math.max(G.shake, 7);
  sound.hitBoss();
  updateBossFill();
  for (let i = 0; i < 9; i++) {
    spawnSpark(b.x + rand(-b.hitR * 0.3, b.hitR * 0.3), b.y + rand(-b.hitR * 0.3, b.hitR * 0.3), 1, 'rgba(163, 244, 255, ALPHA)', 3);
  }

  if (!b.phase2 && b.hp <= b.maxHp * 0.5) {
    b.phase2 = true;
    b.windup = null;
    b.attackCd = 0.75;
    sound.roar();
    G.flash = 0.2;
    G.flashColor = b.def.id === 'choir' ? '#b3f1ff' : '#ffb06c';
    G.shake = 18;
    showBanner('The keeper remembers fury', b.def.name, 'is-blood', 1600);
    spawnBurst(b.x, b.y, 25, ['rgba(255, 180, 86, ALPHA)', 'rgba(255, 96, 41, ALPHA)'], 260);
  }

  if (b.hp <= 0) killBoss();
}

function killBoss() {
  const b = G.boss;
  if (!b || b.dead) return;
  b.dead = true;
  b.deathT = 0;
  b.windup = null;
  b.dive = null;
  b.flash = 0;
  G.projectiles = [];
  G.beams = [];
  G.bolts = [];
  G.state = 'bossDefeat';
  G.stateTime = 0;
  G.bossDefeatTimer = 0;
  G.souls += b.def.reward;
  G.shake = 22;
  G.flash = 0.32;
  G.flashColor = '#ffe1aa';
  sound.roar();
  sound.victory();
  spawnBurst(b.x, b.y, 44, ['rgba(255, 205, 115, ALPHA)', 'rgba(255, 117, 48, ALPHA)', 'rgba(135, 234, 245, ALPHA)'], 320);
  if (G.player.health < G.player.maxHealth) healPlayer('grace');
  setState('bossDefeat');
  showBanner('Great enemy felled', b.def.name, 'is-gold', 2600);
  G.pendingVictory = G.nextBoss >= BOSS_DEFS.length - 1;
  updateBossFill();
  saveBest();
}

function updateBossDefeat(dt) {
  const b = G.boss;
  const p = G.player;
  if (!b) return;
  b.t += dt;
  b.deathT += dt;
  G.bossDefeatTimer += dt;

  p.y += Math.sin(G.time * 1.6) * 12 * dt;
  p.wing = Math.max(p.wing, 0.3);
  p.rot = lerp(p.rot, -0.1, dt * 2);
  p.iframes = 1;

  // The keeper unthreads into embers.
  if (b.deathT < 2.4) {
    for (let i = 0; i < 2; i++) {
      G.particles.push({
        x: b.x + rand(-b.hitR * 0.8, b.hitR * 0.8),
        y: b.y + rand(-b.hitR * 0.7, b.hitR * 0.7),
        vx: rand(-35, 40),
        vy: rand(-95, -20),
        life: rand(0.5, 1.4),
        maxLife: 1.4,
        size: rand(1.2, 3.2),
        color: i % 2 ? 'rgba(255, 195, 106, ALPHA)' : 'rgba(134, 228, 240, ALPHA)',
        glow: true,
        alpha: 0.7,
        gravity: -12,
        drag: 0.7,
      });
    }
  }

  if (G.bossDefeatTimer > 3.15) finishBoss();
}

function finishBoss() {
  const wasFinal = G.nextBoss >= BOSS_DEFS.length - 1;
  G.nextBoss++;
  G.boss = null;
  G.projectiles = [];
  G.beams = [];
  G.bolts = [];
  hideBossHud();

  if (wasFinal) {
    triggerVictory();
    return;
  }

  G.state = 'playing';
  G.stateTime = 0;
  G.speed = G.metrics.speed;
  G.spawnTimer = 1.1;
  G.prevGap = H * 0.5;
  G.obstacles = [];
  G.pickups = [];
  G.player.iframes = 1.2;
  G.hintTime = 99;
  spawnObstacle(W + 130);
  setState('playing');
  showBanner('The way opens', 'Descend deeper', '', 1900);
}

function addSouls(n, x, y, silent = true) {
  G.souls += n;
  if (x !== undefined) {
    G.floaters.push({
      text: `+${n}`,
      x,
      y: y - 18,
      vy: -36,
      life: 0.9,
      maxLife: 0.9,
      size: clamp(Math.min(W, H) * 0.019, 12, 17),
      color: '#a9f5ff',
      shadow: '#4bbad5',
    });
  }
  if (!silent) sound.collect();
}

function healPlayer(source) {
  const p = G.player;
  if (!p) return;
  if (p.health >= p.maxHealth) {
    addSouls(18, p.x, p.y);
    return;
  }
  p.health = Math.min(p.maxHealth, p.health + 1);
  G.healFlash = 1;
  G.lowHealth = p.health === 1 ? 1 : 0;
  syncFlasks('heal');
  sound.heal();
  for (let i = 0; i < 18; i++) {
    G.particles.push({
      x: p.x + rand(-22, 22),
      y: p.y + rand(-22, 22),
      vx: rand(-25, 25),
      vy: rand(-70, -10),
      life: rand(0.4, 1.1),
      maxLife: 1.1,
      size: rand(1.1, 2.8),
      color: 'rgba(255, 207, 110, ALPHA)',
      glow: true,
      alpha: 0.8,
      gravity: -20,
      drag: 1,
    });
  }
}

function damagePlayer(source) {
  const p = G.player;
  if (!p || p.iframes > 0 || (G.state !== 'playing' && G.state !== 'boss')) return;
  if (source === 'floor' && G.startHover > 0.7) return;
  p.health = Math.max(0, p.health - 1);
  p.iframes = 1.4;
  G.hurtFlash = 1;
  G.shake = Math.max(G.shake, 14);
  G.lowHealth = p.health === 1 ? 1 : 0;
  syncFlasks('hurt');
  sound.hurt();
  spawnBurst(p.x, p.y, 16, ['rgba(235, 84, 50, ALPHA)', 'rgba(148, 34, 22, ALPHA)'], 190);

  if (p.health <= 0) die();
}

function die() {
  if (G.state === 'dying' || G.state === 'gameover') return;
  const p = G.player;
  p.health = 0;
  G.state = 'dying';
  G.stateTime = 0;
  G.deathTimer = 0;
  G.speed = 0;
  G.projectiles = [];
  G.beams = [];
  G.shake = 20;
  G.flash = 0.12;
  G.flashColor = '#9e1e1b';
  sound.death();
  spawnBurst(p.x, p.y, 34, ['rgba(224, 82, 47, ALPHA)', 'rgba(106, 24, 18, ALPHA)', 'rgba(134, 220, 229, ALPHA)'], 260);
  setState('dying');
  saveBest();
}

function updateDying(dt) {
  const p = G.player;
  G.deathTimer += dt;
  if (p) {
    p.vy += G.metrics.gravity * 0.55 * dt;
    p.y += p.vy * dt;
    p.rot += dt * 1.8;
    if (p.y > H + 80) p.y = H + 80;
  }
  G.shake = Math.max(0, G.shake - dt * 20);
}

function updateParticles(dt) {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      G.particles.splice(i, 1);
      continue;
    }
    const damp = Math.exp(-p.drag * dt);
    p.vx *= damp;
    p.vy = p.vy * damp + p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  if (G.particles.length > 420) G.particles.splice(0, G.particles.length - 420);
}

function updateFloaters(dt) {
  for (let i = G.floaters.length - 1; i >= 0; i--) {
    const f = G.floaters[i];
    f.life -= dt;
    f.y += f.vy * dt;
    if (f.life <= 0) G.floaters.splice(i, 1);
  }
}

function spawnBurst(x, y, count, colors, speed = 180) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, TAU);
    const s = rand(speed * 0.2, speed);
    G.particles.push({
      x: x + rand(-6, 6),
      y: y + rand(-6, 6),
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 20,
      life: rand(0.35, 1.15),
      maxLife: 1.15,
      size: rand(1.4, 4),
      color: colors[randInt(0, colors.length - 1)],
      glow: true,
      alpha: rand(0.35, 0.9),
      gravity: rand(-35, 30),
      drag: rand(0.6, 1.8),
    });
  }
}

function spawnSpark(x, y, count, color, speed) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, TAU);
    const s = rand(8, speed * 26);
    G.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(0.2, 0.55),
      maxLife: 0.55,
      size: rand(1, 2.4),
      color,
      glow: true,
      alpha: 0.8,
      gravity: 12,
      drag: 2,
    });
  }
}

function currentScore() {
  return G.souls + Math.floor(G.distance);
}

function saveBest() {
  const score = currentScore();
  if (score > G.best) {
    G.best = score;
    safeSet('hollowwing-best', String(G.best));
  }
  updateRecordDisplay();
}
