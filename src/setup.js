'use strict';
/* =========================================================
   BUBBLENOMICS v4.1 〜バブルは、はじける直前がいちばん儲かる〜
   弾幕回避 × バブル経済 × ローグライトドラフト × 実績
   外部ライブラリ・ビルド不要。ブラウザネイティブで動作。

   このファイル（setup.js）はキャンバス初期化のみ。
   index.html が以下の順で読み込む（順序に依存）：
     setup → utils → config → data → state → audio →
     input → flow → boss → effects → spawn →
     simulation → render → main
   各ファイルは同一のグローバルスコープを共有する。
   ========================================================= */

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.floor(W * DPR); cv.height = Math.floor(H * DPR);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
}
window.addEventListener('resize', resize);
resize();
