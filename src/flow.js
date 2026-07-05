'use strict';
/* ---------- ゲーム開始 / 被弾 / 死亡 ---------- */
function startGame(daily){
  isDaily = !!daily;
  rng = isDaily ? mulberry32(seedOf(todayJST())) : Math.random;
  state = 'play'; paused = false;
  score = 0; elapsed = 0; level = 1;
  totalGraze = 0; maxMult = 1; grazeCombo = 0; grazeComboT = 0;
  spawnT = 2.5; coinT = 2.0; lastWallT = -99; criticalT = 0; slowT = 0;
  shake = 0; bannerT = 0; tipIdx = 0; wasRecord = false;
  grazeBonus = 0; ventEff = 1; coinMul = 1; inflMul = 1; thrustMul = 1; magnetR = 150; barrier = 0;
  compoundRate = 0; greedFire = false; ghostPerk = false;
  perkCounts = {}; invulnT = 0; windBlown = 0; achCheckT = 0; recordFxDone = false;
  fever = 0; feverOn = false; feverT = 0; feverCount = 0;
  boss = null; bossCount = 0; bossKills = 0; pendingBoss = false;
  mkt = null; mktT = 16; draft = null;
  runUnlocks = []; tickerStr = ''; pendingNews = [];
  B.x = W / 2; B.y = H / 2; B.vx = 0; B.vy = 0; B.r = START_R;
  needles = []; bombs = []; coins = []; parts = []; rings = []; popups = [];
  vortices = []; lasers = [];
  achView = false; helpView = false; shareMsgT = 0;
  mood = MOODS[Math.floor(rng() * MOODS.length)];
  bannerTxt = `${isDaily ? '📅 本日の相場　' : ''}${mood.icon} ${mood.name} — ${mood.desc}`;
  bannerT = 3.2;
  if (isDaily) unlock('daily1');
}
// リザルトからタイトルへ戻る（走っていた演出・敵は掃除、賑やかし用のトゲとコインは残す）
function gotoTitle(){
  state = 'title';
  boss = null; draft = null; pendingBoss = false;
  bombs = []; vortices = []; lasers = [];
  feverOn = false; fever = 0;
  paused = false; achView = false; helpView = false; shareMsgT = 0;
  if (ventGain && AC) ventGain.gain.setTargetAtTime(0, AC.currentTime, 0.02);
}
function vibrate(pat){ try { if (navigator.vibrate) navigator.vibrate(pat); } catch(e){} }
function hitHazard(reason){
  if (invulnT > 0) return;
  if (barrier > 0){
    barrier--;
    invulnT = 1.3;
    shake = Math.max(shake, 14);
    sndShield();
    vibrate(40);
    unlock('insured');
    if (ghostPerk) addFever(0.5);
    popup(B.x, B.y - B.r - 26, '🛡️ 保険発動！', '#6ee7ff', 22);
    rings.push({ x: B.x, y: B.y, r: B.r, vr: 900, t: 0, life: 0.4, c: '#6ee7ff', w: 5 });
    // 衝撃波：近くのトゲ・爆弾を消し飛ばす
    for (let i = needles.length - 1; i >= 0; i--){
      const n = needles[i];
      if (Math.hypot(n.x - B.x, n.y - B.y) < SHOCK_R){
        emit(4, n.x, n.y, { spd: [60, 220], drag: 3, sz: [1.5, 3.5], c: '#6ee7ff', life: [0.35, 0.35] });
        needles.splice(i, 1);
      }
    }
    for (let i = bombs.length - 1; i >= 0; i--){
      const bm = bombs[i];
      if (Math.hypot(bm.x - B.x, bm.y - B.y) < SHOCK_R){
        emit(8, bm.x, bm.y, { spd: [30, 160], drag: 2.5, sz: [2, 5], c: '#7ec97e', life: [0.5, 0.5] });
        bombs.splice(i, 1);
      }
    }
    return;
  }
  die(reason);
}
function die(reason){
  if (state !== 'play') return;
  state = 'dying'; dyingT = 0; deathReason = reason;
  shake = 24; sndPop();
  vibrate([60, 40, 120]);
  lifeStats.plays++; lifeStats.earned += Math.floor(score); saveStats();
  unlock('pop1');
  if (reason.startsWith('過熱')) unlock('overheat');
  if (isDaily){
    const today = todayJST();
    if (dailyRec.date !== today) dailyRec = { date: today, best: 0 };
    if (score > dailyRec.best) dailyRec.best = Math.floor(score);
    store.set('bubblenomics_daily', dailyRec);
  }
  if (score > best){ best = score; wasRecord = true; store.set('bubblenomics_best', Math.floor(best)); }
  emit(130, B.x, B.y, { spd: [80, 640], vy: -120, g: 620, drag: 1.1, vr: 9, sz: [3, 8], c: CONFETTI, life: [0.8, 1.8], shape: 'rect' });
  rings.push({ x: B.x, y: B.y, r: B.r, vr: 700, t: 0, life: 0.45, c: '#fff', w: 5 });
  rings.push({ x: B.x, y: B.y, r: B.r * 0.5, vr: 450, t: 0, life: 0.6, c: rgb(GOLD), w: 3 });
}

/* ---------- フィーバー ---------- */
function addFever(x){
  if (feverOn || state !== 'play') return;
  if (mood && mood.id === 'mania') x *= 1.3;
  fever = Math.min(1, fever + x);
  if (fever >= 1){
    feverOn = true; feverT = FEVER_DUR; feverCount++;
    feverBeatT = 0; feverNoteI = 0;
    bannerTxt = '🌈 バブルフィーバー！！ 資産3倍・配当2倍！';
    bannerT = 3.0;
    sndFever();
    unlock('fever1');
    pushNews('市場は完全に過熱、当局は静観');
    rings.push({ x: B.x, y: B.y, r: B.r, vr: 800, t: 0, life: 0.5, c: '#ffd166', w: 6 });
  }
}

/* ---------- ドラフト（投資戦略） ---------- */
function openDraft(){
  const pool = PERKS.filter(p => !(p.id === 'shield' && barrier >= 3) && !(p.max && (perkCounts[p.id] || 0) >= p.max));
  const opts = [];
  while (opts.length < 3 && pool.length){
    const i = RI(0, pool.length - 1);
    opts.push(pool.splice(i, 1)[0]);
  }
  draft = { opts, rects: [] };
  if (ventGain && AC) ventGain.gain.setTargetAtTime(0, AC.currentTime, 0.02);
  beep(660, 0.15, 'triangle', 0.2);
}
function chooseDraft(i){
  if (!draft) return;
  const p = draft.opts[i];
  if (!p) return;
  p.apply();
  if (p.persistent) perkCounts[p.id] = (perkCounts[p.id] || 0) + 1;
  popup(W / 2, H * 0.32, `${p.icon} ${p.name}！`, '#ffe08a', 22);
  beep(780, 0.12, 'triangle', 0.22);
  draft = null;
  ignoreVent = true;
  if (pendingBoss){ pendingBoss = false; startBoss(); }
}
