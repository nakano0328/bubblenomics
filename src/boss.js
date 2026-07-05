'use strict';
/* ---------- ボス「ベア」 ---------- */
function startBoss(){
  bossCount++;
  const type = bossCount % 2 === 0 ? 'hawk' : 'bear';   // ベアとタカが交互に襲来
  const hp = 8 + 5 * (bossCount - 1);
  boss = { type, x: W / 2, y: -90, t: 0, entering: true, hp, maxHp: hp,
    atkT: 2.2, burstT: 6.5, life: 42, hitFlash: 0,
    chargeT: 6, aiming: 0, charging: 0, aimX: 0, aimY: 0, auraWarned: false };
  bannerTxt = type === 'hawk'
    ? '🦅 利上げのタカ襲来！オーラの中では資産がしぼむ！'
    : (bossCount >= 3 ? '🐻 ベア再襲来！今度は突進してくるぞ…！'
                      : '🐻 決算警報：ベア襲来！逃げながら噴射の風でトゲを当てろ！');
  bannerT = 3.5;
  pushNews(type === 'hawk' ? '速報：タカ派、市場に舞い降りる' : '速報：ベアが市場に乱入');
  beep(120, 0.5, 'sawtooth', 0.25, -40);
  shake = Math.max(shake, 8);
}
function defeatBoss(){
  const bonus = Math.floor(2500 * level + 5000 * bossCount);
  score += bonus;
  bossKills++;
  lifeStats.bears++; saveStats();
  if (boss.type === 'hawk') unlock('hawk1'); else unlock('bear1');
  if (lifeStats.bears >= 3) unlock('bear3');
  pushNews(boss.type === 'hawk' ? '速報：タカ、羽毛布団に転職' : '速報：ベア、風船の養分になる');
  bannerTxt = `🎉 ${boss.type === 'hawk' ? 'タカ' : 'ベア'}撃破！ボーナス ${yen(bonus)}！`;
  bannerT = 3.0;
  popup(boss.x, boss.y, '💥', '#fff', 40);
  sndLevel(); sndPop();
  shake = Math.max(shake, 16);
  addFever(0.5);
  emit(80, boss.x, boss.y, { spd: [60, 500], vy: -100, g: 560, drag: 1.1, vr: 8, sz: [3, 7],
    c: ['#ffd166','#ffe08a','#fff','#ff7eb6'], life: [0.7, 1.5], shape: 'rect' });
  rings.push({ x: boss.x, y: boss.y, r: 20, vr: 900, t: 0, life: 0.5, c: '#ffd166', w: 6 });
  // 撃破報酬：コインの雨
  for (let i = 0; i < 8; i++){
    pickups.push({ type: 'coin', x: clamp(boss.x + R(-140, 140), 40, W - 40), y: clamp(boss.y + R(-100, 100), 60, H - 40), t: 0, life: 11, ph: R(0, TAU) });
  }
  boss = null;
}
function updateBoss(gdt){
  const b = boss;
  b.t += gdt;
  b.hitFlash = Math.max(0, b.hitFlash - gdt * 4);
  if (b.entering){
    b.y += 100 * gdt;
    if (b.y >= H * 0.22) b.entering = false;
    return;
  }
  b.life -= gdt;
  if (b.life <= 0){
    bannerTxt = b.type === 'hawk' ? '🦅 タカは興味を失って飛び去った…（報酬なし）' : '🐻 ベアは満腹になって去った…（報酬なし）';
    bannerT = 3.0;
    boss = null;
    return;
  }
  // タカは常時／ベアは3体目以降：狙いを定めて突進する
  if (b.type === 'hawk' || bossCount >= 3){
    if (b.charging > 0){
      b.charging -= gdt;
      b.x += b.aimX * CHARGE_SPEED * gdt;
      b.y += b.aimY * CHARGE_SPEED * gdt;
      if (rng() < 0.5){
        emit(1, b.x, b.y, { jx: 20, jy: 20, spd: [0, 0], vx: -b.aimX * 120, vy: -b.aimY * 120,
          drag: 2.5, sz: [2, 5], c: 'rgba(255,90,110,0.7)', life: [0.4, 0.4] });
      }
      if (b.charging <= 0){ b.chargeT = Math.max(4.5, 7 - bossCount); }
    } else if (b.aiming > 0){
      b.aiming -= gdt;
      if (b.aiming <= 0){ b.charging = 0.55; shake = Math.max(shake, 6); beep(70, 0.4, 'sawtooth', 0.3, -20); }
    } else {
      b.chargeT -= gdt;
      if (b.chargeT <= 0){
        b.aiming = 0.8;
        const adx = B.x - b.x, ady = B.y - b.y, ad = Math.hypot(adx, ady) || 1;
        b.aimX = adx / ad; b.aimY = ady / ad;
        beep(110, 0.6, 'sawtooth', 0.2, 90);
      }
    }
  }
  // 移動（照準・突進中は停止）：ベアは追跡、タカは上空をパトロール
  if (!(b.aiming > 0) && !(b.charging > 0)){
    if (b.type === 'hawk'){
      const txp = W / 2 + Math.sin(b.t * 0.7) * W * 0.36;
      const typ = H * 0.24 + Math.sin(b.t * 1.35) * H * 0.13;
      b.x += (txp - b.x) * Math.min(1, 2.2 * gdt);
      b.y += (typ - b.y) * Math.min(1, 2.2 * gdt);
    } else {
      const dx = B.x - b.x, dy = B.y - b.y, d = Math.hypot(dx, dy) || 1;
      const sp = 34 + bossCount * 8;
      b.x += dx / d * sp * gdt + Math.cos(b.t * 1.3) * 30 * gdt;
      b.y += dy / d * sp * gdt * 0.6;
    }
  }
  b.x = clamp(b.x, -60, W + 60);
  b.y = clamp(b.y, -60, H + 60);
  // 攻撃：ベアは3方向の爪、タカは5方向の羽根
  b.atkT -= gdt;
  if (b.atkT <= 0){
    const base = Math.atan2(B.y - b.y, B.x - b.x);
    const offs = b.type === 'hawk' ? [-0.5, -0.25, 0, 0.25, 0.5] : [-0.28, 0, 0.28];
    b.atkT = b.type === 'hawk' ? Math.max(1.0, 1.6 - bossCount * 0.08) : Math.max(1.1, 1.8 - bossCount * 0.1);
    for (const off of offs){
      const n = needleBase(b.type === 'hawk' ? 'feather' : 'claw', b.type === 'hawk' ? '#e0b34d' : '#ff5c8a');
      n.len = b.type === 'hawk' ? 26 : 30;
      n.x = b.x + Math.cos(base + off) * 44;
      n.y = b.y + Math.sin(base + off) * 44;
      const sp2 = Math.min((b.type === 'hawk' ? 140 : 150) + bossCount * 14, 250);
      n.vx = Math.cos(base + off) * sp2;
      n.vy = Math.sin(base + off) * sp2;
      needles.push(n);
    }
    beep(b.type === 'hawk' ? 520 : 300, 0.12, 'sawtooth', 0.15, -80);
  }
  // 放射バースト（ベアのみ）
  b.burstT -= gdt;
  if (b.burstT <= 0 && b.type === 'bear'){
    b.burstT = 6.5;
    const cnt = 10, ph = R(0, TAU);
    for (let i = 0; i < cnt; i++){
      const a = ph + (i / cnt) * TAU;
      const n = needleBase('claw', '#ff5c8a');
      n.x = b.x + Math.cos(a) * 30;
      n.y = b.y + Math.sin(a) * 30;
      n.vx = Math.cos(a) * 130;
      n.vy = Math.sin(a) * 130;
      needles.push(n);
    }
    beep(160, 0.25, 'square', 0.2, -60);
  }
  // 体当たり
  if (Math.hypot(b.x - B.x, b.y - B.y) < B.r * 0.92 + BOSS_BODY_R){
    hitHazard(b.type === 'hawk' ? 'タカの爪に裂かれてバブル崩壊' : 'ベアに殴られてバブル崩壊');
  }
}
