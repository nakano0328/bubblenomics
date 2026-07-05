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
  if (e.key === 'b' || e.key === 'B') { opts.noBgm = !opts.noBgm; saveOpts(); }
  if (e.key === 'v' || e.key === 'V') { opts.noShake = !opts.noShake; saveOpts(); }
  if (e.key === 'p' || e.key === 'P') { if (state === 'play' && !draft) paused = !paused; }
  if (e.key === 'Escape'){
    if (state === 'title' && overlayView){ overlayView = null; return; }
    if (state === 'play' && !draft) paused = !paused;
    return;
  }
  if (draft && ['1','2','3'].includes(e.key)) { chooseDraft(+e.key - 1); return; }
  if (e.key === ' ' || e.key === 'Enter'){
    initAudio();
    // リザルトでは Space/Enter＝もう一度（マウス位置に関係なく再上場）
    if (state === 'over' && overT > 0.7){ startGame(isDaily); ignoreVent = true; return; }
    onPress();
  }
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
      if (ptrIn(draft.rects[i])){ chooseDraft(i); break; }
    }
    ignoreVent = true;
    return;
  }
  if (state === 'title') pressTitle();
  else if (state === 'over') pressOver();
}
function pressTitle(){
  if (overlayView){ overlayView = null; return; }
  if (ptrIn(titleBtns.ach)){ overlayView = 'ach'; beep(600, 0.08, 'triangle', 0.15); return; }
  if (ptrIn(titleBtns.help)){ overlayView = 'help'; beep(600, 0.08, 'triangle', 0.15); return; }
  if (ptrIn(titleBtns.daily)){ startGame(true); ignoreVent = true; return; }
  // スキン選択（タップしやすいよう判定を7px広げる）
  for (let i = 0; i < skinBtns.length; i++){
    if (ptrIn(skinBtns[i], 7)){
      if (Object.keys(achUnlocked).length >= SKINS[i].need){
        opts.skin = i; saveOpts();
        beep(880, 0.08, 'sine', 0.15);
      } else {
        popup(ptr.x, ptr.y - 24, `🔒 実績${SKINS[i].need}個で解放`, '#ff8fa3', 14);
      }
      return;
    }
  }
  startGame(); ignoreVent = true;
}
function pressOver(){
  if (ptrIn(shareBtn)){ shareResult(); return; }
  if (overT <= 0.7) return;
  if (ptrIn(retryBtn)){ startGame(isDaily); ignoreVent = true; return; }
  gotoTitle();   // メニューボタン or それ以外のクリックはタイトルへ
}
function shareResult(){
  const txt = `🎈BUBBLENOMICS${isDaily ? '（📅本日の相場）' : ''} 第${level}四半期で崩壊\n💰${yen(score)} ${rankOf(score)[0]}\n🐻×${bossKills} 🌈×${feverCount} ✨×${totalGraze}\nhttps://nakano0328.github.io/bubblenomics/`;
  try {
    navigator.clipboard.writeText(txt).then(() => { shareMsgT = 2; }, () => { shareMsgT = -2; });
  } catch(e){ shareMsgT = -2; }
  beep(700, 0.1, 'triangle', 0.2);
}
