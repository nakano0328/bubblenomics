'use strict';
/* ---------- 状態 ---------- */
let state = 'title';   // title | play | dying | over
let tReal = 0, elapsed = 0, level = 1;
let score = 0, best = 0, wasRecord = false;
let totalGraze = 0, maxMult = 1, grazeCombo = 0, grazeComboT = 0;
let spawnT = 0, coinT = 0, lastWallT = -99, criticalT = 0, warnBeepT = 0;
let shake = 0, dyingT = 0, overT = 0, bannerTxt = '', bannerT = 0, slowT = 0;
let deathReason = '', ignoreVent = false, paused = false, muted = false;
// perk効果
let grazeBonus = 0, ventEff = 1, coinMul = 1, inflMul = 1, thrustMul = 1, magnetR = 150, barrier = 0;
let compoundRate = 0, greedFire = false, ghostPerk = false;
let perkCounts = {}, invulnT = 0, windBlown = 0, achCheckT = 0, recordFxDone = false;
// 新ハザード
let vortices = [], lasers = [];
// フィーバーBGM
let feverBeatT = 0, feverNoteI = 0;
// フィーバー
let fever = 0, feverOn = false, feverT = 0, feverCount = 0;
// ボス・イベント・ドラフト
let boss = null, bossCount = 0, bossKills = 0, pendingBoss = false;
let mkt = null, mktT = 16;
let draft = null;
let mood = MOODS[0], isDaily = false;
let titleBtns = {}, achView = false, shareBtn = null, shareMsgT = 0, titleAmbT = 1;
let retryBtn = null, menuBtn = null, skinBtns = [];
// BGMシーケンサ
let bgmStepT = 0, bgmStep = 0;
best = +store.get('bubblenomics_best', 0) || 0;

const B = { x: 0, y: 0, vx: 0, vy: 0, r: START_R, jetDir: {x:0,y:1} };
let needles = [], bombs = [], coins = [], parts = [], rings = [], popups = [];
const tips = [
  { at: 0.4, txt: '長押し：空気を噴射してカーソルの方へ！' },
  { at: 3.2, txt: '離すと ふくらんで資産が増える…でも当たり判定も💦' },
  { at: 6.5, txt: '噴射の風はトゲを吹き飛ばせる！💨' },
  { at: 10.0, txt: 'トゲすれすれで「リスクプレミアム」→ フィーバーゲージUP！' },
];
let tipIdx = 0;

/* ---------- 背景の塵 ---------- */
const dust = [];
for (let i = 0; i < 60; i++) dust.push({ x: rng(), y: rng(), r: R(0.6, 2.2), s: R(4, 14), a: R(0.08, 0.3) });
