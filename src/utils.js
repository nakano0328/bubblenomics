'use strict';
/* ---------- ユーティリティ ---------- */
const TAU = Math.PI * 2;
let rng = Math.random;   // デイリー挑戦時はシード付き乱数に差し替え
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function todayJST(){ return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
function seedOf(str){ let h = 2026; for (const c of str) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
const R  = (a, b) => a + rng() * (b - a);
const RI = (a, b) => Math.floor(R(a, b + 1));
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
function lerpC(c1, c2, t){ return [lerp(c1[0],c2[0],t), lerp(c1[1],c2[1],t), lerp(c1[2],c2[2],t)]; }
function rgb(c, a){ return `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a===undefined?1:a})`; }
function hsl2rgb(h, s, l){
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))) * 255; };
  return [f(0), f(8), f(4)];
}
const FONT = '"Hiragino Maru Gothic ProN","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif';
const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
const F = (s, w) => `${w||'bold'} ${s}px ${FONT}`;
const yen = n => '¥' + Math.floor(n).toLocaleString('ja-JP');
// localStorage（失敗しても落ちない）
const store = {
  get(key, fb){ try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v === null ? fb : v; } catch(e){ return fb; } },
  set(key, val){ try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){} },
};
