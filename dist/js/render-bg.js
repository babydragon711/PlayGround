'use strict';

// ---------------------------------------------------------------------------
// Cave backdrop, atmosphere, and the title diorama
// ---------------------------------------------------------------------------

function drawBackground(t, scroll, mode = 'game') {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0a141d');
  sky.addColorStop(0.22, '#0e1c25');
  sky.addColorStop(0.52, '#12222b');
  sky.addColorStop(0.78, '#0c161d');
  sky.addColorStop(1, '#050a0f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // A breath of cold light deep in the cave.
  const breath = ctx.createRadialGradient(W * 0.62, H * 0.46, 0, W * 0.62, H * 0.46, Math.max(W, H) * 0.55);
  breath.addColorStop(0, 'rgba(68, 116, 121, 0.24)');
  breath.addColorStop(0.45, 'rgba(30, 58, 66, 0.12)');
  breath.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = breath;
  ctx.fillRect(0, 0, W, H);

  drawFarCave(scroll * 0.15, t);
  drawLightShaft(t, mode);
  drawMistBands(t, scroll, mode);
  drawMidCave(scroll * 0.36, t, mode);
  drawNearCave(scroll * 0.82, t);
  drawMotes(t);

  if (mode === 'title') {
    drawTitleDiorama(t);
  } else {
    const dark = ctx.createLinearGradient(0, H * 0.52, 0, H);
    dark.addColorStop(0, 'rgba(2, 4, 7, 0)');
    dark.addColorStop(1, 'rgba(2, 4, 7, 0.5)');
    ctx.fillStyle = dark;
    ctx.fillRect(0, H * 0.52, W, H * 0.48);
  }
}

function drawFarCave(cam, t) {
  const spacing = Math.max(390, W * 0.34);
  const base = Math.floor(cam / spacing);
  const off = -(cam - base * spacing);
  const count = Math.ceil(W / spacing) + 2;

  for (let i = -1; i < count; i++) {
    const idx = base + i;
    const x = off + i * spacing;
    const s = hash01(idx * 2.17 + 0.4);
    const s2 = hash01(idx * 6.41 + 8.7);
    const slab = 15 + s * 16;
    const cx = x + spacing * (0.3 + s2 * 0.38);
    const tip = 80 + s * 210;

    ctx.fillStyle = 'rgba(17, 29, 37, 0.9)';
    ctx.beginPath();
    ctx.moveTo(x - 20, 0);
    ctx.lineTo(x + spacing + 20, 0);
    ctx.lineTo(x + spacing + 20, slab + 8);
    ctx.lineTo(cx + 58, slab + 20);
    ctx.lineTo(cx + 26, slab + tip * 0.42);
    ctx.lineTo(cx + 7, slab + tip * 0.7);
    ctx.lineTo(cx, slab + tip);
    ctx.lineTo(cx - 24, slab + tip * 0.61);
    ctx.lineTo(cx - 53, slab + tip * 0.3);
    ctx.lineTo(x - 20, slab + 4);
    ctx.closePath();
    ctx.fill();

    const floorH = 48 + s2 * 95;
    const fy = H - floorH;
    ctx.fillStyle = 'rgba(12, 22, 29, 0.95)';
    ctx.beginPath();
    ctx.moveTo(x - 20, H);
    ctx.lineTo(x + spacing + 20, H);
    ctx.lineTo(x + spacing + 20, fy + 18);
    ctx.lineTo(x + spacing * 0.73, fy + 8);
    ctx.lineTo(x + spacing * 0.55, fy + 28);
    ctx.lineTo(x + spacing * 0.32, fy - 3);
    ctx.lineTo(x + spacing * 0.12, fy + 23);
    ctx.lineTo(x - 20, fy + 11);
    ctx.closePath();
    ctx.fill();

    // Faint ribs of older architecture, swallowed by the rock.
    if (s > 0.56) {
      ctx.strokeStyle = 'rgba(96, 145, 145, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + spacing * 0.18, H);
      ctx.quadraticCurveTo(x + spacing * 0.42, H - 160 - s * 120, x + spacing * 0.65, H);
      ctx.stroke();
    }
  }
}

function drawLightShaft(t, mode) {
  const x = W * (mode === 'title' ? 0.62 : 0.68);
  const widthTop = W * 0.06;
  const widthBottom = W * 0.31;
  const sway = Math.sin(t * 0.08) * W * 0.02;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.78);
  g.addColorStop(0, 'rgba(111, 174, 180, 0.075)');
  g.addColorStop(0.45, 'rgba(81, 143, 153, 0.036)');
  g.addColorStop(1, 'rgba(42, 91, 105, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - widthTop, 0);
  ctx.lineTo(x + widthTop, 0);
  ctx.lineTo(x + widthBottom + sway, H * 0.78);
  ctx.lineTo(x - widthBottom + sway, H * 0.78);
  ctx.closePath();
  ctx.fill();

  const core = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  core.addColorStop(0, 'rgba(174, 221, 219, 0.045)');
  core.addColorStop(1, 'rgba(102, 170, 172, 0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(x - widthTop * 0.25, 0);
  ctx.lineTo(x + widthTop * 0.25, 0);
  ctx.lineTo(x + widthBottom * 0.36 + sway, H * 0.65);
  ctx.lineTo(x - widthBottom * 0.36 + sway, H * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMistBands(t, scroll, mode) {
  ctx.save();
  const bands = [
    { y: 0.57, h: 0.18, a: 0.05, speed: 0.06, off: 0 },
    { y: 0.7, h: 0.12, a: 0.038, speed: 0.1, off: 180 },
    { y: 0.39, h: 0.14, a: 0.03, speed: 0.04, off: 340 },
  ];
  for (const band of bands) {
    const drift = ((scroll * band.speed + t * 3 + band.off) % (W + 500)) - 250;
    const x = mode === 'title' ? drift - 100 : W * 0.3 - drift * 0.16;
    const g = ctx.createRadialGradient(x, H * band.y, 0, x, H * band.y, W * 0.62);
    g.addColorStop(0, `rgba(105, 137, 137, ${band.a * 2.4})`);
    g.addColorStop(0.5, `rgba(70, 103, 110, ${band.a})`);
    g.addColorStop(1, 'rgba(30, 45, 50, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, H * band.y, W * 0.66, H * band.h, -0.05, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawMidCave(cam, t, mode) {
  const spacing = Math.max(520, W * 0.46);
  const base = Math.floor(cam / spacing);
  const off = -(cam - base * spacing);
  const count = Math.ceil(W / spacing) + 2;

  for (let i = -1; i < count; i++) {
    const idx = base + i;
    const x = off + i * spacing;
    const s = hash01(idx * 4.11 + 2.7);
    const s2 = hash01(idx * 8.83 + 1.2);

    // Jagged hanging rock.
    const cx = x + spacing * (0.18 + s * 0.5);
    const tip = H * (0.08 + s * 0.16);
    ctx.fillStyle = 'rgba(15, 26, 34, 0.97)';
    ctx.beginPath();
    ctx.moveTo(x - 30, 0);
    ctx.lineTo(x + spacing * 0.42, 0);
    ctx.lineTo(x + spacing * 0.4, H * 0.02);
    ctx.lineTo(cx + 33, H * 0.045);
    ctx.lineTo(cx + 12, tip * 0.52);
    ctx.lineTo(cx, tip);
    ctx.lineTo(cx - 21, tip * 0.48);
    ctx.lineTo(cx - 62, H * 0.055);
    ctx.lineTo(x - 30, H * 0.03);
    ctx.closePath();
    ctx.fill();

    // A drowned gothic arch, barely visible beyond the columns.
    if (s2 > 0.2 && mode !== 'title') {
      const ax = x + spacing * 0.18;
      const aw = spacing * 0.42;
      const top = H * (0.19 + s * 0.08);
      ctx.strokeStyle = 'rgba(115, 154, 153, 0.085)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(ax, H * 0.78);
      ctx.lineTo(ax, H * 0.47);
      ctx.quadraticCurveTo(ax + aw * 0.5, top, ax + aw, H * 0.47);
      ctx.lineTo(ax + aw, H * 0.78);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(34, 54, 57, 0.22)';
      ctx.lineWidth = 17;
      ctx.beginPath();
      ctx.moveTo(ax - 9, H * 0.78);
      ctx.lineTo(ax - 9, H * 0.47);
      ctx.quadraticCurveTo(ax + aw * 0.5, top - 10, ax + aw + 9, H * 0.47);
      ctx.lineTo(ax + aw + 9, H * 0.78);
      ctx.stroke();
    }

    // Broken pillar rising from the dark.
    if (i !== -1 || s2 > 0.3) {
      const px = x + spacing * (0.58 + s2 * 0.16);
      const pw = 26 + s * 36;
      const ph = H * (0.14 + s2 * 0.22);
      const py = H - ph;
      const grad = ctx.createLinearGradient(px, py, px + pw, py);
      grad.addColorStop(0, 'rgba(35, 47, 54, 0.99)');
      grad.addColorStop(0.45, 'rgba(19, 30, 37, 0.98)');
      grad.addColorStop(1, 'rgba(8, 13, 18, 0.98)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(px, H);
      ctx.lineTo(px + 3, py + 17);
      ctx.lineTo(px + pw * 0.2, py + 7);
      ctx.lineTo(px + pw * 0.45, py + 13);
      ctx.lineTo(px + pw * 0.72, py + 2);
      ctx.lineTo(px + pw - 3, py + 15);
      ctx.lineTo(px + pw, H);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(132, 176, 171, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 7, py + 29);
      ctx.lineTo(px + pw - 8, py + 22);
      ctx.moveTo(px + 4, H - ph * 0.38);
      ctx.lineTo(px + pw - 4, H - ph * 0.34);
      ctx.stroke();

      if (s > 0.16) drawTorch(px + pw * 0.42, py - 12, t, idx);
    }

    // Old chains disappearing into the ceiling.
    if (s2 > 0.72) {
      const chx = x + spacing * 0.34;
      const chLen = 45 + s * 80;
      ctx.strokeStyle = 'rgba(82, 91, 91, 0.17)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(chx, H * 0.04);
      for (let c = 0; c < chLen; c += 9) {
        const o = Math.sin(c * 0.8 + t * 0.4) * 1.3;
        ctx.lineTo(chx + o, H * 0.04 + c);
      }
      ctx.stroke();
    }
  }
}

function drawTorch(x, y, t, seed) {
  const flicker = Math.sin(t * 8.3 + seed) * 0.16 + Math.sin(t * 13.7 + seed * 2) * 0.1;
  const size = clamp(Math.min(W, H) * 0.018, 10, 18);
  const glowR = size * 7;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(x, y - size * 0.5, 0, x, y - size * 0.5, glowR);
  glow.addColorStop(0, 'rgba(255, 148, 65, 0.17)');
  glow.addColorStop(0.32, 'rgba(235, 102, 40, 0.07)');
  glow.addColorStop(1, 'rgba(100, 35, 10, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - size * 0.5, glowR, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = '#171817';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 4, y + size * 1.7);
  ctx.lineTo(x, y + size * 0.45);
  ctx.stroke();
  ctx.fillStyle = '#2a2420';
  roundRectPath(ctx, x - size * 0.42, y, size * 0.84, size * 0.55, 2);
  ctx.fill();

  const fh = size * (1.35 + flicker);
  const fw = size * (0.62 + flicker * 0.3);
  ctx.save();
  ctx.translate(x, y - size * 0.1);
  ctx.rotate(flicker * 0.06);
  const flame = ctx.createLinearGradient(0, 0, 0, -fh);
  flame.addColorStop(0, '#ffb14e');
  flame.addColorStop(0.4, '#ff7b2d');
  flame.addColorStop(0.78, '#f0471f');
  flame.addColorStop(1, 'rgba(150, 25, 8, 0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(-fw, 0);
  ctx.quadraticCurveTo(-fw * 0.9, -fh * 0.42, 0, -fh);
  ctx.quadraticCurveTo(fw * 0.96, -fh * 0.4, fw, 0);
  ctx.quadraticCurveTo(0, fh * 0.22, -fw, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 224, 154, 0.82)';
  ctx.beginPath();
  ctx.ellipse(0, -fh * 0.28, fw * 0.36, fh * 0.3, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawNearCave(cam, t) {
  const spacing = Math.max(700, W * 0.62);
  const base = Math.floor(cam / spacing);
  const off = -(cam - base * spacing);
  const count = Math.ceil(W / spacing) + 2;

  ctx.fillStyle = 'rgba(2, 4, 6, 0.97)';
  for (let i = -1; i < count; i++) {
    const idx = base + i;
    const x = off + i * spacing;
    const s = hash01(idx * 9.1 + 3.3);
    ctx.beginPath();
    ctx.moveTo(x - 30, 0);
    ctx.lineTo(x + spacing + 30, 0);
    ctx.lineTo(x + spacing + 30, 17 + s * 22);
    ctx.lineTo(x + spacing * 0.76, 12 + s * 18);
    ctx.lineTo(x + spacing * 0.62, 31 + s * 22);
    ctx.lineTo(x + spacing * 0.31, 9 + s * 14);
    ctx.lineTo(x - 30, 22 + s * 13);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - 30, H);
    ctx.lineTo(x + spacing + 30, H);
    ctx.lineTo(x + spacing + 30, H - 25 - s * 22);
    ctx.lineTo(x + spacing * 0.82, H - 11);
    ctx.lineTo(x + spacing * 0.63, H - 36 - s * 18);
    ctx.lineTo(x + spacing * 0.24, H - 17);
    ctx.lineTo(x - 30, H - 29 - s * 15);
    ctx.closePath();
    ctx.fill();
  }

  // Low creeping cave mist.
  ctx.save();
  const mist = ctx.createLinearGradient(0, H * 0.8, 0, H);
  mist.addColorStop(0, 'rgba(74, 103, 105, 0)');
  mist.addColorStop(0.7, 'rgba(74, 103, 105, 0.035)');
  mist.addColorStop(1, 'rgba(16, 27, 30, 0.15)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, H * 0.8, W, H * 0.2);
  ctx.restore();
}

function drawMotes(t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const m of G.motes) {
    const drift = Math.sin(t * m.sway + m.phase) * m.amp;
    const x = ((m.x * W + drift) % W + W) % W;
    const y = (((m.y - t * m.speed) % 1) + 1) % 1 * H;
    const warm = m.warm;
    const alpha = m.alpha * (0.7 + Math.sin(t * 1.4 + m.phase) * 0.3);
    ctx.fillStyle = warm
      ? `rgba(235, 170, 96, ${alpha})`
      : `rgba(123, 194, 201, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, m.size, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function makeMotes() {
  G.motes = Array.from({ length: 46 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    speed: rand(0.004, 0.024),
    sway: rand(0.2, 1.1),
    amp: rand(4, 28),
    phase: Math.random() * TAU,
    size: rand(0.5, 1.9),
    alpha: rand(0.08, 0.5),
    warm: i % 5 === 0,
  }));
}

// ---------------------------------------------------------------------------
// Title scene
// ---------------------------------------------------------------------------

function drawTitleDiorama(t) {
  const mobile = W < 760;
  const bonfireX = W * (mobile ? 0.80 : 0.76);
  const bonfireY = H * (mobile ? 0.755 : 0.855);

  // A massive keeper broods behind the fire.
  const gs = clamp(Math.min(W, H) / 720, 0.7, 1.3) * (W < 760 ? 1.25 : 1.62);
  drawBossCinder({
    x: W * 0.855,
    y: H * 0.43,
    scale: gs,
    t: t * 0.55,
    flash: 0,
    phase2: true,
  }, 0.42 + Math.sin(t * 0.8) * 0.03);

  const ground = ctx.createLinearGradient(0, H * 0.72, 0, H);
  ground.addColorStop(0, 'rgba(2, 3, 5, 0)');
  ground.addColorStop(1, 'rgba(1, 2, 3, 0.95)');
  ctx.fillStyle = ground;
  ctx.fillRect(0, H * 0.72, W, H * 0.28);

  drawBonfire(bonfireX, bonfireY, t);
  drawKneelingKnight(bonfireX - clamp(W * 0.075, 52, 92), bonfireY + 2, t);

  // Embers drifting from the bonfire.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) {
    const phase = ((t * (0.1 + (i % 5) * 0.012)) + i * 0.067) % 1;
    const sway = Math.sin(t * 1.2 + i * 2.1) * (12 + phase * 32);
    const x = bonfireX + sway + (i % 2 ? 6 : -6);
    const y = bonfireY - 20 - phase * Math.min(H * 0.45, 330);
    const a = (1 - phase) * (0.28 + (i % 3) * 0.06);
    ctx.fillStyle = `rgba(255, ${140 + (i % 4) * 18}, ${58 + (i % 3) * 20}, ${a})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.9 + (i % 3) * 0.55, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBonfire(x, y, t) {
  const unit = clamp(Math.min(W, H) * (W < 760 ? 0.105 : 0.055), 34, 58);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(x, y - unit * 0.8, 0, x, y - unit * 0.8, unit * 6.5);
  glow.addColorStop(0, 'rgba(255, 154, 62, 0.24)');
  glow.addColorStop(0.22, 'rgba(231, 99, 34, 0.13)');
  glow.addColorStop(0.6, 'rgba(121, 43, 14, 0.035)');
  glow.addColorStop(1, 'rgba(60, 20, 6, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - unit * 0.8, unit * 6.5, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Ash mound and stones.
  ctx.fillStyle = '#0c0d0e';
  ctx.beginPath();
  ctx.ellipse(x, y + unit * 0.22, unit * 2.1, unit * 0.46, 0, 0, TAU);
  ctx.fill();
  const stones = 7;
  for (let i = 0; i < stones; i++) {
    const a = (i / stones) * TAU;
    const sx = x + Math.cos(a) * unit * 1.25;
    const sy = y + Math.sin(a) * unit * 0.28 + unit * 0.08;
    ctx.fillStyle = i % 2 ? '#24221f' : '#1a1918';
    ctx.beginPath();
    ctx.ellipse(sx, sy, unit * 0.29, unit * 0.16, a * 0.3, 0, TAU);
    ctx.fill();
  }

  // Coiled sword in the ash.
  ctx.strokeStyle = '#55534b';
  ctx.lineWidth = Math.max(2, unit * 0.07);
  ctx.beginPath();
  ctx.moveTo(x - unit * 0.16, y - unit * 0.28);
  ctx.lineTo(x + unit * 0.04, y + unit * 0.16);
  ctx.stroke();
  ctx.strokeStyle = '#8d8777';
  ctx.lineWidth = Math.max(1, unit * 0.035);
  ctx.beginPath();
  ctx.moveTo(x - unit * 0.36, y - unit * 0.2);
  ctx.lineTo(x + unit * 0.16, y - unit * 0.34);
  ctx.stroke();
  ctx.strokeStyle = '#35332e';
  ctx.lineWidth = Math.max(2, unit * 0.05);
  ctx.beginPath();
  ctx.moveTo(x - unit * 0.2, y + unit * 0.1);
  ctx.quadraticCurveTo(x - unit * 0.5, y + unit * 0.2, x - unit * 0.64, y + unit * 0.34);
  ctx.stroke();

  // Flames.
  const flick = Math.sin(t * 6.7) * 0.08 + Math.sin(t * 11.3 + 2) * 0.05;
  const h = unit * (2.35 + flick);
  ctx.save();
  ctx.translate(x, y - unit * 0.12);
  const flame = ctx.createLinearGradient(0, 0, 0, -h);
  flame.addColorStop(0, '#ffbf56');
  flame.addColorStop(0.22, '#ff9c3d');
  flame.addColorStop(0.55, '#f26024');
  flame.addColorStop(0.83, '#b82d13');
  flame.addColorStop(1, 'rgba(110, 20, 5, 0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(-unit * 0.75, 0);
  ctx.bezierCurveTo(-unit * 0.86, -h * 0.32, -unit * 0.58, -h * 0.58, -unit * 0.38, -h * 0.7);
  ctx.bezierCurveTo(-unit * 0.3, -h * 0.42, -unit * 0.1, -h * 0.8, unit * 0.08, -h);
  ctx.bezierCurveTo(unit * 0.24, -h * 0.62, unit * 0.38, -h * 0.8, unit * 0.46, -h * 0.54);
  ctx.bezierCurveTo(unit * 0.76, -h * 0.34, unit * 0.78, -h * 0.12, unit * 0.72, 0);
  ctx.quadraticCurveTo(0, unit * 0.18, -unit * 0.75, 0);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 230, 155, 0.88)';
  ctx.beginPath();
  ctx.moveTo(-unit * 0.26, -unit * 0.05);
  ctx.quadraticCurveTo(-unit * 0.18, -h * 0.33, 0.02, -h * 0.55);
  ctx.quadraticCurveTo(unit * 0.18, -h * 0.24, unit * 0.1, -unit * 0.02);
  ctx.quadraticCurveTo(-unit * 0.05, unit * 0.06, -unit * 0.26, -unit * 0.05);
  ctx.fill();
  ctx.restore();
}

function drawKneelingKnight(x, y, t) {
  const u = clamp(Math.min(W, H) * 0.018, 12, 20);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(1, 2, 3, 0.86)';
  ctx.beginPath();
  ctx.moveTo(-u * 1.4, 0);
  ctx.quadraticCurveTo(-u * 1.15, -u * 1.8, -u * 0.45, -u * 2.35);
  ctx.quadraticCurveTo(0, -u * 2.8, u * 0.4, -u * 2.3);
  ctx.quadraticCurveTo(u * 1.1, -u * 1.6, u * 1.55, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(u * 0.12, -u * 2.75, u * 0.62, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-u * 0.25, -u * 3.16);
  ctx.quadraticCurveTo(-u * 0.8, -u * 3.7, -u * 1.08, -u * 3.2);
  ctx.quadraticCurveTo(-u * 0.7, -u * 3.24, -u * 0.36, -u * 2.94);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(u * 0.3, -u * 3.12);
  ctx.quadraticCurveTo(u * 0.9, -u * 3.6, u * 1.15, -u * 3.1);
  ctx.quadraticCurveTo(u * 0.75, -u * 3.17, u * 0.42, -u * 2.9);
  ctx.fill();

  // A tiny sword planted beside the knight.
  ctx.strokeStyle = 'rgba(100, 104, 100, 0.55)';
  ctx.lineWidth = Math.max(1, u * 0.08);
  ctx.beginPath();
  ctx.moveTo(u * 1.25, u * 0.1);
  ctx.lineTo(u * 1.08, -u * 2.5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(125, 112, 87, 0.4)';
  ctx.beginPath();
  ctx.moveTo(u * 0.76, -u * 2.35);
  ctx.lineTo(u * 1.38, -u * 2.43);
  ctx.stroke();
  ctx.restore();
}
