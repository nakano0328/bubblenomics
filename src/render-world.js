'use strict';
/* ---------- 描画：ワールド（背景・エンティティ・風船・ボス） ---------- */
function drawBG(){
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (feverOn){
    const hue = (tReal * 40) % 360;
    g.addColorStop(0, rgb(hsl2rgb(hue, 0.5, 0.12)));
    g.addColorStop(0.55, rgb(hsl2rgb((hue + 40) % 360, 0.5, 0.18)));
    g.addColorStop(1, rgb(hsl2rgb((hue + 80) % 360, 0.5, 0.22)));
  } else {
    g.addColorStop(0, '#150d33');
    g.addColorStop(0.55, '#31184f');
    g.addColorStop(1, '#5b2154');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (const d of dust){
    const y = ((d.y * H - tReal * d.s) % H + H) % H;
    ctx.globalAlpha = d.a;
    ctx.fillStyle = '#ffd9ec';
    ctx.beginPath(); ctx.arc(d.x * W, y, d.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawNeedle(n){
  ctx.save();
  ctx.translate(n.x, n.y);
  ctx.rotate(n.rot);
  ctx.fillStyle = n.blown ? '#6ee7ff' : n.col;
  ctx.beginPath();
  ctx.moveTo(n.len * 0.6, 0);
  ctx.lineTo(-n.len * 0.4, n.w);
  ctx.lineTo(-n.len * 0.6, 0);
  ctx.lineTo(-n.len * 0.4, -n.w);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(n.len * 0.42, 0, 1.9, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawBomb(bm){
  ctx.save();
  ctx.translate(bm.x, bm.y);
  ctx.rotate(Math.sin(bm.t * 6) * 0.15);
  if (bm.fuse < 1.4){
    const p = clamp(bm.fuse / 1.4, 0, 1);
    ctx.strokeStyle = `rgba(255,166,43,${0.5 + Math.sin(tReal * 20) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 22 + p * 34, 0, TAU); ctx.stroke();
  }
  ctx.font = `34px ${EMOJI}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🌵', 0, 0);
  if (bm.fuse < 1.4 && Math.sin(tReal * 16) > 0){
    ctx.font = F(16);
    ctx.fillStyle = '#ffd166';
    ctx.fillText('⚠', 0, -32);
  }
  ctx.restore();
}
function drawCoin(c){
  const bobY = Math.sin(c.t * 3 + c.ph) * 5;
  const blink = c.life - c.t < 2 ? (Math.sin(c.t * 14) > 0 ? 1 : 0.25) : 1;
  ctx.save();
  ctx.translate(c.x, c.y + bobY);
  ctx.globalAlpha = blink;
  const glow = c.gem ? 'rgba(155,236,255,' : 'rgba(255,220,120,';
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, c.gem ? 36 : 30);
  g.addColorStop(0, glow + (c.gem ? '0.6)' : '0.5)'));
  g.addColorStop(1, glow + '0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, c.gem ? 36 : 30, 0, TAU); ctx.fill();
  let sx = Math.sin(c.t * (c.gem ? 5 : 3.2) + c.ph);
  sx = Math.sign(sx || 1) * Math.max(Math.abs(sx), 0.18);
  ctx.scale(sx, 1);
  ctx.font = `${c.gem ? 26 : 28}px ${EMOJI}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(c.gem ? '💎' : '🪙', 0, 0);
  ctx.restore();
}
function drawVortex(v){
  const fadeIn = clamp(v.t / 0.5, 0, 1);
  const fadeOut = clamp((v.life - v.t) / 1, 0, 1);
  const a = fadeIn * fadeOut;
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(tReal * 3);
  for (let arm = 0; arm < 3; arm++){
    ctx.save();
    ctx.rotate(arm * TAU / 3);
    ctx.strokeStyle = `rgba(179,157,255,${0.55 * a})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k <= 14; k++){
      const tt = k / 14;
      const rr = 14 + tt * v.R * 0.55;
      const aa = tt * 2.4;
      const px = Math.cos(aa) * rr, py = Math.sin(aa) * rr;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = `rgba(179,157,255,${0.35 * a})`;
  ctx.beginPath(); ctx.arc(0, 0, 10 + Math.sin(tReal * 8) * 3, 0, TAU); ctx.fill();
  ctx.restore();
  // 吸引範囲のうっすらリング
  ctx.strokeStyle = `rgba(179,157,255,${0.12 * a})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 10]);
  ctx.beginPath(); ctx.arc(v.x, v.y, v.R, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);
}
function drawLaser(L){
  const firing = L.t > L.warn;
  ctx.save();
  if (!firing){
    // 予告線（点滅）
    const blink = 0.25 + Math.abs(Math.sin(tReal * 14)) * 0.5;
    const urgency = clamp(L.t / L.warn, 0, 1);
    ctx.strokeStyle = `rgba(255,90,120,${blink * (0.4 + urgency * 0.6)})`;
    ctx.lineWidth = 2 + urgency * 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    if (L.vertical){ ctx.moveTo(L.pos, -20); ctx.lineTo(L.pos, H + 20); }
    else { ctx.moveTo(-20, L.pos); ctx.lineTo(W + 20, L.pos); }
    ctx.stroke();
  } else {
    const k = clamp(1 - (L.t - L.warn) / L.fire, 0, 1);
    const w = 26 * k;
    let g;
    if (L.vertical) g = ctx.createLinearGradient(L.pos - w, 0, L.pos + w, 0);
    else g = ctx.createLinearGradient(0, L.pos - w, 0, L.pos + w);
    g.addColorStop(0, 'rgba(255,60,90,0)');
    g.addColorStop(0.35, `rgba(255,80,110,${0.7 * k})`);
    g.addColorStop(0.5, `rgba(255,240,245,${0.95 * k})`);
    g.addColorStop(0.65, `rgba(255,80,110,${0.7 * k})`);
    g.addColorStop(1, 'rgba(255,60,90,0)');
    ctx.fillStyle = g;
    if (L.vertical) ctx.fillRect(L.pos - w, -20, w * 2, H + 40);
    else ctx.fillRect(-20, L.pos - w, W + 40, w * 2);
  }
  ctx.restore();
}
function drawBoss(){
  const b = boss;
  const hawk = b.type === 'hawk';
  ctx.save();
  ctx.translate(b.x, b.y);
  // タカの利上げオーラ（資産がしぼむ危険域）
  if (hawk && !b.entering){
    const ag = ctx.createRadialGradient(0, 0, 40, 0, 0, AURA_R);
    ag.addColorStop(0, 'rgba(224,179,77,0.14)');
    ag.addColorStop(1, 'rgba(224,179,77,0)');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.arc(0, 0, AURA_R, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(224,179,77,${0.25 + Math.sin(tReal * 4) * 0.1})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 10]);
    ctx.beginPath(); ctx.arc(0, 0, AURA_R, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
  const auraCol = hawk ? '224,179,77' : '255,60,80';
  const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 74);
  g.addColorStop(0, `rgba(${auraCol},0.28)`);
  g.addColorStop(1, `rgba(${auraCol},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 74, 0, TAU); ctx.fill();
  if (b.hitFlash > 0){
    ctx.globalAlpha = b.hitFlash * 0.6;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 突進の照準テレグラフ
  if (b.aiming > 0){
    ctx.strokeStyle = `rgba(255,60,90,${0.4 + Math.abs(Math.sin(tReal * 18)) * 0.5})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(b.aimX * 46, b.aimY * 46);
    ctx.lineTo(b.aimX * 420, b.aimY * 420);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.rotate(Math.sin(b.t * 2) * 0.08);
  const sc = 1 + b.hitFlash * 0.15;
  ctx.scale(sc, sc);
  if (hawk) ctx.scale(b.aimX < 0 ? 1 : -1, 1);   // タカは進行方向を向く
  ctx.font = `58px ${EMOJI}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(hawk ? '🦅' : '🐻', 0, 0);
  ctx.restore();
  // HPバー・名前
  const w = 96;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = F(11, '600');
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(hawk ? 'タカ（利上げの主）' : 'ベア（空売りの主）', b.x, b.y - 66);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.roundRect(b.x - w / 2 - 1, b.y - 57, w + 2, 9, 4); ctx.fill();
  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath(); ctx.roundRect(b.x - w / 2, b.y - 56, Math.max(w * b.hp / b.maxHp, 2), 7, 3); ctx.fill();
}
function drawBalloon(){
  const t = clamp((B.r - MINR) / (MAXR - MINR), 0, 1);
  let col = t < 0.55 ? lerpC(currentSkin().col, GOLD, t / 0.55) : lerpC(GOLD, RED, (t - 0.55) / 0.45);
  if (feverOn) col = hsl2rgb((tReal * 140) % 360, 0.75, 0.66);
  const warning = B.r > MAXR * 0.85;
  const sp = Math.min(Math.hypot(B.vx, B.vy) / 700, 0.22);
  const ang = Math.atan2(B.vy, B.vx);
  const breathe = 1 + Math.sin(tReal * 8) * 0.015 + (warning ? Math.sin(tReal * 34) * 0.03 : 0);

  ctx.save();
  ctx.translate(B.x, B.y);
  if (invulnT > 0) ctx.globalAlpha = 0.55 + Math.sin(tReal * 30) * 0.3;

  // グレイズ判定リング
  ctx.save();
  ctx.strokeStyle = grazeCombo > 0 ? `rgba(255,209,102,${0.3 + Math.sin(tReal * 12) * 0.15})` : 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 8]);
  ctx.beginPath(); ctx.arc(0, 0, B.r + GRAZE + grazeBonus, 0, TAU); ctx.stroke();
  ctx.restore();

  // 保険（バリア）の盾
  for (let i = 0; i < barrier; i++){
    const a = tReal * 1.5 + i * TAU / barrier;
    const bx = Math.cos(a) * (B.r + 26), by = Math.sin(a) * (B.r + 26);
    ctx.font = `16px ${EMOJI}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🛡️', bx, by);
  }

  ctx.rotate(ang); ctx.scale((1 + sp) * breathe, (1 - sp) * breathe); ctx.rotate(-ang);

  const g = ctx.createRadialGradient(-B.r * 0.35, -B.r * 0.4, B.r * 0.1, 0, 0, B.r * 1.05);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.25, rgb(lerpC(col, [255,255,255], 0.35)));
  g.addColorStop(0.8, rgb(col));
  g.addColorStop(1, rgb(lerpC(col, [40,10,50], 0.35)));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, B.r, 0, TAU); ctx.fill();

  const jd = B.jetDir;
  const kx = jd.x * B.r, ky = jd.y * B.r;
  const ka = Math.atan2(jd.y, jd.x);
  ctx.save();
  ctx.translate(kx, ky); ctx.rotate(ka);
  ctx.fillStyle = rgb(lerpC(col, [40,10,50], 0.3));
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(9, -6); ctx.lineTo(9, 6); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  const sl = 34 + B.r * 0.4;
  const wig = Math.sin(tReal * 6) * 10;
  ctx.quadraticCurveTo(kx + jd.x * sl * 0.5 + wig, ky + jd.y * sl * 0.5,
                       kx + jd.x * sl - wig * 0.6, ky + jd.y * sl);
  ctx.stroke();

  const lookD = Math.hypot(B.vx, B.vy);
  const lx = lookD > 10 ? B.vx / lookD : 0, ly = lookD > 10 ? B.vy / lookD : 0;
  const er = Math.max(B.r * 0.09, 2.6);
  ctx.fillStyle = '#2b1b3a';
  for (const s of [-1, 1]){
    const ex = s * B.r * 0.3, ey = -B.r * 0.12;
    if (warning){
      ctx.save();
      ctx.strokeStyle = '#2b1b3a'; ctx.lineWidth = Math.max(B.r * 0.045, 2); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - er * s, ey - er); ctx.lineTo(ex + er * s, ey);
      ctx.moveTo(ex - er * s, ey + er); ctx.lineTo(ex + er * s, ey);
      ctx.stroke();
      ctx.restore();
    } else {
      // 約3.7秒ごとにまばたき
      const blink = (tReal % 3.7) < 0.13 ? 0.15 : 1;
      ctx.beginPath(); ctx.ellipse(ex + lx * er * 0.7, ey + ly * er * 0.7, er, er * blink, 0, 0, TAU); ctx.fill();
    }
  }
  ctx.strokeStyle = '#2b1b3a'; ctx.lineWidth = Math.max(B.r * 0.04, 1.8); ctx.lineCap = 'round';
  ctx.beginPath();
  if (warning){
    const mw = B.r * 0.16;
    ctx.moveTo(-mw, B.r * 0.22);
    for (let i = 1; i <= 4; i++) ctx.lineTo(-mw + (i / 4) * mw * 2, B.r * 0.22 + (i % 2 ? -1 : 1) * B.r * 0.05);
  } else {
    ctx.arc(0, B.r * 0.12, B.r * 0.16, 0.25 * Math.PI, 0.75 * Math.PI);
  }
  ctx.stroke();
  if (t > 0.45){
    ctx.fillStyle = 'rgba(255,90,120,0.4)';
    ctx.beginPath(); ctx.arc(-B.r * 0.48, B.r * 0.08, B.r * 0.12, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc( B.r * 0.48, B.r * 0.08, B.r * 0.12, 0, TAU); ctx.fill();
  }
  if (warning){
    ctx.fillStyle = 'rgba(140,200,255,0.9)';
    const sy = -B.r * 0.55 + Math.sin(tReal * 10) * 2;
    ctx.beginPath();
    ctx.moveTo(B.r * 0.55, sy - 7);
    ctx.quadraticCurveTo(B.r * 0.55 + 6, sy + 3, B.r * 0.55, sy + 6);
    ctx.quadraticCurveTo(B.r * 0.55 - 6, sy + 3, B.r * 0.55, sy - 7);
    ctx.fill();
  }
  ctx.restore();
}
function drawParts(){
  for (const p of parts){
    const a = clamp(1 - p.t / p.life, 0, 1);
    ctx.globalAlpha = a;
    if (p.shape === 'rect'){
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.sz / 2, -p.sz / 3, p.sz, p.sz * 0.66);
      ctx.restore();
    } else {
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * a, 0, TAU); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const r0 of rings){
    const a = clamp(1 - r0.t / r0.life, 0, 1);
    ctx.globalAlpha = a;
    ctx.strokeStyle = r0.c; ctx.lineWidth = r0.w * a + 0.5;
    ctx.beginPath(); ctx.arc(r0.x, r0.y, Math.max(r0.r, 0.1), 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
