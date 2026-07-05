'use strict';
/* ---------- 演出ヘルパー ---------- */
function popup(x, y, txt, c, size){
  popups.push({ x, y, txt, c: c || '#fff', size: size || 17, t: 0, life: 1.15 });
}
// パーティクルをn個まとめて放出する。
// o: { spd:[min,max] 必須, ang/spread 方向, xs x速度倍率, vx/vy 加算速度, jx/jy 位置ゆらぎ,
//      g 重力, drag 抵抗, vr 回転速度幅, sz:[min,max], c 色(配列なら抽選), life:[min,max], shape }
function emit(n, x, y, o){
  for (let i = 0; i < n; i++){
    const a = (o.ang !== undefined ? o.ang : R(0, TAU)) + (o.spread ? R(-o.spread, o.spread) : 0);
    const sp = R(o.spd[0], o.spd[1]);
    const rect = o.shape === 'rect';
    parts.push({
      x: x + (o.jx ? R(-o.jx, o.jx) : 0), y: y + (o.jy ? R(-o.jy, o.jy) : 0),
      vx: Math.cos(a) * sp * (o.xs || 1) + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0),
      g: o.g || 0, drag: o.drag || 0,
      rot: rect ? R(0, TAU) : 0, vr: o.vr ? R(-o.vr, o.vr) : 0,
      sz: R(o.sz[0], o.sz[1]),
      c: Array.isArray(o.c) ? o.c[RI(0, o.c.length - 1)] : o.c,
      t: 0, life: R(o.life[0], o.life[1]), shape: o.shape || 'dot',
    });
  }
}
const CONFETTI = ['#ff7eb6','#ffd166','#4ecdc4','#ff4d6d','#a06cff','#fff'];
// 丸型ボタン（タイトル・リザルト共用）
function pillBtn(r, label, sub, c){
  c = c || {};
  ctx.fillStyle = c.bg || 'rgba(35,20,60,0.85)';
  ctx.strokeStyle = c.border || 'rgba(255,209,102,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, r.h / 2); ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = c.fg || '#ffe08a';
  ctx.font = F(14);
  ctx.fillText(label, r.x + r.w / 2, r.y + (sub ? 15 : r.h / 2));
  if (sub){
    ctx.font = F(10, '500');
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(sub, r.x + r.w / 2, r.y + 31);
  }
}
