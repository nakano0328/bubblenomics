'use strict';
/* ---------- ゲーム定数（バランス調整の中枢） ---------- */
const MINR = 16, MAXR = 95;
const START_R = 30;
const GRAZE = 26;                  // グレイズ基本余白
const VENT_SHRINK = 34;
const THRUST = 1050;
const SCORE_RATE = 60;
const QUARTER_SEC = 18;
const FEVER_DUR = 12;
// 風・誘導弾
const WIND_RANGE = 180;            // 噴射風がトゲに届く距離
const WIND_PUSH = 1500;            // 風の加速度
const WIND_MAXV = 520;             // 吹き飛ばされたトゲの最高速度
const HOMING_ACC = 1100;           // 味方化トゲのホーミング加速度
const HOMING_MAXV = 560;
// ボス
const AURA_R = 210;                // タカの利上げオーラ半径
const AURA_SHRINK = 4;             // オーラ内での資産収縮速度
const CHARGE_SPEED = 640;          // 突進速度
const BOSS_BODY_R = 40;            // 体当たり判定
const BOSS_HIT_R = 52;             // 誘導弾の命中判定
// 保険
const SHOCK_R = 210;               // 保険発動時の衝撃波半径
// ピックアップ
const GILD_DUR = 4;                // 🎖️金箔コーティングの無敵秒数
const DECREE_FINE = 15;            // 📜規制通達のトゲ1本あたり没収金（×倍率）
const inflationRate = lv => Math.min(7 + (lv - 1) * 1.1, 16);
const multOf = r => (r / MINR) * (r / MINR);

const PINK = [255,126,182], GOLD = [255,209,102], RED = [255,77,109];
const LEVEL_MSG = {
  2: '狙撃針が資産を狙ってくる…！',
  3: '蛇行するトゲ市場、出現',
  5: 'インフレ加速！ふくらみが止まらない！',
  6: 'トゲの壁が迫る…隙間を抜けろ！',
  7: 'ここから先は、カオス相場。',
};
