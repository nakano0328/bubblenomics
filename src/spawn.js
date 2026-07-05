'use strict';
/* ---------- スポーン ---------- */
function spawnEdgePoint(margin){
  const side = RI(0, 3);
  if (side === 0) return { x: R(0, W), y: -margin, side };
  if (side === 1) return { x: W + margin, y: R(0, H), side };
  if (side === 2) return { x: R(0, W), y: H + margin, side };
  return { x: -margin, y: R(0, H), side };
}
function needleBase(type, col){
  return { type, x: 0, y: 0, vx: 0, vy: 0, rot: 0, len: R(24, 30), w: 5.5, hitR: 8,
    col, grazed: false, blown: false, age: 0, t: 0 };
}
function spawnDrift(){
  const n = needleBase('drift', '#ff5f7a');
  const p = spawnEdgePoint(40);
  n.x = p.x; n.y = p.y;
  const tx = R(W * 0.2, W * 0.8), ty = R(H * 0.2, H * 0.8);
  const d = Math.hypot(tx - n.x, ty - n.y) || 1;
  const sp = R(50, 95) * (1 + (level - 1) * 0.05);
  n.vx = (tx - n.x) / d * sp; n.vy = (ty - n.y) / d * sp;
  needles.push(n);
}
function spawnAimed(){
  const n = needleBase('aimed', '#ff2e63');
  const p = spawnEdgePoint(40);
  n.x = p.x; n.y = p.y; n.len = R(28, 34);
  const d = Math.hypot(B.x - n.x, B.y - n.y) || 1;
  const sp = Math.min(130 + level * 10, 280);
  n.vx = (B.x - n.x) / d * sp; n.vy = (B.y - n.y) / d * sp;
  needles.push(n);
}
function spawnSine(){
  const fromLeft = rng() < 0.5;
  const n = needleBase('sine', '#c85cff');
  n.x = fromLeft ? -40 : W + 40;
  n.y0 = R(H * 0.15, H * 0.85); n.y = n.y0;
  n.vx = (fromLeft ? 1 : -1) * R(70, 120) * (1 + (level - 1) * 0.05);
  n.A = R(45, 95); n.f = R(2.2, 3.6); n.ph = R(0, TAU);
  needles.push(n);
}
function spawnBomb(){
  if (bombs.length >= 2) return;
  const p = spawnEdgePoint(40);
  const tx = R(W * 0.25, W * 0.75), ty = R(H * 0.25, H * 0.75);
  const d = Math.hypot(tx - p.x, ty - p.y) || 1;
  bombs.push({ x: p.x, y: p.y, tx, ty, vx: (tx - p.x) / d * 85, vy: (ty - p.y) / d * 85,
    fuse: 2.6, arrived: false, t: 0, hitR: 18 });
}
function spawnWall(){
  if (elapsed - lastWallT < 7) return;
  lastWallT = elapsed;
  const fromLeft = rng() < 0.5;
  const sp = Math.min(85 + level * 6, 135);
  const gap = Math.max(150, 210 - level * 7);
  const gy = R(gap * 0.6, H - gap * 0.6);
  for (let y = 18; y < H; y += 36){
    if (Math.abs(y - gy) < gap / 2) continue;
    const n = needleBase('wall', '#ff5f7a');
    n.x = fromLeft ? -40 : W + 40; n.y = y + R(-4, 4);
    n.vx = (fromLeft ? 1 : -1) * sp; n.vy = 0;
    needles.push(n);
  }
  popup(fromLeft ? 90 : W - 90, gy, '⚠ 壁！', '#ffd166', 22);
}
function spawnVortex(){
  if (vortices.length >= 1) return;
  const p = spawnEdgePoint(50);
  const tx = R(W * 0.25, W * 0.75), ty = R(H * 0.25, H * 0.75);
  vortices.push({ x: p.x, y: p.y, tx, ty, t: 0, life: 7, R: 250 });
  popup(tx, ty, '🌀 渦が発生！', '#c8bfff', 20);
  pushNews('テーパリング観測、市場に渦');
  beep(220, 0.5, 'sine', 0.15, -120);
}
function spawnLaser(){
  const vertical = rng() < 0.5;
  lasers.push({ vertical, pos: vertical ? B.x : B.y, t: 0, warn: 1.2, fire: 0.5 });
  popup(vertical ? clamp(B.x, 60, W - 60) : W / 2, vertical ? 60 : clamp(B.y, 40, H - 40), '⚠ 監視ビーム！', '#ff8fa3', 16);
  beep(980, 0.3, 'sawtooth', 0.1);
}
function spawnCoin(){
  const cap = (mkt && mkt.id === 'boom') ? 8 : 4;
  if (coins.length >= cap) return;
  const gem = level >= 2 && rng() < 0.10;   // 10%で💎（高額・短命）
  coins.push({ x: R(W * 0.15, W * 0.85), y: R(H * 0.18, H * 0.82), t: 0, life: gem ? 6 : 9, ph: R(0, TAU), gem });
}
function spawnWave(){
  if (needles.length > 110) return;
  const opts = [['drift', 3]];
  if (level >= 2) opts.push(['aimed', 2.2]);
  if (level >= 3) opts.push(['sine', 2]);
  if (level >= 4 && !boss) opts.push(['bomb', 1.3]);
  if (level >= 5 && !boss) opts.push(['vortex', 0.8]);
  if (level >= 6 && !boss) opts.push(['wall', 1.0]);
  if (level >= 7) opts.push(['laser', 1.1]);
  let total = 0; for (const o of opts) total += o[1];
  let pick = rng() * total, kind = 'drift';
  for (const o of opts){ pick -= o[1]; if (pick <= 0) { kind = o[0]; break; } }
  if (kind === 'drift'){ const c = Math.min(1 + Math.floor(level / 2), 4); for (let i = 0; i < c; i++) spawnDrift(); }
  else if (kind === 'aimed'){ const c = level >= 5 ? 2 : 1; for (let i = 0; i < c; i++) spawnAimed(); }
  else if (kind === 'sine'){ const c = RI(2, 3); for (let i = 0; i < c; i++) spawnSine(); }
  else if (kind === 'bomb') spawnBomb();
  else if (kind === 'wall') spawnWall();
  else if (kind === 'vortex') spawnVortex();
  else if (kind === 'laser') spawnLaser();
}
function burstBomb(bm){
  const count = Math.min(8 + level, 16);
  const sp = Math.min(110 + level * 8, 190);
  const ph = R(0, TAU);
  for (let i = 0; i < count; i++){
    const a = ph + (i / count) * TAU;
    const n = needleBase('burst', '#ffa62b');
    n.x = bm.x + Math.cos(a) * 14; n.y = bm.y + Math.sin(a) * 14;
    n.vx = Math.cos(a) * sp; n.vy = Math.sin(a) * sp;
    needles.push(n);
  }
  rings.push({ x: bm.x, y: bm.y, r: 6, vr: 520, t: 0, life: 0.35, c: '#ffa62b', w: 4 });
  emit(14, bm.x, bm.y, { spd: [30, 160], drag: 2.5, sz: [2, 5], c: '#7ec97e', life: [0.3, 0.7] });
  beep(140, 0.25, 'square', 0.22, -60);
  shake = Math.max(shake, 6);
}
