'use strict';
/* ---------- メインループ ---------- */
let last = performance.now();
function frame(now){
  requestAnimationFrame(frame);
  let rdt = Math.min((now - last) / 1000, 0.05);
  last = now;
  tReal += rdt;

  let gdt = rdt;
  if (state === 'play'){
    if (!paused && !draft){
      if (slowT > 0){ slowT -= rdt; gdt *= 0.5; }   // グレイズの微スロー
      simulate(gdt);
    }
  } else if (state === 'dying'){
    dyingT += rdt;
    gdt = rdt * (dyingT < 0.12 ? 0 : 0.22);
    for (const n of needles){
      n.t += gdt;
      if (n.type === 'sine' && !n.blown){ n.x += n.vx * gdt; n.y = n.y0 + Math.sin(n.t * n.f + n.ph) * n.A; }
      else { n.x += n.vx * gdt; n.y += (n.vy || 0) * gdt; }
    }
    if (dyingT > 1.5){ state = 'over'; overT = 0; }
  } else if (state === 'over'){
    overT += rdt;
  }
  if (ventGain && AC && (state !== 'play' || paused || draft)){
    ventGain.gain.setTargetAtTime(0, AC.currentTime, 0.03);
  }
  updateFx(state === 'dying' ? gdt : ((state === 'play' && (paused || draft)) ? 0 : rdt));
  shake = Math.max(0, shake - shake * 7 * rdt - 2 * rdt);
  if (bannerT > 0) bannerT -= rdt;
  for (let i = achToasts.length - 1; i >= 0; i--){
    achToasts[i].t += rdt;
    if (achToasts[i].t > 3.2) achToasts.splice(i, 1);
  }
  if ((state === 'play' && !paused && !draft) || state === 'dying') updateTicker(rdt);
  if (state === 'over' && wasRecord && !recordFxDone && overT > 1.25){
    recordFxDone = true;
    emit(90, W / 2, H / 2 - 40, { ang: -Math.PI / 2, spread: Math.PI / 2, spd: [150, 600], xs: 0.6,
      jx: 60, g: 700, drag: 1, vr: 9, sz: [3, 7], c: ['#ffd166','#ff7eb6','#4ecdc4','#a06cff','#fff'], life: [1, 2], shape: 'rect' });
    sndFever();
  }

  /* ---- 描画 ---- */
  if (shareMsgT > 0) shareMsgT = Math.max(0, shareMsgT - rdt);
  if (shareMsgT < 0) shareMsgT = Math.min(0, shareMsgT + rdt);

  // タイトル画面の賑やかし（流れるトゲとコイン・当たり判定なし）
  if (state === 'title'){
    titleAmbT -= rdt;
    if (titleAmbT <= 0){
      titleAmbT = R(0.9, 1.8);
      if (needles.length < 12) spawnDrift();
      if (rng() < 0.2 && coins.length < 3) spawnCoin();
    }
    for (let i = needles.length - 1; i >= 0; i--){
      const n = needles[i];
      n.age += rdt;
      n.x += n.vx * rdt; n.y += (n.vy || 0) * rdt;
      n.rot = Math.atan2(n.vy || 0, n.vx);
      if (n.age > 0.5 && (n.x < -100 || n.x > W + 100 || n.y < -100 || n.y > H + 100)) needles.splice(i, 1);
    }
    for (let i = coins.length - 1; i >= 0; i--){
      coins[i].t += rdt;
      if (coins[i].t > coins[i].life) coins.splice(i, 1);
    }
  }

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sx = opts.noShake ? 0 : R(-shake, shake), sy = opts.noShake ? 0 : R(-shake, shake);
  ctx.translate(sx, sy);

  drawBG();
  for (const v of vortices) drawVortex(v);
  for (const c of coins) drawCoin(c);
  for (const bm of bombs) drawBomb(bm);
  for (const n of needles) drawNeedle(n);
  if (boss) drawBoss();
  if (state === 'play') drawBalloon();
  for (const L of lasers) drawLaser(L);
  drawParts();
  drawPopups();

  if (state === 'play' || state === 'dying') drawHUD();
  if (state === 'title') drawTitle();
  if (state === 'title' && achView) drawAchievements();
  if (state === 'over') drawOver();
  if (draft && state === 'play') drawDraft();
  if (paused && state === 'play' && !draft){
    ctx.fillStyle = 'rgba(15,8,30,0.55)';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = F(30); ctx.fillStyle = '#fff';
    ctx.fillText('⏸ 一時停止中（Pで再開）', W / 2, H / 2);
  }

  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10,4,24,0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(-20, -20, W + 40, H + 40);
}
requestAnimationFrame(frame);

/* ---------- デバッグ用フック（検証で使用・プレイに影響なし） ---------- */
window.GAME = {
  get state(){ return state; },
  get score(){ return Math.floor(score); },
  get level(){ return level; },
  get needleCount(){ return needles.length; },
  get draftOpen(){ return !!draft; },
  get bossHp(){ return boss ? boss.hp : null; },
  get fever(){ return fever; },
  get barrier(){ return barrier; },
  start(){ if (state !== 'play') startGame(); },
  addTime(s){ elapsed += s; },
  choose(i){ chooseDraft(i); },
  forceBoss(){ if (state === 'play' && !boss) startBoss(); },
  forceEvent(i){ const e = EVENTS[i]; if (e && state === 'play'){ mkt = { ...e, t: e.dur }; } },
  addFever(x){ addFever(x); },
  pop(){ die('デバッグ'); },
  god(n){ barrier = n; invulnT = 2; },
  bossDamage(n){ if (boss && !boss.entering){ boss.hp -= n; boss.hitFlash = 1; if (boss.hp <= 0) defeatBoss(); } },
  forceVortex(){ if (state === 'play') spawnVortex(); },
  forceLaser(){ if (state === 'play') spawnLaser(); },
  startDaily(){ if (state !== 'play') startGame(true); },
  get moodId(){ return mood && mood.id; },
  get bossType(){ return boss && boss.type; },
  get isDailyRun(){ return isDaily; },
  toggleAch(){ if (state === 'title') achView = !achView; },
  share(){ if (state === 'over') shareResult(); },
  forceGem(){ if (state === 'play') coins.push({ x: W / 2, y: H * 0.4, t: 0, life: 6, ph: 0, gem: true }); },
  get achCount(){ return Object.keys(achUnlocked).length; },
  get vortexCount(){ return vortices.length; },
  get laserCount(){ return lasers.length; },
  get windBlownCount(){ return windBlown; },
  get lifeStats(){ return { ...lifeStats }; },
  resetSave(){ try { ['best','ach','stats','daily','opts'].forEach(k => localStorage.removeItem('bubblenomics_' + k)); } catch(e){} },
  get blownCount(){ return needles.filter(n => n.blown).length; },
  debug(){
    return { r: +B.r.toFixed(1), x: +B.x.toFixed(0), y: +B.y.toFixed(0), elapsed: +elapsed.toFixed(1),
      ptrDown: ptr.down, ignoreVent, paused, level, invulnT: +invulnT.toFixed(2),
      boss: boss ? { type: boss.type, x: +boss.x.toFixed(0), y: +boss.y.toFixed(0), entering: boss.entering, life: +boss.life.toFixed(1), hp: boss.hp,
        aiming: +(boss.aiming || 0).toFixed(2), charging: +(boss.charging || 0).toFixed(2), chargeT: +(boss.chargeT || 0).toFixed(1) } : null };
  },
};
