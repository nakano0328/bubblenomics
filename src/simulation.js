'use strict';
/* ---------- メイン更新 ---------- */
function simulate(gdt){
  elapsed += gdt;
  invulnT = Math.max(0, invulnT - gdt);
  gildT = Math.max(0, gildT - gdt);

  // ---- 四半期（レベル）進行 ----
  const newLevel = 1 + Math.floor(elapsed / QUARTER_SEC);
  if (newLevel > level){
    level = newLevel;
    if (level >= 8) unlock('q8');
    if (LEVEL_MSG[level]) pushNews(LEVEL_MSG[level]);
    if (level % 4 === 0){
      bannerTxt = `第${level}四半期`;
      pendingBoss = true;
    } else {
      bannerTxt = `第${level}四半期` + (LEVEL_MSG[level] ? `　${LEVEL_MSG[level]}` : (level > 7 ? '　市場は完全に狂った。' : ''));
    }
    bannerT = 2.8; sndLevel();
    if (level >= 2){ openDraft(); return; }   // ドラフト中はシミュレーション停止
  }

  // ---- チュートリアルtips ----
  if (tipIdx < tips.length && elapsed >= tips[tipIdx].at){
    popup(W / 2, H * 0.22, tips[tipIdx].txt, '#bfe3ff', 18);
    tipIdx++;
  }

  // ---- フィーバー ----
  if (feverOn){
    feverT -= gdt;
    fever = clamp(feverT / FEVER_DUR, 0, 1);
    if (feverT <= 0){ feverOn = false; fever = 0; }
  }

  // ---- 市場イベント ----
  if (mkt){
    mkt.t -= gdt;
    if (mkt.t <= 0){ mkt = null; mktT = R(18, 28); }
  } else if (level >= 3 && !boss){
    mktT -= gdt;
    if (mktT <= 0){
      const e = EVENTS[RI(0, EVENTS.length - 1)];
      mkt = { ...e, t: e.dur };
      bannerTxt = e.msg; bannerT = 2.8;
      pushNews(e.msg.replace(/^[^ ]+ /, ''));
      beep(440, 0.2, 'triangle', 0.2, 200);
    }
  }

  // ---- 噴射（vent）と膨張 ----
  const kd = keyDir();
  let target = null;
  if (kd) target = { x: B.x + kd.x * 100, y: B.y + kd.y * 100 };
  else if (ptr.down && !ignoreVent) target = { x: ptr.x, y: ptr.y };
  const venting = !!target;

  const inflNow = inflationRate(level) * inflMul
    * (mkt && mkt.id === 'easing' ? 1.6 : 1)
    * (mood.id === 'lowrate' ? 0.85 : 1);
  const inAura = boss && !boss.entering && boss.type === 'hawk'
    && Math.hypot(boss.x - B.x, boss.y - B.y) < AURA_R;
  if (inAura){
    B.r = Math.max(MINR, B.r - AURA_SHRINK * gdt);   // 利上げオーラ：インフレ停止＆収縮
    if (!boss.auraWarned){ boss.auraWarned = true; popup(B.x, B.y - B.r - 30, '⚠ 利上げオーラ：資産がしぼむ！', '#ffd166', 16); }
  } else {
    B.r += inflNow * gdt;
  }
  if (venting){
    B.r = Math.max(MINR, B.r - VENT_SHRINK * ventEff * gdt);
    const dx = target.x - B.x, dy = target.y - B.y;
    const d = Math.hypot(dx, dy);
    if (d > 2){
      const nx = dx / d, ny = dy / d;
      B.vx += nx * THRUST * thrustMul * gdt; B.vy += ny * THRUST * thrustMul * gdt;
      B.jetDir = { x: -nx, y: -ny };
      emit(3, B.x + B.jetDir.x * B.r, B.y + B.jetDir.y * B.r, {
        ang: Math.atan2(B.jetDir.y, B.jetDir.x), spread: 0.5, spd: [160, 320],
        vx: B.vx * 0.4, vy: B.vy * 0.4, drag: 3.5, sz: [2, 4.5],
        c: 'rgba(220,235,255,0.9)', life: [0.2, 0.4] });
    }
  } else {
    B.jetDir = { x: 0, y: 1 };
  }
  if (ventGain && AC) ventGain.gain.setTargetAtTime((venting && !muted) ? 0.09 : 0, AC.currentTime, 0.04);

  // ---- 物理 ----
  B.vy -= (B.r - 34) * 1.5 * gdt;
  if (mood.id === 'turb'){   // 乱気流：ゆっくり向きを変える風に流される
    const ta = tReal * 0.35;
    B.vx += Math.cos(ta) * 42 * gdt;
    B.vy += Math.sin(ta) * 26 * gdt;
  }
  const drag = Math.exp(-2.1 * gdt);
  B.vx *= drag; B.vy *= drag;
  B.x += B.vx * gdt; B.y += B.vy * gdt;
  if (B.x < B.r)      { B.x = B.r;      B.vx =  Math.abs(B.vx) * 0.55; }
  if (B.x > W - B.r)  { B.x = W - B.r;  B.vx = -Math.abs(B.vx) * 0.55; }
  if (B.y < B.r)      { B.y = B.r;      B.vy =  Math.abs(B.vy) * 0.55; }
  if (B.y > H - B.r)  { B.y = H - B.r;  B.vy = -Math.abs(B.vy) * 0.55; }

  // ---- 過熱（限界サイズ・保険対象外） ----
  if (B.r >= MAXR){
    B.r = MAXR;
    criticalT += gdt;
    shake = Math.max(shake, 4);
    warnBeepT -= gdt;
    if (warnBeepT <= 0){ sndWarn(); warnBeepT = 0.18; }
    if (criticalT > 1.0){
      die('過熱によりバブル崩壊' + (barrier > 0 ? '（※過熱は保険対象外です）' : '（ふくらみすぎ）'));
      return;
    }
  } else {
    criticalT = Math.max(0, criticalT - gdt * 2);
  }

  // ---- 資産（スコア） ----
  const mult = multOf(B.r);
  maxMult = Math.max(maxMult, mult);
  const ratioNow = (B.r - MINR) / (MAXR - MINR);
  score += SCORE_RATE * mult * (1 + (level - 1) * 0.18)
         * (feverOn ? 3 : 1)
         * (greedFire && ratioNow > 0.85 ? 2 : 1)
         * (mood.id === 'panic' ? 1.25 : 1)
         * (mkt && mkt.id === 'easing' ? 1.5 : 1) * gdt;
  if (compoundRate > 0) score += score * compoundRate * gdt;   // 複利経営
  if (!bestPassed && best > 0 && score > best){
    bestPassed = true;
    bannerTxt = '🚀 歴代最高を突破！ここからは全部が新記録！';
    bannerT = 3.0;
    pushNews('無名の風船、歴代最高資産を更新中');
    sndLevel();
  }
  if (gildT > 0 && rng() < 0.5){   // 金箔の煌めき
    const ga = R(0, TAU);
    emit(1, B.x + Math.cos(ga) * B.r, B.y + Math.sin(ga) * B.r,
      { spd: [10, 60], vy: -30, drag: 1, sz: [1.5, 3], c: '#ffe680', life: [0.4, 0.7] });
  }
  achCheckT -= gdt;
  if (achCheckT <= 0){
    achCheckT = 0.5;
    if (mult >= 30) unlock('mult30');
    if (score >= 100000) unlock('rich100k');
    if (score >= 1000000) unlock('rich1m');
  }
  // フィーバーBGM（簡易アルペジオ）
  if (feverOn){
    feverBeatT -= gdt;
    if (feverBeatT <= 0){
      const notes = [523, 659, 784, 880, 1046, 880, 784, 659];
      beep(notes[feverNoteI++ % notes.length], 0.12, 'square', 0.055);
      feverBeatT = 0.14;
    }
  }

  // ---- ボス ----
  if (boss){
    updateBoss(gdt);
    if (state !== 'play') return;
  }

  // ---- スポーン ----
  if (elapsed > 2.5){
    spawnT -= gdt;
    if (spawnT <= 0){
      spawnWave();
      const base = Math.max(0.65, 2.3 - (level - 1) * 0.18) * (boss ? 1.9 : 1) * (mood.id === 'panic' ? 0.83 : 1);
      spawnT = base * R(0.7, 1.3);
    }
  }
  coinT -= gdt;
  if (coinT <= 0){
    spawnPickup();
    coinT = ((mkt && mkt.id === 'boom') ? R(0.5, 1.0) : R(3, 4.5)) * (mood.id === 'bull' ? 0.66 : 1);
  }

  // ---- エンティティ更新（プレイヤー死亡時は false が返り即中断） ----
  if (!updateNeedles(gdt, venting, mult)) return;
  if (!updateBombs(gdt)) return;
  updateVortices(gdt);
  if (!updateLasers(gdt)) return;
  updatePickups(gdt, mult);
}

/* ---------- エンティティ更新 ---------- */
function updateNeedles(gdt, venting, mult){
  grazeComboT -= gdt;
  if (grazeComboT <= 0) grazeCombo = 0;
  const GR = GRAZE + grazeBonus;
  const ndtF = (feverOn ? 0.88 : 1) * (mkt && mkt.id === 'regulation' ? 0.6 : 1) * (mood.id === 'sticky' ? 0.88 : 1);
  const nozX = B.x + B.jetDir.x * B.r, nozY = B.y + B.jetDir.y * B.r;
  for (let i = needles.length - 1; i >= 0; i--){
    const n = needles[i];
    const ndt = gdt * ndtF;
    n.age += ndt; n.t += ndt;
    // 噴射の風：ノズル前方のトゲを吹き飛ばす
    if (venting){
      const wx = n.x - nozX, wy = n.y - nozY, wd = Math.hypot(wx, wy);
      if (wd < WIND_RANGE && wd > 1){
        const dot = (wx / wd) * B.jetDir.x + (wy / wd) * B.jetDir.y;
        if (dot > 0.3){
          if (!n.blown){
            n.blown = true; n.vy = n.vy || 0;
            windBlown++;
            if (windBlown >= 10) unlock('wind10');
          }
          n.vx += B.jetDir.x * WIND_PUSH * gdt;
          n.vy += B.jetDir.y * WIND_PUSH * gdt;
          const s = Math.hypot(n.vx, n.vy);
          if (s > WIND_MAXV){ n.vx *= WIND_MAXV / s; n.vy *= WIND_MAXV / s; }
        }
      }
    }
    // 吹き飛ばされたトゲ＝味方の誘導弾：ボスへホーミング
    if (n.blown && boss && !boss.entering){
      const bdx = boss.x - n.x, bdy = boss.y - n.y, bd = Math.hypot(bdx, bdy) || 1;
      n.vx += bdx / bd * HOMING_ACC * gdt;
      n.vy += bdy / bd * HOMING_ACC * gdt;
      const bs = Math.hypot(n.vx, n.vy);
      if (bs > HOMING_MAXV){ n.vx *= HOMING_MAXV / bs; n.vy *= HOMING_MAXV / bs; }
    }
    if (n.type === 'sine' && !n.blown){
      n.x += n.vx * ndt;
      n.y = n.y0 + Math.sin(n.t * n.f + n.ph) * n.A;
      n.rot = Math.atan2(Math.cos(n.t * n.f + n.ph) * n.A * n.f, n.vx);
    } else {
      n.x += n.vx * ndt; n.y += (n.vy || 0) * ndt;
      n.rot = Math.atan2(n.vy || 0, n.vx);
    }
    if (n.blown && rng() < 0.3){
      emit(1, n.x, n.y, { spd: [0, 30], drag: 2, sz: [1, 2.5], c: 'rgba(110,231,255,0.8)', life: [0.3, 0.3] });
    }
    if (n.age > 0.5 && (n.x < -100 || n.x > W + 100 || n.y < -100 || n.y > H + 100)){
      needles.splice(i, 1); continue;
    }
    // 誘導弾 vs ボス
    if (boss && !boss.entering && n.blown){
      if (Math.hypot(n.x - boss.x, n.y - boss.y) < BOSS_HIT_R + n.hitR){
        boss.hp--; boss.hitFlash = 1;
        sndBossHit();
        popup(boss.x + R(-20, 20), boss.y - 40, '💥', '#fff', 24);
        addFever(0.05);
        emit(6, n.x, n.y, { spd: [60, 260], drag: 3, sz: [2, 4], c: '#6ee7ff', life: [0.35, 0.35] });
        needles.splice(i, 1);
        if (boss.hp <= 0) defeatBoss();
        continue;
      }
    }
    if (n.blown) continue;   // 味方化したトゲはプレイヤーに無害（グレイズも無し）
    const d = Math.hypot(n.x - B.x, n.y - B.y);
    if (invulnT <= 0 && d < B.r * 0.92 + n.hitR){
      hitHazard('市場の棘に触れてバブル崩壊');
      if (state !== 'play') return false;
      break;   // 保険発動時：衝撃波で配列が変わるためループ打ち切り
    }
    if (!n.grazed && d < B.r + GR + n.hitR){
      n.grazed = true;
      grazeCombo++; grazeComboT = 2.0; totalGraze++;
      slowT = 0.1;
      if (totalGraze >= 10) unlock('graze10');
      if (grazeCombo >= 5) unlock('combo5');
      addFever(0.1 + Math.min(grazeCombo * 0.02, 0.1));
      const bonus = Math.floor(60 * mult * grazeCombo);
      score += bonus;
      popup(n.x, n.y - 14, `+${yen(bonus).slice(1)} スレスレ!${grazeCombo > 1 ? ' ×' + grazeCombo : ''}`, '#ffd166', 15 + Math.min(grazeCombo * 1.5, 8));
      sndGraze();
      shake = Math.max(shake, 2.5);
      emit(6, n.x, n.y, { spd: [60, 200], drag: 3, sz: [1.5, 3.5], c: '#ffd166', life: [0.35, 0.35] });
    }
  }
  return true;
}
function updateBombs(gdt){
  for (let i = bombs.length - 1; i >= 0; i--){
    const bm = bombs[i];
    bm.t += gdt; bm.fuse -= gdt;
    if (!bm.arrived){
      bm.x += bm.vx * gdt; bm.y += bm.vy * gdt;
      if (Math.hypot(bm.tx - bm.x, bm.ty - bm.y) < 10) bm.arrived = true;
    }
    if (invulnT <= 0 && Math.hypot(bm.x - B.x, bm.y - B.y) < B.r * 0.92 + bm.hitR){
      hitHazard('サボテンに触れてバブル崩壊');
      if (state !== 'play') return false;
      break;
    }
    if (bm.fuse <= 0){ burstBomb(bm); bombs.splice(i, 1); }
  }
  return true;
}
function updateVortices(gdt){
  for (let i = vortices.length - 1; i >= 0; i--){
    const v = vortices[i];
    v.t += gdt;
    if (v.t > v.life){ vortices.splice(i, 1); continue; }
    const mdx = v.tx - v.x, mdy = v.ty - v.y, md = Math.hypot(mdx, mdy);
    if (md > 4){ v.x += mdx / md * 70 * gdt; v.y += mdy / md * 70 * gdt; }
    const dx = v.x - B.x, dy = v.y - B.y, d = Math.hypot(dx, dy);
    if (d < v.R && d > 1){
      const f = 300 * (1 - d / v.R);
      B.vx += dx / d * f * gdt;
      B.vy += dy / d * f * gdt;
    }
    // 渦に吸われる塵の演出（中心へ向かう速度が必要なので emit ではなく直接生成）
    if (rng() < 0.4){
      const a = R(0, TAU), rr = R(v.R * 0.4, v.R);
      parts.push({ x: v.x + Math.cos(a) * rr, y: v.y + Math.sin(a) * rr,
        vx: -Math.cos(a) * rr * 0.9, vy: -Math.sin(a) * rr * 0.9,
        g: 0, drag: 0.4, rot: 0, vr: 0, sz: R(1, 2.5), c: 'rgba(200,191,255,0.6)', t: 0, life: 0.8, shape: 'dot' });
    }
  }
}
function updateLasers(gdt){
  for (let i = lasers.length - 1; i >= 0; i--){
    const L = lasers[i];
    L.t += gdt;
    if (L.t > L.warn + L.fire){ lasers.splice(i, 1); continue; }
    if (L.t > L.warn && invulnT <= 0){
      const d = L.vertical ? Math.abs(B.x - L.pos) : Math.abs(B.y - L.pos);
      if (d < B.r * 0.92 + 12){
        hitHazard('当局の監視ビームに焼かれてバブル崩壊');
        if (state !== 'play') return false;
      }
    }
  }
  return true;
}

function updateFx(gdt){
  for (let i = parts.length - 1; i >= 0; i--){
    const p = parts[i];
    p.t += gdt;
    if (p.t > p.life){ parts.splice(i, 1); continue; }
    p.vy += (p.g || 0) * gdt;
    const dr = Math.exp(-(p.drag || 0) * gdt);
    p.vx *= dr; p.vy *= dr;
    p.x += p.vx * gdt; p.y += p.vy * gdt;
    p.rot += (p.vr || 0) * gdt;
  }
  for (let i = rings.length - 1; i >= 0; i--){
    const r0 = rings[i];
    r0.t += gdt;
    if (r0.t > r0.life){ rings.splice(i, 1); continue; }
    r0.r += r0.vr * gdt;
  }
  for (let i = popups.length - 1; i >= 0; i--){
    const p = popups[i];
    p.t += gdt;
    if (p.t > p.life) popups.splice(i, 1);
  }
}
