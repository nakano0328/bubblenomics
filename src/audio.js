'use strict';
/* ---------- サウンド（WebAudio 生成） ---------- */
let AC = null, master = null, ventGain = null;
function initAudio(){
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.45; master.connect(AC.destination);
    const buf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = rng() * 2 - 1;
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.7;
    ventGain = AC.createGain(); ventGain.gain.value = 0;
    src.connect(bp); bp.connect(ventGain); ventGain.connect(master);
    src.start();
  } catch(e){ AC = null; }
}
function beep(freq, dur, type, vol, slide){
  if (!AC || muted) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), AC.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.2, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
    o.connect(g); g.connect(master);
    o.start(); o.stop(AC.currentTime + dur + 0.02);
  } catch(e){}
}
function sndPop(){
  if (!AC || muted) return;
  beep(220, 0.5, 'sawtooth', 0.3, -180);
  beep(90, 0.6, 'square', 0.25, -60);
  try {
    const buf = AC.createBuffer(1, AC.sampleRate * 0.3, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (rng() * 2 - 1) * (1 - i / d.length);
    const s = AC.createBufferSource(); s.buffer = buf;
    const g = AC.createGain(); g.gain.value = 0.4;
    s.connect(g); g.connect(master); s.start();
  } catch(e){}
}
function sndCoin(){ beep(880, 0.09, 'sine', 0.22); setTimeout(() => beep(1320, 0.15, 'sine', 0.22), 70); }
function sndGraze(){ beep(1600 + grazeCombo * 120, 0.06, 'triangle', 0.18); }
function sndLevel(){ [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'triangle', 0.2), i * 90)); }
function sndFever(){ [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => beep(f, 0.16, 'square', 0.14), i * 70)); }
function sndWarn(){ beep(1200, 0.08, 'square', 0.1); }
function sndShield(){ beep(500, 0.25, 'triangle', 0.3, 300); }
function sndBossHit(){ beep(180, 0.1, 'square', 0.2, -50); }

/* ---------- BGM（プロシージャル・ステップシーケンサ） ----------
   外部音源なし。タイトル＝静かなアンビエント、プレイ中＝軽快な
   アルペジオ（レベルでテンポ加速）、ボス戦＝緊迫、フィーバー中は
   既存のフィーバーアルペジオに主旋律を譲ってベースだけ残す。
   Bキー（opts.noBgm）でBGMのみOFF可。乱数はデイリーのシードを
   汚さないよう Math.random を直接使う。 */
const BGM_CHORDS = [
  [220.00, 261.63, 329.63],   // Am
  [174.61, 220.00, 261.63],   // F
  [130.81, 164.81, 196.00],   // C
  [196.00, 246.94, 293.66],   // G
];
function updateBgm(rdt){
  if (!AC || muted || opts.noBgm) return;
  if (state === 'dying' || state === 'over' || paused) return;   // 崩壊後は静寂
  bgmStepT -= rdt;
  if (bgmStepT > 0) return;
  const inBoss = state === 'play' && !!boss;
  const stepDur = state === 'title' ? 0.30
    : inBoss ? 0.16
    : Math.max(0.17, 0.24 - level * 0.006);
  bgmStepT += stepDur;
  if (bgmStepT < -0.5) bgmStepT = stepDur;   // タブ復帰時の追いつき連打を防ぐ
  const chord = BGM_CHORDS[(bgmStep >> 3) % BGM_CHORDS.length];
  const s = bgmStep & 7;
  // ベース（小節の1・5歩目）
  if (s === 0 || s === 4) beep(chord[0] / 2, 0.30, 'triangle', 0.07);
  // リード
  if (state === 'title'){
    if (s === 0 || s === 5) beep(chord[(bgmStep >> 3) % 3] * 2, 0.5, 'sine', 0.035);
  } else if (inBoss){
    beep(chord[s % 3] * (s % 2 ? 1 : 2), 0.10, 'square', 0.028);
    if (s === 6) beep(chord[2] * 2 * 1.06, 0.12, 'sawtooth', 0.03);   // 半音上の不穏な音
  } else if (!feverOn){
    if (s % 2 === 0) beep(chord[(s >> 1) % 3] * 2, 0.16, 'sine', 0.04);
    if (s === 7 && Math.random() < 0.4) beep(chord[1] * 4, 0.1, 'sine', 0.02);
  }
  bgmStep++;
}
