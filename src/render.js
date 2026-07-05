'use strict';
/* ---------- 描画 ---------- */
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
function drawPopups(){
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of popups){
    const k = p.t / p.life;
    ctx.globalAlpha = clamp(1 - k * k, 0, 1);
    ctx.font = F(p.size);
    ctx.fillStyle = p.c;
    ctx.strokeStyle = 'rgba(20,10,40,0.7)'; ctx.lineWidth = 3;
    const y = p.y - k * 42;
    ctx.strokeText(p.txt, p.x, y);
    ctx.fillText(p.txt, p.x, y);
  }
  ctx.globalAlpha = 1;
}
function drawHUD(){
  const mult = multOf(B.r);
  ctx.textBaseline = 'alphabetic';
  // 資産
  ctx.textAlign = 'left';
  ctx.font = F(13, '600');
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('資産', 18, 30);
  ctx.font = F(26);
  ctx.fillStyle = feverOn ? rgb(hsl2rgb((tReal * 200) % 360, 0.9, 0.7)) : '#ffe08a';
  ctx.fillText(yen(score), 18, 58);
  ctx.font = F(12, '500');
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('歴代最高 ' + yen(Math.max(best, score)), 18, 76);
  const nr = nextRankOf(score);
  if (nr){
    ctx.font = F(11, '500');
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`次の称号「${nr[1]}」まで ${yen(nr[0] - score)}`, 18, 94);
  }

  // 四半期・グレイズ・気分・イベント
  ctx.textAlign = 'right';
  ctx.font = F(18);
  ctx.fillStyle = '#fff';
  ctx.fillText(`第${level}四半期`, W - 18, 34);
  ctx.font = F(13, '600');
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`リスクプレミアム ×${totalGraze}`, W - 18, 56);
  let ry = 76;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(`${mood.icon} ${mood.name}${isDaily ? '　📅本日の相場' : ''}`, W - 18, ry);
  ry += 20;
  if (mkt){
    ctx.fillStyle = '#bfe3ff';
    ctx.fillText(`${mkt.icon} ${mkt.name} あと${Math.ceil(mkt.t)}s`, W - 18, ry);
    ry += 20;
  }
  if (muted){ ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillText('🔇 ミュート中 (M)', W - 18, ry); }

  // 膨張ゲージ
  const gw = Math.min(250, W * 0.4), gh = 12;
  const gx = W / 2 - gw / 2, gy = 24;
  const ratio = clamp((B.r - MINR) / (MAXR - MINR), 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.roundRect(gx - 2, gy - 2, gw + 4, gh + 4, 8); ctx.fill();
  const gc = ratio < 0.55 ? lerpC([110,220,140], GOLD, ratio / 0.55) : lerpC(GOLD, RED, (ratio - 0.55) / 0.45);
  ctx.fillStyle = rgb(gc);
  ctx.beginPath(); ctx.roundRect(gx, gy, Math.max(gw * ratio, 6), gh, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(gx + gw * 0.85, gy - 3, 2, gh + 6);
  if (ratio > 0.85){
    ctx.globalAlpha = 0.5 + Math.sin(tReal * 20) * 0.5;
    ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(gx - 4, gy - 4, gw + 8, gh + 8, 9); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // フィーバーゲージ
  const fy = gy + gh + 6;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.roundRect(gx - 2, fy, gw + 4, 9, 5); ctx.fill();
  if (fever > 0){
    ctx.fillStyle = feverOn ? rgb(hsl2rgb((tReal * 300) % 360, 0.9, 0.6)) : (fever > 0.75 ? `rgba(110,231,255,${0.7 + Math.sin(tReal * 10) * 0.3})` : '#6ee7ff');
    ctx.beginPath(); ctx.roundRect(gx, fy + 1.5, Math.max(gw * fever, 4), 6, 3); ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.font = F(11, '600');
  ctx.fillStyle = feverOn ? '#ffe08a' : 'rgba(255,255,255,0.5)';
  ctx.fillText(feverOn ? '🌈 FEVER ×3！' : 'フィーバー', W / 2, fy + 22);
  ctx.font = F(20);
  ctx.fillStyle = rgb(gc);
  ctx.fillText('×' + mult.toFixed(1), W / 2, fy + 46);

  // 取得済みperk（ティッカーの上に表示）
  ctx.textAlign = 'left';
  ctx.font = `15px ${EMOJI}`;
  let px = 18;
  for (const id in perkCounts){
    const p = PERKS.find(q => q.id === id);
    if (!p) continue;
    ctx.fillText(p.icon + (perkCounts[id] > 1 ? '×' + perkCounts[id] : ''), px, H - 34);
    px += 44;
  }

  // ニュースティッカー（最下段）
  if (tickerStr){
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, H - 24, W, 24);
    ctx.font = F(12, '600');
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('📰 ' + tickerStr, tickerX, H - 12);
    ctx.textBaseline = 'alphabetic';
  }

  // 実績トースト（右側スタック）
  ctx.textAlign = 'right';
  achToasts.forEach((tst, i) => {
    const a = tst.t < 0.25 ? tst.t / 0.25 : (tst.t > 2.7 ? clamp((3.2 - tst.t) / 0.5, 0, 1) : 1);
    ctx.globalAlpha = a;
    ctx.font = F(13, '600');
    const tw = ctx.measureText(tst.txt).width;
    const ty = H * 0.32 + i * 34;
    ctx.fillStyle = 'rgba(35,20,60,0.9)';
    ctx.beginPath(); ctx.roundRect(W - tw - 38, ty - 15, tw + 24, 28, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(W - tw - 38, ty - 15, tw + 24, 28, 14); ctx.stroke();
    ctx.fillStyle = '#ffe08a';
    ctx.textBaseline = 'middle';
    ctx.fillText(tst.txt, W - 26, ty);
    ctx.textBaseline = 'alphabetic';
  });
  ctx.globalAlpha = 1;

  // 限界警告
  if (criticalT > 0.05){
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6 + Math.sin(tReal * 24) * 0.4;
    ctx.font = F(30);
    ctx.fillStyle = '#ff4d6d';
    ctx.fillText('⚠ 限界！しぼませろ！！', W / 2, H * 0.3);
    ctx.globalAlpha = 1;
  }

  // バナー
  if (bannerT > 0){
    const k = 1 - bannerT / 2.8;
    const a = k < 0.1 ? k / 0.1 : (k > 0.85 ? (1 - k) / 0.15 : 1);
    ctx.textAlign = 'center';
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.font = F(Math.min(26, W * 0.045));
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(20,10,40,0.8)'; ctx.lineWidth = 5;
    ctx.strokeText(bannerTxt, W / 2, H * 0.4);
    ctx.fillText(bannerTxt, W / 2, H * 0.4);
    ctx.globalAlpha = 1;
  }
}
function drawDraft(){
  ctx.fillStyle = 'rgba(10,5,25,0.78)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = F(Math.min(26, W * 0.05));
  ctx.fillStyle = '#ffe08a';
  ctx.fillText('📊 四半期決算 — 投資戦略を1つ選べ', W / 2, H * 0.2);
  ctx.font = F(13, '600');
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('クリック / 1・2・3キー', W / 2, H * 0.2 + 32);

  const cw = Math.min(200, (W - 64) / 3), chh = 230, gap = 16;
  const total = cw * 3 + gap * 2;
  const x0 = W / 2 - total / 2, y0 = H / 2 - chh / 2 + 20;
  draft.rects = [];
  for (let i = 0; i < draft.opts.length; i++){
    const p = draft.opts[i];
    const x = x0 + i * (cw + gap);
    draft.rects.push({ x, y: y0, w: cw, h: chh });
    const pulse = 1 + Math.sin(tReal * 3 + i * 1.2) * 0.02;
    ctx.save();
    ctx.translate(x + cw / 2, y0 + chh / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#241640';
    ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-cw / 2, -chh / 2, cw, chh, 14); ctx.fill(); ctx.stroke();
    ctx.font = `40px ${EMOJI}`;
    ctx.fillText(p.icon, 0, -chh / 2 + 52);
    ctx.font = F(17);
    ctx.fillStyle = '#ffe08a';
    ctx.fillText(p.name, 0, -chh / 2 + 100);
    ctx.font = F(12.5, '600');
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    p.desc.forEach((l, j) => ctx.fillText(l, 0, -chh / 2 + 130 + j * 20));
    ctx.font = F(13, '600');
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(`[${i + 1}]`, 0, chh / 2 - 22);
    ctx.restore();
  }
}
function drawTitle(){
  B.x = W / 2; B.y = H * 0.64 + Math.sin(tReal * 1.6) * 12; B.r = 46;
  B.vx = Math.cos(tReal * 1.1) * 20; B.vy = Math.sin(tReal * 1.6) * 18;
  B.jetDir = { x: 0, y: 1 };
  drawBalloon();

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const ts = Math.min(W * 0.085, 58);
  ctx.font = F(ts);
  const g = ctx.createLinearGradient(0, H * 0.14 - ts, 0, H * 0.14 + ts);
  g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#ff7eb6');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(20,10,40,0.8)'; ctx.lineWidth = 6;
  ctx.strokeText('BUBBLENOMICS', W / 2, H * 0.14);
  ctx.fillText('BUBBLENOMICS', W / 2, H * 0.14);
  ctx.font = F(Math.min(W * 0.032, 19));
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('〜バブルは、はじける直前がいちばん儲かる〜', W / 2, H * 0.14 + ts * 0.85);

  // 日替わり相場格言
  ctx.font = `italic 500 ${Math.min(W * 0.024, 13)}px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText(`“${todayQuote()}”`, W / 2, H * 0.235);

  ctx.font = F(Math.min(W * 0.027, 15.5), '600');
  const lines = [
    '🎈 ふくらむほど資産が サイズ² で爆増。触れたら崩壊、ふくらみ切っても崩壊',
    '💨 長押し：噴射で移動＆しぼむ。噴射の風でトゲを吹き飛ばせ！',
    '✨ スレスレ回避＝リスクプレミアム → ゲージMAXで 🌈フィーバー資産3倍',
    '📊 四半期ごとに投資戦略をドラフト（保険🛡️・高配当🪙・省エネ💨…）',
    '🐻 第4四半期ごとに「ベア」襲来。逃げながら風でトゲをぶつけて撃退！',
    '💹 好景気・金融緩和・空売り規制…市場イベントを乗りこなせ',
    '🦅 タカ・🌀渦・⚡ビーム・📅日替わり相場・🏆実績16種…市場は進化する',
  ];
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.28 + i * Math.min(H * 0.04, 27)));

  // モード選択ボタン
  const bw = Math.min(190, W * 0.42), bh = 42, bgap = 14;
  titleBtns.daily = { x: W / 2 - bw - bgap / 2, y: H * 0.745, w: bw, h: bh };
  titleBtns.ach   = { x: W / 2 + bgap / 2,      y: H * 0.745, w: bw, h: bh };
  const todayBest = dailyRec.date === todayJST() ? `本日ベスト ${yen(dailyRec.best)}` : '毎日同じ相場で競える';
  pillBtn(titleBtns.daily, '📅 本日の相場', todayBest);
  pillBtn(titleBtns.ach, `🏆 実績 ${Object.keys(achUnlocked).length}/${ACHS.length}`, 'タップで一覧');

  // 風船スキン（実績数で解放）
  skinBtns = [];
  const sw = 26, sgap = 10;
  const stotal = SKINS.length * sw + (SKINS.length - 1) * sgap;
  const sx0 = W / 2 - stotal / 2, sy0 = H * 0.808;
  const achN = Object.keys(achUnlocked).length;
  SKINS.forEach((sk, i) => {
    const x = sx0 + i * (sw + sgap);
    skinBtns.push({ x, y: sy0, w: sw, h: sw });
    const unlocked = achN >= sk.need;
    ctx.globalAlpha = unlocked ? 1 : 0.3;
    ctx.fillStyle = rgb(sk.col);
    ctx.beginPath(); ctx.arc(x + sw / 2, sy0 + sw / 2, sw / 2 - 2, 0, TAU); ctx.fill();
    if (unlocked && currentSkinIdx() === i){
      ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x + sw / 2, sy0 + sw / 2, sw / 2 + 1.5, 0, TAU); ctx.stroke();
    }
    if (!unlocked){
      ctx.globalAlpha = 0.85;
      ctx.font = `11px ${EMOJI}`;
      ctx.fillText('🔒', x + sw / 2, sy0 + sw / 2);
    }
    ctx.globalAlpha = 1;
  });

  ctx.globalAlpha = 0.7 + Math.sin(tReal * 4) * 0.3;
  ctx.font = F(Math.min(W * 0.04, 22));
  ctx.fillStyle = '#ffe08a';
  ctx.fillText('クリック / タップ で開場', W / 2, H * 0.87);
  ctx.globalAlpha = 1;
  ctx.font = F(12, '500');
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('マウス or WASD/矢印キー ／ M:ミュート B:BGM P:ポーズ V:振動', W / 2, H * 0.905);
  if (best > 0){
    ctx.fillStyle = 'rgba(255,224,138,0.8)';
    ctx.font = F(14, '600');
    ctx.fillText(`歴代最高資産 ${yen(best)}（${rankOf(best)[0]}）`, W / 2, H * 0.935);
  }
  if (lifeStats.plays > 0){
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = F(12, '600');
    ctx.fillText(`通算 ${lifeStats.plays}プレイ ／ 生涯総資産 ${yen(lifeStats.earned)} ／ 🏆 実績 ${Object.keys(achUnlocked).length}/${ACHS.length}`, W / 2, H * 0.968);
  }
}
function drawAchievements(){
  ctx.fillStyle = 'rgba(12,7,28,0.96)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = F(24);
  ctx.fillStyle = '#ffe08a';
  const n = Object.keys(achUnlocked).length;
  ctx.fillText(`🏆 実績 ${n}/${ACHS.length}`, W / 2, H * 0.08);
  const rowH = Math.min(34, (H * 0.78) / ACHS.length);
  const y0 = H * 0.14;
  ACHS.forEach((a, i) => {
    const y = y0 + i * rowH;
    const got = !!achUnlocked[a.id];
    ctx.textAlign = 'left';
    ctx.font = `${Math.min(18, rowH * 0.6)}px ${EMOJI}`;
    ctx.globalAlpha = got ? 1 : 0.35;
    ctx.fillText(got ? a.icon : '🔒', W * 0.12, y);
    ctx.font = F(Math.min(14, rowH * 0.46));
    ctx.fillStyle = got ? '#ffe08a' : 'rgba(255,255,255,0.5)';
    ctx.fillText(a.name, W * 0.2, y);
    ctx.font = F(Math.min(11.5, rowH * 0.38), '500');
    ctx.fillStyle = got ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'right';
    ctx.fillText(a.desc, W * 0.88, y);
  });
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.font = F(14, '600');
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('クリックで閉じる', W / 2, H * 0.96);
}
function drawOver(){
  ctx.fillStyle = 'rgba(15,8,30,0.72)';
  ctx.fillRect(0, 0, W, H);
  const pw = Math.min(470, W * 0.92), ph = 404;
  const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  ctx.fillStyle = 'rgba(35,20,60,0.95)';
  ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 18); ctx.fill(); ctx.stroke();

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = F(32);
  ctx.fillStyle = '#ff4d6d';
  ctx.fillText('💥 バブル崩壊', W / 2, py + 42);
  ctx.font = F(13, '600');
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(deathReason, W / 2, py + 72);

  ctx.font = F(14, '600');
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('最終資産', W / 2, py + 104);
  const countUp = clamp(overT / 1.2, 0, 1);
  const eased = 1 - Math.pow(1 - countUp, 3);
  ctx.font = F(32 + (countUp >= 1 ? Math.max(0, 4 - (overT - 1.2) * 20) : 0));
  ctx.fillStyle = '#ffe08a';
  ctx.fillText(yen(score * eased), W / 2, py + 136);

  const rk = rankOf(score);
  ctx.font = F(20);
  ctx.fillStyle = rk[1];
  ctx.fillText(`称号：${rk[0]}`, W / 2, py + 172);

  if (wasRecord){
    ctx.globalAlpha = 0.75 + Math.sin(tReal * 8) * 0.25;
    ctx.font = F(17);
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText('🎉 歴代最高記録更新！', W / 2, py + 204);
    ctx.globalAlpha = 1;
  } else {
    ctx.font = F(13, '600');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText((isDaily ? `📅 本日ベスト ${yen(dailyRec.best)}　／　` : '') + '歴代最高 ' + yen(best), W / 2, py + 204);
  }
  ctx.font = F(13.5, '600');
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(`到達：第${level}四半期 ／ リスクプレミアム ×${totalGraze} ／ 最大倍率 ×${maxMult.toFixed(1)}`, W / 2, py + 240);
  ctx.fillText(`🐻 ベア撃破 ×${bossKills} ／ 🌈 フィーバー ×${feverCount} ／ 💨 吹き飛ばし ×${windBlown}`, W / 2, py + 264);
  if (runUnlocks.length){
    ctx.font = F(12.5, '600');
    ctx.fillStyle = '#ffd166';
    const names = runUnlocks.slice(0, 3).map(a => a.icon + ' ' + a.name).join('　');
    ctx.fillText(`🆕 実績解除：${names}${runUnlocks.length > 3 ? `　他${runUnlocks.length - 3}件` : ''}`, W / 2, py + 290);
  }

  if (overT > 0.7){
    // 再上場 ／ メニューへ
    const bw2 = 128, bh2 = 36, gap2 = 12;
    retryBtn = { x: W / 2 - bw2 - gap2 / 2, y: py + 302, w: bw2, h: bh2 };
    menuBtn  = { x: W / 2 + gap2 / 2,       y: py + 302, w: bw2, h: bh2 };
    pillBtn(retryBtn, `🔁 再上場${isDaily ? '（本日）' : ''}`);
    pillBtn(menuBtn, '🏠 メニュー', null,
      { fg: 'rgba(255,255,255,0.85)', border: 'rgba(255,255,255,0.35)' });
    // シェアボタン
    const sbw = 200, sbh = 34;
    shareBtn = { x: W / 2 - sbw / 2, y: py + 348, w: sbw, h: sbh };
    pillBtn(shareBtn, '📋 結果をコピー', null,
      { bg: 'rgba(20,10,40,0.85)', border: 'rgba(110,231,255,0.55)', fg: '#6ee7ff' });
    if (shareMsgT !== 0){
      ctx.font = F(12, '600');
      ctx.fillStyle = shareMsgT > 0 ? '#7ee787' : '#ff8fa3';
      ctx.fillText(shareMsgT > 0 ? 'コピーしました！SNSでシェアしよう🎈' : 'コピーできませんでした…', W / 2, shareBtn.y + sbh + 15);
    }
  } else {
    shareBtn = null; retryBtn = null; menuBtn = null;
  }
}
