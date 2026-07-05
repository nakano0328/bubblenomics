'use strict';
/* ---------- ピックアップ（フィールドで拾うアイテム） ----------
   定義・出現・更新・取得効果・描画をこのファイルに集約。
   新アイテムは PICKUPS にエントリを足すだけで増やせる：
     chance/minLevel … 出現抽選（coinは残り全部）
     spin があれば コイン回転演出、なければ ゆらゆら揺れ
     collect(mult, p) … 取得時の効果 */
const PICKUPS = {
  coin: {
    icon: '🪙', glow: '255,220,120', glowR: 30, size: 28, spin: 3.2, life: 9,
    collect(mult, p){
      const bonus = Math.floor(400 * mult * coinMul * (feverOn ? 2 : 1));
      score += bonus;
      addFever(0.08);
      popup(p.x, p.y - 10, `+${yen(bonus).slice(1)} 配当💰`, '#ffe08a', 18);
      sndCoin();
      emit(10, p.x, p.y, { spd: [40, 180], vy: -40, g: 240, drag: 1.5, vr: 6, sz: [2, 4], c: '#ffd166', life: [0.6, 0.6], shape: 'rect' });
    },
  },
  gem: {
    icon: '💎', glow: '155,236,255', glowR: 36, size: 26, spin: 5, life: 6,
    minLevel: 2, chance: 0.08,
    collect(mult, p){
      const bonus = Math.floor(2000 * mult * coinMul * (feverOn ? 2 : 1));
      score += bonus;
      addFever(0.25);
      unlock('gem1');
      shake = Math.max(shake, 5);
      popup(p.x, p.y - 10, `+${yen(bonus).slice(1)} 時価総額💎`, '#9becff', 22);
      sndCoin(); beep(1760, 0.25, 'sine', 0.2);
      emit(18, p.x, p.y, { spd: [40, 260], vy: -40, g: 240, drag: 1.5, vr: 6, sz: [2, 4], c: '#9becff', life: [0.6, 0.6], shape: 'rect' });
    },
  },
  gild: {
    icon: '🎖️', glow: '255,215,0', glowR: 34, size: 28, life: 5,
    minLevel: 3, chance: 0.05,
    collect(mult, p){
      invulnT = Math.max(invulnT, GILD_DUR);
      gildT = GILD_DUR;
      unlock('gild1');
      popup(p.x, p.y - 12, `🎖️ 金箔コーティング！${GILD_DUR}秒間 無敵`, '#ffd700', 20);
      pushNews('風船、全身金箔で市場に現る');
      sndShield(); beep(1046, 0.3, 'triangle', 0.2, 200);
      rings.push({ x: B.x, y: B.y, r: B.r, vr: 600, t: 0, life: 0.5, c: '#ffd700', w: 4 });
      shake = Math.max(shake, 4);
    },
  },
  decree: {
    icon: '📜', glow: '190,255,190', glowR: 32, size: 28, life: 5,
    minLevel: 4, chance: 0.05,
    collect(mult, p){
      let cleared = 0;
      for (let i = needles.length - 1; i >= 0; i--){
        const nd = needles[i];
        if (nd.blown) continue;   // 味方化した誘導弾は没収しない
        emit(3, nd.x, nd.y, { spd: [40, 160], drag: 3, sz: [1.5, 3], c: '#bfffbf', life: [0.4, 0.4] });
        needles.splice(i, 1);
        cleared++;
      }
      const bonus = Math.floor(cleared * DECREE_FINE * mult);
      if (bonus > 0) score += bonus;
      unlock('decree1');
      popup(p.x, p.y - 12, `📜 規制発動！トゲ${cleared}本を没収${bonus ? `　+${yen(bonus).slice(1)}` : ''}`, '#bfffbf', 20);
      pushNews('当局、トゲの一斉摘発に踏み切る');
      rings.push({ x: p.x, y: p.y, r: 10, vr: 1200, t: 0, life: 0.5, c: '#bfffbf', w: 5 });
      beep(660, 0.3, 'triangle', 0.25, -200); sndCoin();
      shake = Math.max(shake, 8);
    },
  },
};

// 出現抽選：レア枠（gem/gild/decree）に外れたら coin
function rollPickupType(){
  const r = rng();
  let acc = 0;
  for (const id in PICKUPS){
    const def = PICKUPS[id];
    if (!def.chance || level < (def.minLevel || 1)) continue;
    acc += def.chance;
    if (r < acc) return id;
  }
  return 'coin';
}
function spawnPickup(type){
  const cap = (mkt && mkt.id === 'boom') ? 8 : 4;
  if (pickups.length >= cap) return;
  const id = type || rollPickupType();
  pickups.push({ type: id, x: R(W * 0.15, W * 0.85), y: R(H * 0.18, H * 0.82), t: 0, life: PICKUPS[id].life, ph: R(0, TAU) });
}
function updatePickups(gdt, mult){
  for (let i = pickups.length - 1; i >= 0; i--){
    const p = pickups[i];
    p.t += gdt;
    const dx = B.x - p.x, dy = B.y - p.y, d = Math.hypot(dx, dy);
    if (d < magnetR && d > 1){ p.x += dx / d * 130 * gdt; p.y += dy / d * 130 * gdt; }
    if (d < B.r + 18){
      PICKUPS[p.type].collect(mult, p);
      pickups.splice(i, 1);
      continue;
    }
    if (p.t > p.life) pickups.splice(i, 1);
  }
}
function drawPickup(p){
  const def = PICKUPS[p.type];
  const bobY = Math.sin(p.t * 3 + p.ph) * 5;
  const blink = p.life - p.t < 2 ? (Math.sin(p.t * 14) > 0 ? 1 : 0.25) : 1;
  ctx.save();
  ctx.translate(p.x, p.y + bobY);
  ctx.globalAlpha = blink;
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, def.glowR);
  g.addColorStop(0, `rgba(${def.glow},0.55)`);
  g.addColorStop(1, `rgba(${def.glow},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, def.glowR, 0, TAU); ctx.fill();
  if (def.spin){
    let sx = Math.sin(p.t * def.spin + p.ph);
    sx = Math.sign(sx || 1) * Math.max(Math.abs(sx), 0.18);
    ctx.scale(sx, 1);
  } else {
    ctx.rotate(Math.sin(p.t * 2.4 + p.ph) * 0.15);
  }
  ctx.font = `${def.size}px ${EMOJI}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(def.icon, 0, 0);
  ctx.restore();
}
