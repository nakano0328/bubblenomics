'use strict';
/* ---------- 入力 ---------- */
const ptr = { x: W / 2, y: H / 2, down: false };
const keys = new Set();
cv.addEventListener('pointerdown', e => {
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.down = true;
  initAudio();
  if (AC && AC.state === 'suspended') AC.resume();
  onPress();
});
window.addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; });
window.addEventListener('pointerup', () => { ptr.down = false; ignoreVent = false; });
window.addEventListener('pointercancel', () => { ptr.down = false; ignoreVent = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  keys.add(e.key);
  if (e.key === 'm' || e.key === 'M') muted = !muted;
  if (e.key === 'v' || e.key === 'V') { opts.noShake = !opts.noShake; saveOpts(); }
  if (e.key === 'p' || e.key === 'P') { if (state === 'play' && !draft) paused = !paused; }
  if (draft && ['1','2','3'].includes(e.key)) { chooseDraft(+e.key - 1); return; }
  if (e.key === ' ' || e.key === 'Enter') { initAudio(); onPress(); }
});
window.addEventListener('keyup', e => keys.delete(e.key));

function keyDir(){
  let x = 0, y = 0;
  if (keys.has('ArrowLeft')  || keys.has('a')) x -= 1;
  if (keys.has('ArrowRight') || keys.has('d')) x += 1;
  if (keys.has('ArrowUp')    || keys.has('w')) y -= 1;
  if (keys.has('ArrowDown')  || keys.has('s')) y += 1;
  return (x || y) ? { x, y } : null;
}
function onPress(){
  if (state === 'play' && draft){
    for (let i = 0; i < draft.rects.length; i++){
      const r = draft.rects[i];
      if (ptr.x >= r.x && ptr.x <= r.x + r.w && ptr.y >= r.y && ptr.y <= r.y + r.h){ chooseDraft(i); break; }
    }
    ignoreVent = true;
    return;
  }
  const hit = r => r && ptr.x >= r.x && ptr.x <= r.x + r.w && ptr.y >= r.y && ptr.y <= r.y + r.h;
  if (state === 'title'){
    if (achView){ achView = false; return; }
    if (hit(titleBtns.ach)){ achView = true; beep(600, 0.08, 'triangle', 0.15); return; }
    if (hit(titleBtns.daily)){ startGame(true); ignoreVent = true; return; }
    startGame(); ignoreVent = true;
  }
  else if (state === 'over'){
    if (hit(shareBtn)){ shareResult(); return; }
    if (overT > 0.7){ startGame(); ignoreVent = true; }
  }
}
function shareResult(){
  const txt = `🎈BUBBLENOMICS${isDaily ? '（📅本日の相場）' : ''} 第${level}四半期で崩壊\n💰${yen(score)} ${rankOf(score)[0]}\n🐻×${bossKills} 🌈×${feverCount} ✨×${totalGraze}\nhttps://nakano0328.github.io/bubblenomics/`;
  try {
    navigator.clipboard.writeText(txt).then(() => { shareMsgT = 2; }, () => { shareMsgT = -2; });
  } catch(e){ shareMsgT = -2; }
  beep(700, 0.1, 'triangle', 0.2);
}
