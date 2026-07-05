'use strict';
/* ---------- 描画：UI（HUD・ドラフト・タイトル・リザルト・オーバーレイ） ---------- */
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
    const rect = { x, y: y0, w: cw, h: chh };
    draft.rects.push(rect);
    const hov = ptrIn(rect);
    const pulse = 1 + Math.sin(tReal * 3 + i * 1.2) * 0.02 + (hov ? 0.035 : 0);
    ctx.save();
    ctx.translate(x + cw / 2, y0 + chh / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = hov ? '#2e1d52' : '#241640';
    ctx.strokeStyle = hov ? 'rgba(255,224,138,0.95)' : 'rgba(255,209,102,0.55)';
    ctx.lineWidth = hov ? 3 : 2;
    ctx.beginPath(); ctx.roundRect(-cw / 2, -chh / 2, cw, chh, 14); ctx.fill(); ctx.stroke();
    ctx.font = `40px ${EMOJI}`;
    ctx.fillText(p.icon, 0, -chh / 2 + 52);
    ctx.font = F(17);
    ctx.fillStyle = '#ffe08a';
    ctx.fillText(p.name, 0, -chh / 2 + 100);
    ctx.font = F(12.5, '600');
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    p.desc.forEach((l, j) => ctx.fillText(l, 0, -chh / 2 + 130 + j * 20));
    if (perkCounts[p.id]){
      ctx.font = F(11, '600');
      ctx.fillStyle = 'rgba(110,231,255,0.85)';
      ctx.fillText(`所持 ×${perkCounts[p.id]}`, 0, -chh / 2 + 178);
    }
    ctx.font = F(13, '600');
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(`[${i + 1}]`, 0, chh / 2 - 22);
    ctx.restore();
  }
}
function drawTitle(){
  B.x = W / 2; B.y = H * 0.50 + Math.sin(tReal * 1.6) * 12; B.r = 52;
  B.vx = Math.cos(tReal * 1.1) * 20; B.vy = Math.sin(tReal * 1.6) * 18;
  B.jetDir = { x: 0, y: 1 };
  drawBalloon();

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const ts = Math.min(W * 0.085, 58);
  ctx.font = F(ts);
  const g = ctx.createLinearGradient(0, H * 0.17 - ts, 0, H * 0.17 + ts);
  g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#ff7eb6');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(20,10,40,0.8)'; ctx.lineWidth = 6;
  ctx.strokeText('BUBBLENOMICS', W / 2, H * 0.17);
  ctx.fillText('BUBBLENOMICS', W / 2, H * 0.17);
  ctx.font = F(Math.min(W * 0.032, 19));
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('〜バブルは、はじける直前がいちばん儲かる〜', W / 2, H * 0.17 + ts * 0.85);

  // 日替わり相場格言
  ctx.font = `italic 500 ${Math.min(W * 0.024, 13)}px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText(`“${todayQuote()}”`, W / 2, H * 0.30);

  // 操作はこれだけ（詳しくは ❓遊び方）
  ctx.font = F(Math.min(W * 0.03, 16), '600');
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('💨 長押しで噴射移動（しぼむ）／ 離すと ふくらんで資産が増える', W / 2, H * 0.645);

  // モード選択ボタン
  const bw = Math.min(150, (W - 56) / 3), bh = 40, bgap = 10;
  const brow = bw * 3 + bgap * 2;
  const bx0 = W / 2 - brow / 2, by0 = H * 0.71;
  titleBtns.daily = { x: bx0,                     y: by0, w: bw, h: bh };
  titleBtns.help  = { x: bx0 + bw + bgap,         y: by0, w: bw, h: bh };
  titleBtns.ach   = { x: bx0 + (bw + bgap) * 2,   y: by0, w: bw, h: bh };
  pillBtn(titleBtns.daily, '📅 本日の相場');
  pillBtn(titleBtns.help, '❓ 遊び方', null, { fg: 'rgba(255,255,255,0.85)', border: 'rgba(255,255,255,0.35)' });
  pillBtn(titleBtns.ach, `🏆 実績 ${Object.keys(achUnlocked).length}/${ACHS.length}`);

  // 風船スキン（実績数で解放）
  skinBtns = [];
  const sw = 26, sgap = 10;
  const stotal = SKINS.length * sw + (SKINS.length - 1) * sgap;
  const sx0 = W / 2 - stotal / 2, sy0 = H * 0.79;
  const achN = Object.keys(achUnlocked).length;
  SKINS.forEach((sk, i) => {
    const x = sx0 + i * (sw + sgap);
    const rect = { x, y: sy0, w: sw, h: sw };
    skinBtns.push(rect);
    const unlocked = achN >= sk.need;
    const hov = ptrIn(rect, 7);
    ctx.globalAlpha = unlocked ? 1 : 0.3;
    ctx.fillStyle = rgb(sk.col);
    ctx.beginPath(); ctx.arc(x + sw / 2, sy0 + sw / 2, sw / 2 - 2 + (hov ? 2 : 0), 0, TAU); ctx.fill();
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
  ctx.fillText('クリック / タップ で開場', W / 2, H * 0.865);
  ctx.globalAlpha = 1;
  if (best > 0){
    ctx.fillStyle = 'rgba(255,224,138,0.8)';
    ctx.font = F(14, '600');
    ctx.fillText(`歴代最高資産 ${yen(best)}（${rankOf(best)[0]}）`, W / 2, H * 0.915);
  }
  if (lifeStats.plays > 0){
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = F(12, '600');
    ctx.fillText(`通算 ${lifeStats.plays}プレイ ／ 生涯総資産 ${yen(lifeStats.earned)}`, W / 2, H * 0.95);
  }
}
// オーバーレイ共通の枠（実績・遊び方）
function overlayFrame(title){
  ctx.fillStyle = 'rgba(12,7,28,0.96)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = F(24);
  ctx.fillStyle = '#ffe08a';
  ctx.fillText(title, W / 2, H * 0.08);
}
function overlayCloseHint(){
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.font = F(14, '600');
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('クリックで閉じる（Escでも可）', W / 2, H * 0.96);
}
function drawAchievements(){
  overlayFrame(`🏆 実績 ${Object.keys(achUnlocked).length}/${ACHS.length}`);
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
  overlayCloseHint();
}
function drawHelp(){
  overlayFrame('❓ 遊び方');
  const rowH = Math.min(40, (H * 0.78) / HELP_LINES.length);
  const y0 = H * 0.16;
  HELP_LINES.forEach((l, i) => {
    const y = y0 + i * rowH;
    ctx.textAlign = 'left';
    ctx.font = `${Math.min(17, rowH * 0.5)}px ${EMOJI}`;
    ctx.fillText(l[0], W * 0.06, y);
    ctx.font = F(Math.min(13, W * 0.0255), '600');
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(l[1], W * 0.13, y);
  });
  overlayCloseHint();
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
