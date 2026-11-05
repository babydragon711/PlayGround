'use strict';

// ---------------------------------------------------------------------------
// The three keepers
// ---------------------------------------------------------------------------

function drawBoss(b, t) {
  if (!b) return;
  let alpha = 1;
  if (b.dead) alpha = clamp(1 - b.deathT / 2.2, 0, 1);
  if (b.type === 'bellwarden') drawBossBellwarden(b, alpha);
  else if (b.type === 'choir') drawBossChoir(b, alpha);
  else drawBossCinder(b, alpha);
  if (!b.dead) drawBossTelegraph(b, t);
}

function drawBossAuraLocal(b, color, radius) {
  const intensity = b.windup ? 0.3 : 0.17;
  const phase = b.phase2 ? 1.35 : 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(0, -10, 0, 0, -10, radius);
  g.addColorStop(0, color.replace('ALPHA', (intensity * phase).toFixed(3)));
  g.addColorStop(0.38, color.replace('ALPHA', (intensity * 0.36 * phase).toFixed(3)));
  g.addColorStop(1, color.replace('ALPHA', '0'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, -10, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function bossFlashOverlay(b) {
  if (!b.flash) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(0, -10, 0, 0, -10, 115);
  g.addColorStop(0, `rgba(235, 255, 255, ${0.9 * b.flash})`);
  g.addColorStop(0.42, `rgba(143, 233, 255, ${0.42 * b.flash})`);
  g.addColorStop(1, 'rgba(70, 155, 210, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, -10, 115, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Bellwarden of the Deep
// ---------------------------------------------------------------------------

function drawBossBellwarden(b, alpha = 1) {
  const T = b.t;
  const flap = Math.sin(T * 2.3) * 10;
  const breathe = Math.sin(T * 1.5) * 2.2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(b.x, b.y);
  ctx.scale(b.scale, b.scale);
  drawBossAuraLocal(b, 'rgba(247, 167, 82, ALPHA)', 178);

  // Wings.
  const wingGrad = ctx.createLinearGradient(-100, -80, 20, 55);
  wingGrad.addColorStop(0, '#252a2d');
  wingGrad.addColorStop(0.55, '#151a1d');
  wingGrad.addColorStop(1, '#0b0e11');

  ctx.fillStyle = wingGrad;
  ctx.beginPath();
  ctx.moveTo(-18, -16 + breathe);
  ctx.bezierCurveTo(-65, -72 - flap, -118, -78 - flap * 0.4, -142, -39 + flap * 0.2);
  ctx.lineTo(-117, -40 + flap * 0.2);
  ctx.lineTo(-127, -10 + flap * 0.25);
  ctx.lineTo(-97, -13 + flap * 0.2);
  ctx.lineTo(-102, 17 + flap * 0.2);
  ctx.lineTo(-73, 3);
  ctx.lineTo(-63, 25);
  ctx.lineTo(-43, 6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(18, -18 + breathe);
  ctx.bezierCurveTo(49, -68 - flap * 0.6, 92, -77 + flap * 0.4, 115, -38 + flap * 0.15);
  ctx.lineTo(97, -35);
  ctx.lineTo(103, -8 + flap * 0.2);
  ctx.lineTo(77, -12);
  ctx.lineTo(80, 17);
  ctx.lineTo(56, 2);
  ctx.lineTo(42, 23);
  ctx.lineTo(25, 0);
  ctx.closePath();
  ctx.fill();

  // Wing bones.
  ctx.strokeStyle = 'rgba(110, 117, 113, 0.26)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-28, -20);
  ctx.quadraticCurveTo(-82, -58 - flap * 0.7, -136, -42 + flap * 0.2);
  ctx.moveTo(-28, -19);
  ctx.quadraticCurveTo(-66, -25, -103, 14 + flap * 0.2);
  ctx.moveTo(26, -20);
  ctx.quadraticCurveTo(70, -57 - flap * 0.4, 109, -39);
  ctx.stroke();

  // Legs.
  ctx.strokeStyle = '#1b2023';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, 32);
  ctx.quadraticCurveTo(-31, 57, -42, 68);
  ctx.moveTo(17, 34);
  ctx.quadraticCurveTo(30, 57, 25, 71);
  ctx.stroke();
  ctx.strokeStyle = '#353c3d';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-42, 68);
    ctx.lineTo(-50 - i * 2, 75 + i * 2);
    ctx.moveTo(25, 71);
    ctx.lineTo(31 + i * 2, 77 + i * 2);
    ctx.stroke();
  }

  // Hunched torso.
  const body = ctx.createLinearGradient(-40, -55, 45, 73);
  body.addColorStop(0, '#3b4242');
  body.addColorStop(0.3, '#272e30');
  body.addColorStop(0.7, '#181e21');
  body.addColorStop(1, '#0b0e11');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-38, -15 + breathe);
  ctx.bezierCurveTo(-51, 3, -47, 37, -27, 48);
  ctx.quadraticCurveTo(0, 62, 29, 48);
  ctx.bezierCurveTo(48, 33, 47, 0, 31, -19 + breathe);
  ctx.quadraticCurveTo(0, -35 + breathe, -38, -15 + breathe);
  ctx.closePath();
  ctx.fill();

  // Ribs and belly plates.
  ctx.strokeStyle = 'rgba(130, 141, 134, 0.2)';
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(-1, 2 + i * 9, 27 - i * 3.5, 9, 0.02, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  // Arms and claws.
  ctx.strokeStyle = '#1c2225';
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(-33, -7);
  ctx.quadraticCurveTo(-58, 8, -51, 31);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(31, -10);
  ctx.quadraticCurveTo(54, 7, 45, 33);
  ctx.stroke();
  ctx.strokeStyle = '#5d5e56';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-51, 31);
  ctx.lineTo(-61, 39);
  ctx.moveTo(-51, 31);
  ctx.lineTo(-56, 43);
  ctx.moveTo(-51, 31);
  ctx.lineTo(-47, 42);
  ctx.moveTo(45, 33);
  ctx.lineTo(54, 41);
  ctx.moveTo(45, 33);
  ctx.lineTo(48, 45);
  ctx.stroke();

  // Chain and bell.
  const swing = Math.sin(T * 2.6) * 0.18 + (b.windup ? Math.sin(T * 34) * 0.1 : 0);
  const bellY = 48;
  const bellX = -14 + Math.sin(swing) * 20;
  ctx.strokeStyle = '#4c493f';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-16, 12);
  ctx.lineTo(bellX - 2, bellY - 8);
  ctx.stroke();
  ctx.save();
  ctx.translate(bellX, bellY);
  ctx.rotate(swing);
  const bellGrad = ctx.createLinearGradient(-16, -14, 16, 18);
  bellGrad.addColorStop(0, '#a88950');
  bellGrad.addColorStop(0.35, '#6e5634');
  bellGrad.addColorStop(1, '#2f271b');
  ctx.fillStyle = bellGrad;
  ctx.beginPath();
  ctx.moveTo(-12, -12);
  ctx.quadraticCurveTo(0, -22, 12, -12);
  ctx.quadraticCurveTo(14, 2, 17, 10);
  ctx.quadraticCurveTo(0, 17, -17, 10);
  ctx.quadraticCurveTo(-14, 2, -12, -12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(210, 180, 117, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-14, 7);
  ctx.quadraticCurveTo(0, 12, 14, 7);
  ctx.stroke();
  ctx.fillStyle = '#ba985d';
  ctx.beginPath();
  ctx.arc(0, 14, 3, 0, TAU);
  ctx.fill();
  if (b.windup) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, 55);
    bg.addColorStop(0, 'rgba(255, 199, 108, 0.3)');
    bg.addColorStop(1, 'rgba(255, 115, 35, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Head, facing left.
  const headY = -37 + breathe;
  ctx.save();
  ctx.translate(-43, headY);
  ctx.rotate(-0.05 + Math.sin(T * 1.4) * 0.02);
  const headGrad = ctx.createLinearGradient(-38, -24, 18, 24);
  headGrad.addColorStop(0, '#444b49');
  headGrad.addColorStop(0.45, '#282f30');
  headGrad.addColorStop(1, '#12171a');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.quadraticCurveTo(-20, -27, -29, -16);
  ctx.lineTo(-46, -10);
  ctx.lineTo(-39, 2);
  ctx.lineTo(-40, 9);
  ctx.lineTo(-24, 7);
  ctx.lineTo(-15, 17);
  ctx.lineTo(4, 11);
  ctx.quadraticCurveTo(19, -4, 0, -28);
  ctx.closePath();
  ctx.fill();

  // Jaw.
  ctx.fillStyle = '#181d1f';
  ctx.beginPath();
  ctx.moveTo(-37, 4);
  ctx.lineTo(-21, 9);
  ctx.lineTo(-25, 17);
  ctx.lineTo(-39, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(190, 183, 156, 0.45)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-35 + i * 4, 6);
    ctx.lineTo(-34 + i * 4, 11);
    ctx.stroke();
  }

  // Horns.
  ctx.strokeStyle = '#757366';
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-7, -25);
  ctx.quadraticCurveTo(-4, -47, 10, -49);
  ctx.quadraticCurveTo(4, -37, 6, -28);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-23, -21);
  ctx.quadraticCurveTo(-38, -35, -47, -31);
  ctx.quadraticCurveTo(-36, -26, -30, -17);
  ctx.stroke();

  // Eyes.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const eyePulse = 0.7 + Math.sin(T * 4.1) * 0.25;
  const eg = ctx.createRadialGradient(-30, -7, 0, -30, -7, 12);
  eg.addColorStop(0, `rgba(255, 230, 163, ${eyePulse})`);
  eg.addColorStop(0.25, `rgba(245, 143, 55, ${eyePulse * 0.9})`);
  eg.addColorStop(1, 'rgba(220, 79, 27, 0)');
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.arc(-31, -7, 12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffe0a0';
  ctx.beginPath();
  ctx.ellipse(-31, -7, 2.8, 1.4, -0.12, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Cracks.
  ctx.strokeStyle = 'rgba(3, 4, 5, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-46, -17);
  ctx.lineTo(-35, -12);
  ctx.lineTo(-37, -2);
  ctx.stroke();
  ctx.restore();

  bossFlashOverlay(b);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The Rotten Choir
// ---------------------------------------------------------------------------

function drawBossChoir(b, alpha = 1) {
  const T = b.t;
  const breathe = Math.sin(T * 1.25) * 3.2;
  const pulse = 0.7 + Math.sin(T * 3.4) * 0.2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(b.x, b.y);
  ctx.scale(b.scale, b.scale);
  drawBossAuraLocal(b, 'rgba(98, 214, 241, ALPHA)', 196);

  // Tendrils and drowned robes.
  ctx.strokeStyle = '#152328';
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const baseX = -55 + i * 16;
    const sway = Math.sin(T * 1.1 + i * 0.8) * 8;
    ctx.lineWidth = 5 - (i % 3);
    ctx.beginPath();
    ctx.moveTo(baseX, 38);
    ctx.bezierCurveTo(baseX - 8, 70, baseX + sway, 98, baseX + sway * 1.5 - 9, 128);
    ctx.stroke();
  }

  // Halo.
  ctx.save();
  ctx.rotate(T * 0.08);
  ctx.strokeStyle = 'rgba(146, 234, 247, 0.23)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -69, 86, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(89, 158, 170, 0.14)';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, -69, 92, 0.1, 2.5);
  ctx.stroke();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const cx = Math.cos(a) * 86;
    const cy = -69 + Math.sin(a) * 86;
    ctx.fillStyle = '#c0baa1';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, TAU);
    ctx.fill();
    const fh = 5 + Math.sin(T * 6 + i) * 1.2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 187, 96, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6, 2.1, fh, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Shoulder bones.
  ctx.fillStyle = '#2c3433';
  ctx.beginPath();
  ctx.ellipse(-56, 48, 24, 14, -0.25, 0, TAU);
  ctx.ellipse(52, 48, 24, 14, 0.25, 0, TAU);
  ctx.fill();

  // Skull cranium.
  const bone = ctx.createLinearGradient(-55, -90, 65, 56);
  bone.addColorStop(0, '#c5bea6');
  bone.addColorStop(0.28, '#9e9885');
  bone.addColorStop(0.62, '#716e62');
  bone.addColorStop(1, '#3e403c');
  ctx.fillStyle = bone;
  ctx.beginPath();
  ctx.moveTo(-11, -91 + breathe);
  ctx.bezierCurveTo(-53, -94 + breathe, -74, -62 + breathe, -66, -22);
  ctx.lineTo(-71, 8);
  ctx.bezierCurveTo(-63, 23, -47, 23, -41, 15);
  ctx.lineTo(-38, 42);
  ctx.quadraticCurveTo(-3, 62, 33, 41);
  ctx.lineTo(40, 16);
  ctx.bezierCurveTo(66, 7, 71, -21, 62, -47);
  ctx.bezierCurveTo(51, -82, 24, -94, -11, -91 + breathe);
  ctx.closePath();
  ctx.fill();

  // Cheek and jaw shadow.
  ctx.fillStyle = 'rgba(35, 39, 37, 0.72)';
  ctx.beginPath();
  ctx.moveTo(-37, 13);
  ctx.quadraticCurveTo(-18, 33, 3, 30);
  ctx.lineTo(8, 50);
  ctx.quadraticCurveTo(-17, 49, -35, 33);
  ctx.closePath();
  ctx.fill();

  // Open mouth.
  const mouth = ctx.createRadialGradient(-5, 29, 0, -5, 29, 42);
  mouth.addColorStop(0, `rgba(183, 247, 255, ${0.75 * pulse})`);
  mouth.addColorStop(0.35, 'rgba(55, 145, 168, 0.65)');
  mouth.addColorStop(1, 'rgba(7, 20, 24, 0.95)');
  ctx.fillStyle = mouth;
  ctx.beginPath();
  ctx.ellipse(-4, 29, 31, 19, -0.03, 0, TAU);
  ctx.fill();

  // Teeth.
  ctx.fillStyle = '#c7c0a8';
  for (let i = 0; i < 7; i++) {
    const tx = -28 + i * 7.3;
    ctx.beginPath();
    ctx.moveTo(tx, 12);
    ctx.lineTo(tx + 3.2, 22 + (i % 2) * 3);
    ctx.lineTo(tx + 6.3, 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx + 1, 44);
    ctx.lineTo(tx + 3.8, 35 - (i % 2) * 2);
    ctx.lineTo(tx + 6.8, 44);
    ctx.closePath();
    ctx.fill();
  }

  // Eye sockets.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const eyePositions = [
    [-32, -35, 12],
    [21, -39, 13],
    [-6, -67, 9],
  ];
  for (let i = 0; i < eyePositions.length; i++) {
    const [ex, ey, er] = eyePositions[i];
    const eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, er * 2.5);
    eg.addColorStop(0, `rgba(223, 255, 255, ${0.95 * pulse})`);
    eg.addColorStop(0.25, 'rgba(92, 225, 244, 0.72)');
    eg.addColorStop(1, 'rgba(31, 116, 145, 0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, ey, er * 2.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(5, 14, 18, 0.9)';
    ctx.beginPath();
    ctx.ellipse(ex, ey, er * 0.62, er * 0.82, -0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d8ffff';
    ctx.beginPath();
    ctx.arc(ex - 1, ey, er * 0.16, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // Nasal cavity.
  ctx.fillStyle = 'rgba(13, 18, 18, 0.88)';
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(4, -2);
  ctx.lineTo(9, 12);
  ctx.lineTo(-3, 15);
  ctx.closePath();
  ctx.fill();

  // Cracks and moss.
  ctx.strokeStyle = 'rgba(37, 42, 40, 0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(45, -65);
  ctx.lineTo(31, -48);
  ctx.lineTo(38, -34);
  ctx.moveTo(-53, -47);
  ctx.lineTo(-44, -34);
  ctx.lineTo(-49, -18);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(92, 146, 136, 0.28)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(31, -74);
  ctx.quadraticCurveTo(45, -56, 40, -42);
  ctx.stroke();

  // Small attending skulls.
  for (let i = 0; i < 3; i++) {
    const a = T * 0.28 + i * 2.1;
    const rx = Math.cos(a) * 103;
    const ry = -45 + Math.sin(a) * 28;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.scale(0.55, 0.55);
    ctx.fillStyle = 'rgba(157, 151, 133, 0.68)';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(12, 18, 19, 0.9)';
    ctx.beginPath();
    ctx.arc(-6, -2, 4, 0, TAU);
    ctx.arc(7, -2, 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9cebf6';
    ctx.beginPath();
    ctx.arc(-6, -2, 1.4, 0, TAU);
    ctx.arc(7, -2, 1.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  bossFlashOverlay(b);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Cinder Monarch
// ---------------------------------------------------------------------------

function drawBossCinder(b, alpha = 1) {
  const T = b.t;
  const breathe = Math.sin(T * 1.4) * 2.5;
  const flame = Math.sin(T * 6.8) * 6 + Math.sin(T * 11.2) * 3;
  const phase = b.phase2 ? 1.35 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(b.x, b.y);
  ctx.scale(b.scale, b.scale);
  drawBossAuraLocal(b, 'rgba(255, 105, 40, ALPHA)', 200);

  // A ruined cloak, threaded with living fire.
  ctx.fillStyle = 'rgba(6, 7, 10, 0.96)';
  ctx.beginPath();
  ctx.moveTo(12, -45 + breathe);
  ctx.lineTo(77, -36 - flame * 0.5);
  ctx.lineTo(96, -8);
  ctx.lineTo(121, 8 + flame);
  ctx.lineTo(104, 22);
  ctx.lineTo(126, 37 + flame * 0.7);
  ctx.lineTo(102, 45);
  ctx.lineTo(109, 72);
  ctx.lineTo(85, 60);
  ctx.lineTo(82, 91);
  ctx.lineTo(63, 69);
  ctx.lineTo(51, 96);
  ctx.lineTo(41, 66);
  ctx.lineTo(26, 77);
  ctx.lineTo(24, 48);
  ctx.lineTo(8, 56);
  ctx.closePath();
  ctx.fill();

  // A thin rim of embers keeps the black cloak readable against the cave.
  ctx.strokeStyle = 'rgba(255, 142, 63, 0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, -45 + breathe);
  ctx.lineTo(77, -36 - flame * 0.5);
  ctx.lineTo(96, -8);
  ctx.lineTo(121, 8 + flame);
  ctx.moveTo(126, 37 + flame * 0.7);
  ctx.lineTo(109, 72);
  ctx.lineTo(82, 91);
  ctx.lineTo(51, 96);
  ctx.stroke();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cape = ctx.createLinearGradient(20, -30, 105, 85);
  cape.addColorStop(0, 'rgba(255, 208, 108, 0.3)');
  cape.addColorStop(0.35, 'rgba(236, 94, 31, 0.4)');
  cape.addColorStop(0.72, 'rgba(134, 31, 12, 0.3)');
  cape.addColorStop(1, 'rgba(45, 8, 2, 0)');
  ctx.fillStyle = cape;
  const tongues = [
    [26, -24, 80, -32, 111, 18 + flame, 118, 11, 104, 38, 92, 27, 83, 55, 74, 36, 58, 67, 52, 42, 38, 55, 32, 24],
    [27, -12, 73, -10, 94, 37 + flame * 0.4, 101, 31, 84, 52, 75, 40, 61, 69, 57, 45, 43, 57, 39, 31],
    [31, 3, 67, 8, 82, 54 + flame * 0.5, 89, 48, 70, 68, 62, 52, 45, 73, 48, 42, 35, 49],
  ];
  for (let i = 0; i < tongues.length; i++) {
    const q = tongues[i];
    ctx.beginPath();
    ctx.moveTo(q[0], q[1]);
    ctx.quadraticCurveTo(q[2], q[3], q[4], q[5]);
    ctx.lineTo(q[6], q[7]);
    ctx.lineTo(q[8], q[9]);
    ctx.lineTo(q[10], q[11]);
    ctx.lineTo(q[12], q[13]);
    ctx.lineTo(q[14], q[15]);
    ctx.lineTo(q[16], q[17]);
    ctx.lineTo(q[18], q[19]);
    ctx.lineTo(q[20], q[21]);
    ctx.lineTo(q[22], q[23]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Lower smoke and legs.
  ctx.strokeStyle = '#0c0d10';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, 33);
  ctx.quadraticCurveTo(-34, 58, -29, 82);
  ctx.moveTo(16, 34);
  ctx.quadraticCurveTo(30, 61, 22, 85);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(198, 85, 38, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, 43);
  ctx.lineTo(-31, 60);
  ctx.moveTo(20, 48);
  ctx.lineTo(27, 67);
  ctx.stroke();

  // Tattered skirt plates.
  ctx.fillStyle = '#131418';
  ctx.beginPath();
  ctx.moveTo(-30, 28);
  ctx.lineTo(28, 28);
  ctx.lineTo(36, 65);
  ctx.lineTo(18, 56);
  ctx.lineTo(8, 78);
  ctx.lineTo(-5, 58);
  ctx.lineTo(-20, 74);
  ctx.lineTo(-25, 52);
  ctx.lineTo(-38, 61);
  ctx.closePath();
  ctx.fill();

  // Torso armor.
  const armor = ctx.createLinearGradient(-44, -54, 40, 40);
  armor.addColorStop(0, '#313134');
  armor.addColorStop(0.32, '#1b1b1f');
  armor.addColorStop(0.75, '#101014');
  armor.addColorStop(1, '#07080a');
  ctx.fillStyle = armor;
  ctx.beginPath();
  ctx.moveTo(-35, -30 + breathe);
  ctx.quadraticCurveTo(-54, -12, -42, 14);
  ctx.quadraticCurveTo(-31, 34, 0, 39);
  ctx.quadraticCurveTo(34, 32, 43, 12);
  ctx.quadraticCurveTo(52, -15, 30, -34 + breathe);
  ctx.quadraticCurveTo(0, -46 + breathe, -35, -30 + breathe);
  ctx.closePath();
  ctx.fill();

  // Chest fissures.
  ctx.strokeStyle = `rgba(255, 113, 40, ${0.52 * phase})`;
  ctx.lineWidth = 2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  ctx.moveTo(-1, -22);
  ctx.lineTo(-8, -9);
  ctx.lineTo(3, 2);
  ctx.lineTo(-3, 18);
  ctx.moveTo(-28, -10);
  ctx.lineTo(-17, -2);
  ctx.lineTo(-21, 12);
  ctx.moveTo(24, -17);
  ctx.lineTo(17, -6);
  ctx.lineTo(25, 6);
  ctx.stroke();
  ctx.restore();

  // Pauldrons.
  ctx.fillStyle = '#18191d';
  ctx.beginPath();
  ctx.ellipse(-43, -23 + breathe, 20, 14, -0.3, 0, TAU);
  ctx.ellipse(39, -22 + breathe, 20, 14, 0.3, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 123, 54, 0.24)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(-43, -23 + breathe, 16, 0.6, 2.3);
  ctx.arc(39, -22 + breathe, 16, -2.3, -0.6);
  ctx.stroke();

  // Left arm and claw.
  ctx.strokeStyle = '#141519';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-35, -10);
  ctx.quadraticCurveTo(-54, 10, -48, 32);
  ctx.stroke();
  ctx.fillStyle = '#2e2c29';
  ctx.beginPath();
  ctx.arc(-48, 34, 7, 0, TAU);
  ctx.fill();

  // Right arm and greatsword.
  ctx.strokeStyle = '#141519';
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(34, -13);
  ctx.quadraticCurveTo(50, 3, 50, 19);
  ctx.stroke();

  ctx.save();
  ctx.translate(48, 18);
  ctx.rotate(-0.18 + Math.sin(T * 1.2) * 0.02);
  const blade = ctx.createLinearGradient(0, 0, 100, 72);
  blade.addColorStop(0, '#a39678');
  blade.addColorStop(0.28, '#68645b');
  blade.addColorStop(1, '#24262a');
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(-3, 2);
  ctx.lineTo(85, 59);
  ctx.lineTo(94, 55);
  ctx.lineTo(100, 39);
  ctx.lineTo(10, -8);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(255, 119, 42, ${0.45 * phase})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(14, -6);
  ctx.lineTo(91, 44);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#5f4b30';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-1, -6);
  ctx.lineTo(9, 8);
  ctx.moveTo(3, 1);
  ctx.lineTo(13, -9);
  ctx.stroke();
  ctx.restore();

  // Head and horned crown.
  const hy = -55 + breathe;
  ctx.fillStyle = '#1a1b1f';
  ctx.beginPath();
  ctx.moveTo(-19, hy + 8);
  ctx.quadraticCurveTo(-18, hy - 19, 0, hy - 23);
  ctx.quadraticCurveTo(19, hy - 18, 20, hy + 8);
  ctx.lineTo(13, hy + 19);
  ctx.lineTo(-12, hy + 19);
  ctx.closePath();
  ctx.fill();

  // Crown spikes.
  ctx.fillStyle = '#5a4e3a';
  ctx.beginPath();
  ctx.moveTo(-16, hy - 13);
  ctx.lineTo(-22, hy - 32);
  ctx.lineTo(-9, hy - 20);
  ctx.lineTo(-2, hy - 42);
  ctx.lineTo(5, hy - 20);
  ctx.lineTo(16, hy - 34);
  ctx.lineTo(19, hy - 11);
  ctx.closePath();
  ctx.fill();

  // Curving horns.
  ctx.strokeStyle = '#746956';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-17, hy - 6);
  ctx.quadraticCurveTo(-41, hy - 15, -45, hy - 37);
  ctx.moveTo(17, hy - 6);
  ctx.quadraticCurveTo(38, hy - 16, 40, hy - 38);
  ctx.stroke();

  // Eyes.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const eyePulse = (b.phase2 ? 1 : 0.72) + Math.sin(T * 5.2) * 0.2;
  for (const ex of [-8, 8]) {
    const eg = ctx.createRadialGradient(ex, hy + 2, 0, ex, hy + 2, 11);
    eg.addColorStop(0, `rgba(255, 239, 184, ${eyePulse})`);
    eg.addColorStop(0.24, `rgba(255, 117, 43, ${eyePulse * 0.95})`);
    eg.addColorStop(1, 'rgba(194, 42, 12, 0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, hy + 2, 11, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#fff0c3';
  ctx.beginPath();
  ctx.ellipse(-8, hy + 2, 2.2, 1.1, 0, 0, TAU);
  ctx.ellipse(8, hy + 2, 2.2, 1.1, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  // Crown of cinders.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const fx = -12 + i * 6;
    const fh = 7 + Math.sin(T * 8 + i * 1.9) * 2.5;
    ctx.fillStyle = 'rgba(255, 162, 68, 0.48)';
    ctx.beginPath();
    ctx.ellipse(fx, hy - 31 - fh * 0.2, 1.5, fh, 0, 0, TAU);
    ctx.fill();
  }

  // Embers shed by the ruined cloak.
  for (let i = 0; i < 12; i++) {
    const cycle = (T * (0.22 + (i % 4) * 0.03) + i * 0.093) % 1;
    const spread = 20 + (i % 5) * 18;
    const ex = 26 + Math.cos(T * 0.7 + i * 1.7) * spread + cycle * 14;
    const ey = 70 - cycle * (110 + (i % 3) * 34);
    const ea = (1 - cycle) * (0.24 + (i % 3) * 0.12);
    ctx.fillStyle = i % 3 === 0
      ? `rgba(255, 228, 150, ${ea})`
      : `rgba(255, ${126 + (i % 4) * 16}, ${46 + (i % 3) * 12}, ${ea})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 1.1 + (i % 3) * 0.7, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  bossFlashOverlay(b);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Attack telegraphs
// ---------------------------------------------------------------------------

function drawBossTelegraph(b, t) {
  if (!b.windup) return;
  const w = b.windup;
  const progress = 1 - w.t / w.total;
  const color = b.def ? b.def.color : '#ff8b4a';

  ctx.save();
  if (w.kind === 'beam') {
    const y = w.data.y;
    ctx.globalCompositeOperation = 'lighter';
    ctx.setLineDash([13, 11]);
    ctx.lineDashOffset = -t * 80;
    ctx.strokeStyle = `rgba(255, 124, 56, ${0.22 + progress * 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(b.x, y);
    ctx.stroke();
    ctx.setLineDash([]);

    const glow = ctx.createLinearGradient(0, y - 20, 0, y + 20);
    glow.addColorStop(0, 'rgba(255, 76, 32, 0)');
    glow.addColorStop(0.5, `rgba(255, 122, 58, ${0.16 + progress * 0.18})`);
    glow.addColorStop(1, 'rgba(255, 76, 32, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, y - 20, b.x, 40);

    for (let x = 40; x < b.x - 20; x += 70) {
      const offset = (t * 80 + x) % 70;
      ctx.strokeStyle = `rgba(255, 168, 92, ${0.16 + progress * 0.25})`;
      ctx.beginPath();
      ctx.moveTo(x + offset, y - 6);
      ctx.lineTo(x + offset + 8, y);
      ctx.lineTo(x + offset, y + 6);
      ctx.stroke();
    }
  } else if (w.kind === 'rain') {
    for (const x of w.data.xs) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(255, 102, 46, ${0.06 + progress * 0.13})`);
      g.addColorStop(0.6, `rgba(255, 91, 38, ${0.02 + progress * 0.06})`);
      g.addColorStop(1, 'rgba(255, 75, 27, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 18, 0, 36, H);
      ctx.strokeStyle = `rgba(255, 164, 91, ${0.14 + progress * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 18, 0);
      ctx.lineTo(x - 18, H * (0.4 + progress * 0.5));
      ctx.moveTo(x + 18, 0);
      ctx.lineTo(x + 18, H * (0.4 + progress * 0.5));
      ctx.stroke();
      ctx.restore();
    }
  } else if (w.kind === 'dive' || w.kind === 'dash') {
    const target = w.data;
    ctx.globalCompositeOperation = 'lighter';
    ctx.setLineDash([6, 12]);
    ctx.lineDashOffset = -t * 90;
    ctx.strokeStyle = `rgba(255, 118, 51, ${0.18 + progress * 0.36})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.setLineDash([]);
    const g = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, 58);
    g.addColorStop(0, `rgba(255, 97, 40, ${0.1 + progress * 0.14})`);
    g.addColorStop(1, 'rgba(255, 89, 36, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 58, 0, TAU);
    ctx.fill();
  } else {
    // Fan and ring warnings gather at the keeper.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const radius = 95 + Math.sin(t * 7) * 5;
    ctx.strokeStyle = color.startsWith('#')
      ? color.replace(')', `, ${0.13 + progress * 0.18})`).replace('rgb', 'rgba')
      : `rgba(255, 158, 82, ${0.13 + progress * 0.18})`;
    ctx.strokeStyle = `rgba(255, 162, 89, ${0.12 + progress * 0.2})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, radius, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
