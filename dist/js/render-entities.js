'use strict';

// ---------------------------------------------------------------------------
// World entities and player rendering
// ---------------------------------------------------------------------------

function drawObstacle(o, t) {
  const topEdge = o.gapY - o.gapH * 0.5;
  const bottomEdge = o.gapY + o.gapH * 0.5;

  drawCrag(o.x, 0, o.w, topEdge, true, o.seed, t);
  drawCrag(o.x, bottomEdge, o.w, H - bottomEdge, false, o.seed + 17.3, t);

  // A pale seam of soul-light inside the rock.
  const seam = ctx.createLinearGradient(o.x, 0, o.x + o.w, 0);
  seam.addColorStop(0, 'rgba(105, 184, 188, 0.02)');
  seam.addColorStop(0.55, 'rgba(105, 184, 188, 0.075)');
  seam.addColorStop(1, 'rgba(40, 73, 77, 0.01)');
  ctx.strokeStyle = seam;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(o.x + o.w * 0.35, topEdge - 38);
  ctx.lineTo(o.x + o.w * 0.62, topEdge - 10);
  ctx.moveTo(o.x + o.w * 0.42, bottomEdge + 20);
  ctx.lineTo(o.x + o.w * 0.7, bottomEdge + 52);
  ctx.stroke();

  if (o.passed) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(130, 215, 220, 0.05)';
    ctx.fillRect(o.x + o.w - 2, topEdge, 2, o.gapH);
    ctx.restore();
  }
}

function drawCrag(x, y, w, h, ceiling, seed, t) {
  const edge = ceiling ? y + h : y;
  const dir = ceiling ? -1 : 1; // away from the gap
  const pts = [];
  const count = 9;
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    const j = hash01(seed * 11.7 + i * 3.13);
    const edgeOffset = (hash01(seed * 5.1 + i * 1.79) - 0.42) * 28;
    const spike = (i === 1 || i === 4 || i === 7) ? dir * (8 + j * 24) : 0;
    pts.push({ x: x + u * w, y: edge + edgeOffset + spike });
  }

  const grad = ctx.createLinearGradient(x, y, x + w * 0.58, y + h);
  grad.addColorStop(0, ceiling ? '#39454e' : '#333f48');
  grad.addColorStop(0.28, '#232f38');
  grad.addColorStop(0.68, '#131c24');
  grad.addColorStop(1, '#080d13');

  // Uneven flanks keep the pillars from reading like pipes.
  const flankL = (hash01(seed * 2.9) - 0.5) * 18;
  const flankR = (hash01(seed * 7.4) - 0.5) * 18;
  ctx.beginPath();
  if (ceiling) {
    ctx.moveTo(x - 12 + flankL, y - 10);
    ctx.lineTo(x + w + 12 + flankR, y - 10);
    ctx.lineTo(x + w + 8 + flankR * 0.4, edge - h * 0.42);
    ctx.lineTo(x + w + 3 - flankR * 0.2, edge - 12);
  } else {
    ctx.moveTo(x - 12 + flankL, y + h + 10);
    ctx.lineTo(x + w + 12 + flankR, y + h + 10);
    ctx.lineTo(x + w + 8 + flankR * 0.4, edge + h * 0.42);
    ctx.lineTo(x + w + 3 - flankR * 0.2, edge + 12);
  }
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y);
  if (ceiling) ctx.lineTo(x - 8 - flankL * 0.3, edge - 12);
  else ctx.lineTo(x - 8 - flankL * 0.3, edge + 12);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Shaded inner face.
  ctx.save();
  ctx.beginPath();
  if (ceiling) {
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + w * 0.48, y);
    ctx.lineTo(x + w * 0.62, edge - 18);
    ctx.lineTo(x + w * 0.28, edge - 2);
    ctx.closePath();
  } else {
    ctx.moveTo(x + 10, y + h);
    ctx.lineTo(x + w * 0.48, y + h);
    ctx.lineTo(x + w * 0.62, edge + 18);
    ctx.lineTo(x + w * 0.28, edge + 2);
    ctx.closePath();
  }
  ctx.fillStyle = 'rgba(3, 5, 8, 0.3)';
  ctx.fill();
  ctx.restore();

  // Edge rim, wet with cave-light.
  ctx.strokeStyle = 'rgba(10, 15, 19, 0.9)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(140, 179, 175, 0.46)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(205, 226, 213, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const rimGlow = ctx.createLinearGradient(x, 0, x + w, 0);
  rimGlow.addColorStop(0, 'rgba(74, 155, 159, 0.04)');
  rimGlow.addColorStop(0.5, 'rgba(103, 210, 211, 0.22)');
  rimGlow.addColorStop(1, 'rgba(55, 128, 139, 0.03)');
  ctx.strokeStyle = rimGlow;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();

  // Strata and fractures.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y, w - 4, h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(139, 166, 158, 0.14)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 3; i++) {
    const sy = edge + dir * (36 + i * 55 + hash01(seed + i) * 28);
    ctx.beginPath();
    ctx.moveTo(x + 2, sy);
    ctx.bezierCurveTo(x + w * 0.3, sy + dir * 8, x + w * 0.62, sy - dir * 11, x + w - 2, sy + dir * 5);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const sx = x + w * (0.16 + hash01(seed * 3.3 + i * 4.1) * 0.68);
    const sy = edge + dir * (14 + hash01(seed * 4.4 + i) * Math.max(24, h * 0.24));
    const ex = sx + (hash01(seed + i * 9.3) - 0.5) * 36;
    const ey = sy + dir * (22 + hash01(seed * 7.1 + i) * 55);
    ctx.strokeStyle = i < 2 ? 'rgba(0, 0, 0, 0.55)' : 'rgba(129, 152, 145, 0.1)';
    ctx.lineWidth = i < 2 ? 1.6 : 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + (ex - sx) * 0.25, sy + (ey - sy) * 0.62, ex, ey);
    if (i < 2) ctx.lineTo(ex + 6, ey - dir * 12);
    ctx.stroke();
  }
  ctx.restore();

  // Soul lichen and small crystal growths.
  const groups = hash01(seed * 2.2) > 0.38 ? 2 : 1;
  for (let g = 0; g < groups; g++) {
    const p = pts[2 + ((g * 4 + 1) % (pts.length - 3))];
    const lx = p.x + (hash01(seed + g * 5) - 0.5) * w * 0.34;
    const ly = p.y - dir * (4 + hash01(seed + g * 6.1) * 8);
    drawCrystalCluster(lx, ly, dir, 0.55 + hash01(seed + g * 3.7) * 0.65, t, seed + g);
  }
}

function drawCrystalCluster(x, y, dir, scale, t, seed) {
  const pulse = 0.55 + Math.sin(t * 1.7 + seed) * 0.28;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 26 * scale);
  glow.addColorStop(0, `rgba(116, 227, 226, ${0.22 * pulse})`);
  glow.addColorStop(1, 'rgba(68, 166, 180, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 26 * scale, 0, TAU);
  ctx.fill();

  const spikes = [
    { x: 0, h: 11, lean: -0.2 },
    { x: 5.5, h: 7, lean: 0.45 },
    { x: -5, h: 6, lean: -0.55 },
  ];
  for (const sp of spikes) {
    ctx.fillStyle = `rgba(120, 220, 226, ${0.32 + pulse * 0.32})`;
    ctx.beginPath();
    ctx.moveTo((sp.x - 2.2) * scale, 0);
    ctx.lineTo((sp.x + sp.lean * sp.h) * scale, (-dir * sp.h) * scale);
    ctx.lineTo((sp.x + 2.2) * scale, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(213, 255, 253, ${0.55 + pulse * 0.35})`;
    ctx.beginPath();
    ctx.arc(sp.x * scale, (-dir * sp.h * 0.62) * scale, 0.9 * scale, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawPickup(p, t) {
  const y = p.baseY + Math.sin(t * 2.1 + p.phase) * 6;
  if (p.kind === 'estus') {
    ctx.save();
    ctx.translate(p.x, y);
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 34);
    glow.addColorStop(0, 'rgba(255, 195, 92, 0.43)');
    glow.addColorStop(0.4, 'rgba(255, 126, 42, 0.15)');
    glow.addColorStop(1, 'rgba(180, 55, 10, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.rotate(Math.sin(t * 1.3 + p.phase) * 0.1);
    ctx.fillStyle = 'rgba(221, 170, 87, 0.94)';
    roundRectPath(ctx, -5.5, -6, 11, 15, 3.4);
    ctx.fill();
    ctx.fillStyle = '#9a8b69';
    ctx.fillRect(-2, -10, 4, 5);
    ctx.fillStyle = '#fff0b8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.4, 4.2, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 237, 189, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 1, 9 + Math.sin(t * 3 + p.phase) * 1.2, 0, TAU);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(p.x, y);
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 27);
  glow.addColorStop(0, 'rgba(145, 242, 255, 0.4)');
  glow.addColorStop(0.42, 'rgba(66, 184, 224, 0.13)');
  glow.addColorStop(1, 'rgba(35, 115, 170, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 27, 0, TAU);
  ctx.fill();

  const bob = Math.sin(t * 1.8 + p.phase);
  ctx.rotate(t * 0.9 + p.phase);
  ctx.fillStyle = 'rgba(157, 245, 255, 0.88)';
  ctx.beginPath();
  ctx.moveTo(0, -7 - bob);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 7 + bob);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2ffff';
  ctx.beginPath();
  ctx.arc(0, 0, 2.1, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(p.x, y);
  ctx.strokeStyle = 'rgba(122, 226, 241, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 6, Math.sin(t + p.phase) * 0.4, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(p, t) {
  if (!p) return;
  const s = G.metrics.scale * 1.46;
  const blink = p.iframes > 0 && Math.floor(p.iframes * 18) % 2 === 0;
  const flap = p.wing;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = blink ? 0.38 : 1;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 42 * s);
  halo.addColorStop(0, 'rgba(94, 198, 217, 0.09)');
  halo.addColorStop(0.48, 'rgba(207, 103, 48, 0.045)');
  halo.addColorStop(1, 'rgba(40, 100, 120, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 42 * s, 0, TAU);
  ctx.fill();
  ctx.restore();

  const spread = 4 + flap * 15 + Math.sin(t * 7.4) * 1.6;

  // A second, higher wing reads as flight from a distance.
  ctx.fillStyle = 'rgba(64, 25, 24, 0.78)';
  ctx.beginPath();
  ctx.moveTo(2 * s, -7 * s);
  ctx.bezierCurveTo(16 * s, (-29 - spread * 0.8) * s, (35 + spread * 0.55) * s, -25 * s, (44 + spread * 0.36) * s, -7 * s);
  ctx.lineTo((34 + spread * 0.2) * s, -10 * s);
  ctx.lineTo((38 + spread * 0.12) * s, 3 * s);
  ctx.lineTo((25 + spread * 0.1) * s, -2 * s);
  ctx.lineTo((23 + spread * 0.08) * s, 11 * s);
  ctx.lineTo(12 * s, 5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(182, 104, 64, 0.26)';
  ctx.lineWidth = Math.max(1, 1.1 * s);
  ctx.beginPath();
  ctx.moveTo(5 * s, -7 * s);
  ctx.quadraticCurveTo((23 + spread * 0.4) * s, (-22 - spread * 0.4) * s, (39 + spread * 0.3) * s, -8 * s);
  ctx.stroke();

  // Ember cloak — a pair of tattered, wing-like feathers.
  const wingGrad = ctx.createLinearGradient(-42 * s, -20 * s, 2, 14 * s);
  wingGrad.addColorStop(0, 'rgba(90, 35, 30, 0.72)');
  wingGrad.addColorStop(0.55, 'rgba(55, 24, 25, 0.92)');
  wingGrad.addColorStop(1, 'rgba(22, 14, 17, 0.96)');

  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(-4 * s, -8 * s);
  ctx.bezierCurveTo(-16 * s, (-30 - spread) * s, (-36 - spread) * s, -24 * s, (-48 - spread * 0.7) * s, -9 * s);
  ctx.lineTo((-39 - spread * 0.5) * s, -12 * s);
  ctx.lineTo((-45 - spread * 0.3) * s, 1 * s);
  ctx.lineTo((-33 - spread * 0.2) * s, -3 * s);
  ctx.lineTo((-36 - spread * 0.1) * s, 11 * s);
  ctx.lineTo((-25 - spread * 0.1) * s, 3 * s);
  ctx.lineTo((-24 - spread * 0.1) * s, 16 * s);
  ctx.lineTo(-12 * s, 8 * s);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(130, 48, 34, 0.46)';
  ctx.beginPath();
  ctx.moveTo(-9 * s, -12 * s);
  ctx.bezierCurveTo(-24 * s, (-27 - spread * 0.8) * s, (-38 - spread * 0.4) * s, -17 * s, (-42 - spread * 0.25) * s, -5 * s);
  ctx.lineTo(-29 * s, -8 * s);
  ctx.lineTo(-31 * s, 4 * s);
  ctx.lineTo(-20 * s, -1 * s);
  ctx.closePath();
  ctx.fill();

  // Torn trailing cloth.
  ctx.fillStyle = 'rgba(38, 17, 19, 0.93)';
  ctx.beginPath();
  ctx.moveTo(-7 * s, 8 * s);
  ctx.bezierCurveTo(-15 * s, 18 * s, (-23 - flap * 4) * s, 26 * s, (-31 - flap * 3) * s, 35 * s);
  ctx.lineTo((-19 - flap * 2) * s, 29 * s);
  ctx.lineTo((-19 - flap * 2) * s, 39 * s);
  ctx.lineTo(-8 * s, 28 * s);
  ctx.lineTo(-2 * s, 19 * s);
  ctx.closePath();
  ctx.fill();

  // Body and cloak latches.
  ctx.fillStyle = '#1c2228';
  roundRectPath(ctx, -9 * s, -11 * s, 22 * s, 27 * s, 7 * s);
  ctx.fill();
  ctx.fillStyle = 'rgba(79, 101, 105, 0.35)';
  roundRectPath(ctx, -6 * s, -8 * s, 14 * s, 18 * s, 5 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(101, 154, 158, 0.46)';
  ctx.lineWidth = Math.max(1, 1.1 * s);
  ctx.beginPath();
  ctx.moveTo(-4 * s, -6 * s);
  ctx.lineTo(8 * s, -1 * s);
  ctx.lineTo(4 * s, 8 * s);
  ctx.stroke();

  // Belt and shoulder plate.
  ctx.fillStyle = '#0b0d10';
  ctx.fillRect(-9 * s, 8 * s, 22 * s, 3 * s);
  ctx.fillStyle = '#313b40';
  ctx.beginPath();
  ctx.ellipse(8 * s, -7 * s, 7 * s, 4.5 * s, -0.28, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#11161a';
  ctx.beginPath();
  ctx.moveTo(2 * s, -10 * s);
  ctx.lineTo(14 * s, -11 * s);
  ctx.lineTo(16 * s, -4 * s);
  ctx.lineTo(5 * s, -3 * s);
  ctx.closePath();
  ctx.fill();

  // Sword arm and blade.
  const castGlow = p.castAnim;
  ctx.strokeStyle = '#171b1e';
  ctx.lineWidth = Math.max(2.8, 3.4 * s);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(8 * s, 1 * s);
  ctx.lineTo(18 * s, 6 * s);
  ctx.stroke();
  ctx.strokeStyle = castGlow > 0 ? 'rgba(174, 244, 255, 0.95)' : '#8c9898';
  ctx.lineWidth = Math.max(1.4, 1.8 * s);
  ctx.beginPath();
  ctx.moveTo(17 * s, 5 * s);
  ctx.lineTo(39 * s, 15 * s);
  ctx.stroke();
  if (castGlow > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(18 * s, 6 * s, 40 * s, 16 * s);
    g.addColorStop(0, `rgba(102, 230, 255, ${0.18 * castGlow})`);
    g.addColorStop(1, `rgba(197, 250, 255, ${0.65 * castGlow})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(17 * s, 5 * s);
    ctx.lineTo(41 * s, 16 * s);
    ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = '#3e3330';
  ctx.lineWidth = Math.max(2, 2.2 * s);
  ctx.beginPath();
  ctx.moveTo(16 * s, 2 * s);
  ctx.lineTo(19 * s, 9 * s);
  ctx.stroke();

  // Head and horned helm.
  ctx.fillStyle = '#20272c';
  ctx.beginPath();
  ctx.ellipse(7 * s, -16 * s, 9.4 * s, 8.4 * s, -0.12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#13181c';
  ctx.beginPath();
  ctx.moveTo(7 * s, -24 * s);
  ctx.quadraticCurveTo(13 * s, -29 * s, 18 * s, -23 * s);
  ctx.lineTo(16 * s, -14 * s);
  ctx.lineTo(8 * s, -12 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a5559';
  ctx.lineWidth = Math.max(1, 1.1 * s);
  ctx.beginPath();
  ctx.moveTo(10 * s, -21 * s);
  ctx.lineTo(15 * s, -19 * s);
  ctx.stroke();

  // Curving horns.
  ctx.strokeStyle = '#79756a';
  ctx.lineWidth = Math.max(1.5, 2 * s);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(2 * s, -22 * s);
  ctx.quadraticCurveTo(-5 * s, -31 * s, -12 * s, -28 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(7 * s, -24 * s);
  ctx.quadraticCurveTo(5 * s, -32 * s, 0, -35 * s);
  ctx.stroke();

  // Eyes.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const eye = ctx.createRadialGradient(12.5 * s, -17 * s, 0, 12.5 * s, -17 * s, 7 * s);
  eye.addColorStop(0, 'rgba(206, 255, 255, 0.98)');
  eye.addColorStop(0.28, 'rgba(89, 225, 247, 0.82)');
  eye.addColorStop(1, 'rgba(40, 126, 160, 0)');
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.arc(12.5 * s, -17 * s, 7 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#eaffff';
  ctx.beginPath();
  ctx.ellipse(12.7 * s, -17 * s, 1.9 * s, 1.1 * s, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.restore();

  // A warm, barely-there rim light from the cave fires.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(238, 150, 79, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 25 * s, -Math.PI * 0.85, -Math.PI * 0.18);
  ctx.stroke();
  ctx.restore();
}

function drawBolt(b, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const speed = Math.hypot(b.vx, b.vy) || 1;
  const tx = b.x - (b.vx / speed) * 28;
  const ty = b.y - (b.vy / speed) * 28;
  const trail = ctx.createLinearGradient(b.x, b.y, tx, ty);
  trail.addColorStop(0, 'rgba(170, 247, 255, 0.8)');
  trail.addColorStop(0.35, 'rgba(84, 204, 239, 0.42)');
  trail.addColorStop(1, 'rgba(54, 142, 195, 0)');
  ctx.strokeStyle = trail;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 15);
  glow.addColorStop(0, 'rgba(238, 255, 255, 1)');
  glow.addColorStop(0.25, 'rgba(125, 231, 255, 0.8)');
  glow.addColorStop(1, 'rgba(48, 136, 190, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 15, 0, TAU);
  ctx.fill();

  ctx.translate(b.x, b.y);
  ctx.rotate(Math.atan2(b.vy, b.vx));
  ctx.fillStyle = '#eaffff';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-2, 3.4);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-2, -3.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawProjectile(p, t) {
  const r = p.r;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.6);
  glow.addColorStop(0, p.core || 'rgba(255, 240, 205, 0.98)');
  glow.addColorStop(0.26, p.color || 'rgba(255, 150, 74, 0.72)');
  glow.addColorStop(1, 'rgba(90, 25, 8, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 3.6, 0, TAU);
  ctx.fill();

  if (p.kind === 'ember') {
    const speed = Math.hypot(p.vx, p.vy) || 1;
    const tx = p.x - p.vx / speed * r * 4.2;
    const ty = p.y - p.vy / speed * r * 4.2;
    const tail = ctx.createLinearGradient(p.x, p.y, tx, ty);
    tail.addColorStop(0, p.color || 'rgba(255, 148, 58, 0.9)');
    tail.addColorStop(1, 'rgba(135, 31, 4, 0)');
    ctx.strokeStyle = tail;
    ctx.lineWidth = r * 1.55;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot || 0);
  ctx.fillStyle = p.color || '#ff9d57';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = p.core || '#fff0c5';
  ctx.beginPath();
  ctx.arc(-r * 0.16, -r * 0.16, r * 0.48, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 247, 220, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r + 2.5 + Math.sin(t * 8 + p.phase) * 0.8, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawBeam(b, t) {
  const life = clamp(1 - b.t / b.life, 0, 1);
  const alpha = life < 0.2 ? life / 0.2 : 1;
  const thickness = b.width * (0.7 + Math.sin(t * 48) * 0.12);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createLinearGradient(0, b.y - thickness * 2, 0, b.y + thickness * 2);
  grad.addColorStop(0, 'rgba(255, 104, 42, 0)');
  grad.addColorStop(0.25, `rgba(255, 100, 38, ${0.25 * alpha})`);
  grad.addColorStop(0.5, `rgba(255, 241, 202, ${0.95 * alpha})`);
  grad.addColorStop(0.75, `rgba(255, 100, 38, ${0.25 * alpha})`);
  grad.addColorStop(1, 'rgba(255, 104, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, b.y - thickness * 2, b.x2, thickness * 4);

  ctx.strokeStyle = `rgba(255, 250, 233, ${0.9 * alpha})`;
  ctx.lineWidth = Math.max(2, thickness * 0.35);
  ctx.beginPath();
  ctx.moveTo(0, b.y);
  ctx.lineTo(b.x2, b.y);
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  for (const p of G.particles) {
    const life = p.life / p.maxLife;
    const alpha = clamp(life, 0, 1) * p.alpha;
    if (alpha <= 0.005) continue;
    if (p.glow) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = p.color.replace('ALPHA', alpha.toFixed(3));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + life * 0.8), 0, TAU);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.55 + life * 0.65), 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawFloaters() {
  ctx.save();
  ctx.textAlign = 'center';
  for (const f of G.floaters) {
    const life = f.life / f.maxLife;
    ctx.globalAlpha = clamp(life, 0, 1);
    ctx.font = `500 ${f.size}px "Cinzel", serif`;
    ctx.fillStyle = f.color;
    ctx.shadowColor = f.shadow || f.color;
    ctx.shadowBlur = 8;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
}

function drawPostEffects(t) {
  if (G.hurtFlash > 0) {
    const a = G.hurtFlash;
    const hurt = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.22, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    hurt.addColorStop(0, 'rgba(90, 0, 0, 0)');
    hurt.addColorStop(0.65, `rgba(123, 12, 10, ${0.18 * a})`);
    hurt.addColorStop(1, `rgba(156, 20, 14, ${0.56 * a})`);
    ctx.fillStyle = hurt;
    ctx.fillRect(0, 0, W, H);
  }

  if (G.healFlash > 0) {
    const a = G.healFlash;
    const heal = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    heal.addColorStop(0, `rgba(255, 208, 123, ${0.16 * a})`);
    heal.addColorStop(0.5, 'rgba(219, 140, 48, 0)');
    heal.addColorStop(1, `rgba(118, 57, 17, ${0.24 * a})`);
    ctx.fillStyle = heal;
    ctx.fillRect(0, 0, W, H);
  }

  if (G.flash > 0) {
    ctx.save();
    ctx.globalAlpha = G.flash;
    ctx.fillStyle = G.flashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (G.lowHealth > 0) {
    const pulse = 0.35 + Math.sin(t * 4.2) * 0.18;
    const low = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.32, W * 0.5, H * 0.5, Math.max(W, H) * 0.74);
    low.addColorStop(0, 'rgba(60, 0, 0, 0)');
    low.addColorStop(1, `rgba(126, 14, 12, ${0.34 * pulse * G.lowHealth})`);
    ctx.fillStyle = low;
    ctx.fillRect(0, 0, W, H);
  }
}
