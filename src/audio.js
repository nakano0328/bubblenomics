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
