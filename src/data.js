'use strict';
/* ---------- 投資戦略（ドラフトperk） ---------- */
const PERKS = [
  { id:'graze',  icon:'🧿', name:'広域スレスレ', persistent:true,
    desc:['グレイズ判定が','+8px 広がる'],           apply(){ grazeBonus += 8; } },
  { id:'vent',   icon:'💨', name:'省エネ噴射',   persistent:true,
    desc:['噴射で しぼむ量','−20%'],                 apply(){ ventEff *= 0.8; } },
  { id:'coin',   icon:'🪙', name:'高配当株',     persistent:true,
    desc:['配当ボーナス','+60%'],                    apply(){ coinMul *= 1.6; } },
  { id:'shield', icon:'🛡️', name:'保険契約',     persistent:true,
    desc:['崩壊を1回防ぐ（最大3）','※過熱崩壊は対象外'], apply(){ barrier = Math.min(3, barrier + 1); } },
  { id:'cool',   icon:'🧊', name:'金融引き締め', persistent:true,
    desc:['インフレ速度','−18%'],                    apply(){ inflMul *= 0.82; } },
  { id:'thrust', icon:'🚀', name:'追い風',       persistent:true,
    desc:['噴射の推力','+25%'],                      apply(){ thrustMul *= 1.25; } },
  { id:'magnet', icon:'🧲', name:'磁力資産',     persistent:true,
    desc:['コイン吸引範囲','+80px'],                 apply(){ magnetR += 80; } },
  { id:'cash',   icon:'💴', name:'一括利確',     persistent:false,
    desc:['いますぐ','¥2,000 × 現在倍率 を獲得'],    apply(){ const b = Math.floor(2000 * multOf(B.r)); score += b; popup(B.x, B.y - B.r - 24, '+' + yen(b).slice(1), '#ffe08a', 20); } },
  { id:'heat',   icon:'🌈', name:'相場の熱気',   persistent:false,
    desc:['フィーバーゲージ','+50%'],                apply(){ addFever(0.5); } },
  { id:'compound', icon:'💹', name:'複利経営',   persistent:true,
    desc:['毎秒 資産の','+0.4% を自動獲得'],         apply(){ compoundRate += 0.004; } },
  { id:'greed',  icon:'🔥', name:'火事場の強欲', persistent:true, max:1,
    desc:['膨張率85%以上のとき','資産レート2倍'],    apply(){ greedFire = true; } },
  { id:'ghost',  icon:'👻', name:'不死鳥の残り香', persistent:true, max:1,
    desc:['保険発動時に','フィーバー+50%'],          apply(){ ghostPerk = true; } },
];

/* ---------- 市場イベント ---------- */
const EVENTS = [
  { id:'boom',       icon:'💹', name:'好景気',     dur:9, msg:'💹 好景気！配当ラッシュ！' },
  { id:'easing',     icon:'🌀', name:'金融緩和',   dur:8, msg:'🌀 金融緩和！インフレ加速＆資産1.5倍！' },
  { id:'regulation', icon:'🧯', name:'空売り規制', dur:8, msg:'🧯 空売り規制！トゲの動きが鈍る！' },
];

/* ---------- ニュースティッカー ---------- */
const NEWS_POOL = [
  '専門家「今回は違う」', '主婦もJKも風船買いに殺到', '靴磨きの少年、相場を語り始める',
  '風船銀行、金利据え置きを決定', 'アナリスト予想、今年も全員ハズレ', '猫も杓子もバブルに乗車',
  '匿名掲示板「まだ上がる」', 'サボテン農家、今年も豊作', 'ベア派閥がSNSで強気を挑発',
  '風船保険の加入者が急増', '格付け会社、とりあえず全部AAAに', '有識者「風船は実需」',
  '空に浮かぶものは全て買いだと話題に', '桐箱入りサボテン、高値で落札',
];
let tickerStr = '', tickerW = 0, tickerX = 0, pendingNews = [];
function pushNews(t){ if (pendingNews.length < 8) pendingNews.push(t); }
function rebuildTicker(){
  const items = pendingNews.splice(0, 4);
  while (items.length < 4) items.push(NEWS_POOL[RI(0, NEWS_POOL.length - 1)]);
  tickerStr = items.join('　◆　');
  ctx.font = F(12, '600');
  tickerW = ctx.measureText(tickerStr).width;
}
function updateTicker(rdt){
  if (!tickerStr){ rebuildTicker(); tickerX = W; }
  tickerX -= 70 * rdt;
  if (tickerX < -tickerW){ rebuildTicker(); tickerX = W; }
}

/* ---------- 実績 ---------- */
const ACHS = [
  { id:'pop1',     icon:'💥', name:'はじめてのバブル', desc:'初めて崩壊する' },
  { id:'graze10',  icon:'✨', name:'命知らず',         desc:'1プレイでスレスレ×10' },
  { id:'combo5',   icon:'🎯', name:'スレスレの美学',   desc:'グレイズコンボ×5' },
  { id:'fever1',   icon:'🌈', name:'フィーバー入門',   desc:'フィーバーを起こす' },
  { id:'bear1',    icon:'🐻', name:'ベア退治',         desc:'ベアを撃破する' },
  { id:'bear3',    icon:'🏹', name:'猛獣ハンター',     desc:'通算3体のボスを撃破' },
  { id:'hawk1',    icon:'🦅', name:'タカ狩り',         desc:'利上げのタカを撃破する' },
  { id:'mult30',   icon:'🎈', name:'膨張の限界',       desc:'資産倍率×30に到達' },
  { id:'q8',       icon:'🗓️', name:'第8四半期の生還者', desc:'第8四半期まで生き延びる' },
  { id:'rich100k', icon:'💰', name:'十万長者',         desc:'資産¥100,000を達成' },
  { id:'rich1m',   icon:'👑', name:'ミリオネア',       desc:'資産¥1,000,000を達成' },
  { id:'insured',  icon:'🛡️', name:'保険は正義',       desc:'保険で崩壊を免れる' },
  { id:'overheat', icon:'🔥', name:'強欲の代償',       desc:'過熱で崩壊する' },
  { id:'wind10',   icon:'💨', name:'風使い',           desc:'1プレイでトゲ×10を吹き飛ばす' },
  { id:'gem1',     icon:'💎', name:'ダイヤの輝き',     desc:'ダイヤを回収する' },
  { id:'daily1',   icon:'📅', name:'日課の投機',       desc:'「本日の相場」に挑戦する' },
];
let achUnlocked = store.get('bubblenomics_ach', {});
let achToasts = [], runUnlocks = [];
function unlock(id){
  if (achUnlocked[id]) return;
  achUnlocked[id] = true;
  store.set('bubblenomics_ach', achUnlocked);
  const a = ACHS.find(x => x.id === id);
  if (a){ achToasts.push({ txt: `${a.icon} 実績解除「${a.name}」`, t: 0 }); runUnlocks.push(a); sndCoin(); }
}

/* ---------- 生涯統計 ---------- */
let lifeStats = store.get('bubblenomics_stats', { plays: 0, earned: 0, bears: 0 });
if (typeof lifeStats.plays !== 'number') lifeStats = { plays: 0, earned: 0, bears: 0 };
function saveStats(){ store.set('bubblenomics_stats', lifeStats); }

/* ---------- デイリー記録・設定 ---------- */
let dailyRec = store.get('bubblenomics_daily', { date: '', best: 0 });
let opts = store.get('bubblenomics_opts', { noShake: false });
function saveOpts(){ store.set('bubblenomics_opts', opts); }

const RANKS = [
  [0,      '🌱 養分',          '#9fb2c8'],
  [8000,   '📈 見習い投機家',  '#bfe3ff'],
  [40000,  '💼 敏腕トレーダー','#7ee787'],
  [120000, '🔮 相場の魔術師',  '#c85cff'],
  [300000, '👑 億り人',        '#ffd166'],
  [800000, '🫧 バブルの神',    '#ff7eb6'],
];
function rankOf(s){ let r = RANKS[0]; for (const e of RANKS) if (s >= e[0]) r = e; return [r[1], r[2]]; }
function nextRankOf(s){ for (const e of RANKS) if (s < e[0]) return e; return null; }

/* ---------- 相場の気分（ランごとのモディファイア） ---------- */
const MOODS = [
  { id:'bull',    icon:'🐂', name:'強気相場', desc:'コイン出現 +50%' },
  { id:'panic',   icon:'🧸', name:'疑心暗鬼', desc:'トゲ +20% ／ 資産 +25%' },
  { id:'sticky',  icon:'🍯', name:'粘性相場', desc:'トゲの速度 -12%' },
  { id:'turb',    icon:'🌪️', name:'乱気流',   desc:'風船が流される' },
  { id:'lowrate', icon:'🏦', name:'低金利',   desc:'インフレ -15%' },
  { id:'mania',   icon:'🎰', name:'投機熱',   desc:'フィーバー蓄積 +30%' },
];
