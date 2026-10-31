(function () {
  'use strict';
  window.Engine = window.Engine || {};

  Engine.initResolveStages = function () {

    Stages.use('resolve:overload', function (ctx) {
      const defOverload = Engine.getBuffStacks(ctx.defP, 'overload');
      if (defOverload > 0) {
        const dmg = Math.floor(defOverload * 0.5);
        if (dmg > 0) {
          const actual = Engine.applyDamage(ctx.defP, dmg);
          if (actual > 0) {
            Engine.showDamage(ctx.defSide, actual);
            Engine.shakePortrait(ctx.defSide, actual >= 10);
          }
        }
      }
    }, { priority: -100 });

    Stages.use('resolve:leap_hack', function (ctx) {
      applyLeapAndHack(ctx.atkP, ctx.defP);
      applyLeapAndHack(ctx.defP, ctx.atkP);
    }, { priority: -100 });

    Stages.use('resolve:calc', function (ctx) {
      ctx.attackerHasPierce    = Engine.hasBuff(ctx.atkP, 'pierce');
      ctx.defenderHasForceField = Engine.hasBuff(ctx.defP, 'force_field');
      ctx.atkValue    = Engine.getAttackValue(ctx.atkP);
      ctx.rawDefValue = Engine.getDefenseValue(ctx.defP);
      ctx.effDefValue = ctx.attackerHasPierce ? 0 : ctx.rawDefValue;
    }, { priority: -100 });

    Stages.use('resolve:hitcheck', function (ctx) {
      let dmg = Math.max(0, ctx.atkValue - ctx.effDefValue);
      if (ctx.defenderHasForceField && !ctx.attackerHasPierce) dmg = 0;
      ctx.dmg = dmg;
      ctx.canCounter = !ctx.attackerHasPierce && ctx.rawDefValue > ctx.atkValue;
      ctx.counterDmg = ctx.canCounter ? (ctx.rawDefValue - ctx.atkValue) : 0;
    }, { priority: -100 });

    Stages.use('resolve:end', function (ctx) {
      processRoundEnd(ctx.atkP);
      processRoundEnd(ctx.defP);
    }, { priority: -100 });
  };

  function applyLeapAndHack(owner, opponent) {
    Engine.getBuffEntries(owner, 'leap').forEach(function () {
      const selected = owner.dice.filter(function (d) {
        if (!d.selected) return false;
        const b = window.DiceBehavior.get(d.kind);
        return b && b.canLeap(d);
      });
      if (selected.length === 0) return;
      let minDie = selected[0];
      selected.forEach(function (d) { if (d.value < minDie.value) minDie = d; });
      const oldValue = minDie.value;
      minDie.value = Engine.DIE_SIDES[minDie.level];
      Engine.emit('die:valueChanged', {
        g: Engine.G, side: owner.side, die: minDie,
        oldValue: oldValue, newValue: minDie.value, cause: 'leap'
      });
    });

    Engine.getBuffEntries(owner, 'hack').forEach(function () {
      const oppSelected = opponent.dice.filter(function (d) {
        if (!d.selected) return false;
        const b = window.DiceBehavior.get(d.kind);
        return b && b.canHack(d);
      });
      if (oppSelected.length === 0) return;
      let maxDie = oppSelected[0];
      oppSelected.forEach(function (d) { if (d.value > maxDie.value) maxDie = d; });
      const oldValue = maxDie.value;
      maxDie.value = 2;
      Engine.emit('die:valueChanged', {
        g: Engine.G, side: opponent.side, die: maxDie,
        oldValue: oldValue, newValue: maxDie.value, cause: 'hack'
      });
    });
  }

  function processRoundEnd(p) {
    const thorn = Engine.getBuffStacks(p, 'thorn');
    if (thorn > 0) {
      const a = Engine.applyDamage(p, thorn);
      if (a > 0) {
        Engine.showDamage(p.side, a);
        Engine.shakePortrait(p.side, a >= 10);
      }
      Engine.removeBuff(p, 'thorn');
    }

    const poison = Engine.getBuffStacks(p, 'poison');
    if (poison > 0) {
      const deadly = Engine.getBuffStacks(p, 'deadly_poison');
      const dmg = poison * Math.pow(2, deadly);
      const a = Engine.applyDamage(p, dmg);
      if (a > 0) {
        Engine.showDamage(p.side, a);
        Engine.shakePortrait(p.side, a >= 10);
      }
      Engine.decreaseStacks(p, 'poison', 1);
    }

    Engine.removeAllTempBuffs(p);
  }

  Engine.rollDiceAnimated = function (side, diceToRoll, callback) {
    const G = Engine.G;
    const p = G.sides[side];
    if (!p || !diceToRoll || diceToRoll.length === 0) {
      callback && callback();
      return;
    }

    const token = G.battleToken;
    const targetIds = {};
    diceToRoll.forEach(function (d) { targetIds[d.id] = true; });

    const rollCtx = Engine.emit('roll:before', {
      g: G, side: side, dice: diceToRoll, cancelled: false
    });
    if (rollCtx.cancelled) { callback && callback(); return; }

    diceToRoll.forEach(function (d) { Engine.rollDie(p, d); });
    Engine.render();

    Engine.emit('roll:after', { g: G, side: side, dice: diceToRoll });

    Engine.animLock = true;

    const flashTimer = setInterval(function () {
      if (token !== G.battleToken) {
        clearInterval(flashTimer);
        Engine.animLock = false;
        return;
      }
      const area = document.getElementById('dice-' + side);
      if (!area) return;
      const els = area.querySelectorAll('.die');
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const id = el.dataset.dieId;
        if (!targetIds[id]) continue;
        const d = p.dice.find(function (x) { return x.id === id; });
        if (!d) continue;
        const behavior = window.DiceBehavior.get(d.kind);
        if (behavior && typeof behavior.flashValue === 'function') {
          el.textContent = behavior.flashValue(p, d);
        }
      }
    }, Engine.FLASH_INTERVAL);

    setTimeout(function () {
      if (token !== G.battleToken) {
        clearInterval(flashTimer);
        Engine.animLock = false;
        return;
      }
      clearInterval(flashTimer);

      diceToRoll.forEach(function (d) { Engine.rollDie(p, d); });
      Engine.render();

      const area = document.getElementById('dice-' + side);
      if (area) {
        const els = area.querySelectorAll('.die');
        for (let i = 0; i < els.length; i++) {
          const el = els[i];
          const id = el.dataset.dieId;
          if (!targetIds[id]) continue;
          el.style.animation = 'none';
          void el.offsetWidth;
          el.style.animation = 'diePop .42s cubic-bezier(.2,.9,.3,1) both';
        }
      }

      setTimeout(function () {
        if (token !== G.battleToken) {
          Engine.animLock = false;
          return;
        }
        Engine.animLock = false;
        Engine.render();
        callback && callback();
      }, Engine.POP_DURATION);
    }, Engine.FLASH_DURATION);
  };

  Engine.resetToSelection = function () {
    const G = Engine.G;
    G.phase = 'selecting';
    G.round = 1;
    G.attacker = null;
    G.battleToken++;
    Engine.animLock = false;
    G.sides.top = null;
    G.sides.bottom = null;
    G.selectedChars.top = null;
    G.selectedChars.bottom = null;
    G.selectedJewels.top = null;
    G.selectedJewels.bottom = null;
    document.getElementById('result').style.display = 'none';
    Engine.closeModal();
    Engine.closePicker();
    Engine.closeJewelPicker();
    Engine.hideConfirm();
     // ★ 每局随机背景
    Engine.Background.collect();
    Engine.Background.randomize();

    Engine.render();
  };

    Engine.checkBothReady = function () {
    const G = Engine.G;
    if (G.selectedChars.top && G.selectedChars.bottom) {
      Engine.initializeBattle();
    } else {
      Engine.render();
    }
  };

  Engine.initializeBattle = function () {
    const G = Engine.G;
    if (!G.selectedChars.top || !G.selectedChars.bottom) return;
    const topChar = Engine.CHARACTERS[G.selectedChars.top];
    const bottomChar = Engine.CHARACTERS[G.selectedChars.bottom];
    if (!topChar || !bottomChar) return;

    G.phase = 'coin';
    G.round = 1;
    G.attacker = null;
    G.battleToken++;
    Engine.animLock = false;
    document.getElementById('result').style.display = 'none';

    ['top', 'bottom'].forEach(function (side) {
      const char = (side === 'top') ? topChar : bottomChar;
      if (!G.sides[side]) {
        G.sides[side] = Engine.makePlayer(char, side);
      }
      const jewelId = G.selectedJewels[side];
      if (char.jewel !== false && jewelId) {
        G.sides[side].jewelId = jewelId;
        G.sides[side].jewelUses = Engine.CONFIG.jewelUses;
        Engine.registerJewelHandlers(G.sides[side], jewelId);
      }
    });

    Engine.attachSkillHooks(G.sides.top);
    Engine.attachSkillHooks(G.sides.bottom);

    Engine.emit('battle:start', { g: G });

    Engine.render();
  };

  function computeRerolls(p) {
    const interference = Engine.getBuffStacks(p, 'interference');
    return Math.max(0, Engine.CONFIG.attackerRerolls - interference);
  }

  Engine.onCoinClick = function () {
    const G = Engine.G;
    if (Engine.animLock) return;
    if (G.phase !== 'coin') return;
    const coin = document.getElementById('coin');
    if (coin.classList.contains('flipping')) return;

    coin.classList.add('flipping');
    const token = G.battleToken;

    setTimeout(function () {
      if (token !== G.battleToken) return;
      coin.classList.remove('flipping');

      const first = Math.random() < 0.5 ? 'top' : 'bottom';
      G.attacker = first;
      G.phase = 'attack';

      const ap = G.sides[first];
      ap.rerolls = computeRerolls(ap);
      ap.dice.forEach(function (d) { d.selected = false; });

      Engine.emit('round:start', { g: G, round: G.round, attacker: first });

      Engine.rollDiceAnimated(first, ap.dice, function () {
        if (Engine.isAI(first)) Engine.aiTurn(first, G.battleToken);
      });
    }, 620);
  };

  Engine.onDieClick = function (d) {
    if (Engine.animLock) return;
    const active = Engine.getActiveSide();
    if (!active || d.side !== active) return;
    if (Engine.isAI(active)) return;
    d.selected = !d.selected;

    Engine.emit(d.selected ? 'die:selected' : 'die:deselected', {
      g: Engine.G, side: active, die: d
    });

    Engine.render();
  };

  Engine.onReroll = function () {
    if (Engine.animLock) return;
    const active = Engine.getActiveSide();
    if (!active || active !== Engine.G.attacker) return;
    const p = Engine.G.sides[active];
    if (!p || p.rerolls <= 0) return;

    const toReroll = p.dice.filter(function (d) { return d.selected; });
    if (toReroll.length === 0) return;

    const rCtx = Engine.emit('reroll:before', {
      g: Engine.G, side: active, dice: toReroll, remaining: p.rerolls, cancelled: false
    });
    if (rCtx.cancelled) return;

    toReroll.forEach(function (d) { d.selected = false; });
    p.rerolls--;
    Engine.render();

    Engine.rollDiceAnimated(active, toReroll, function () {
      Engine.emit('reroll:after', {
        g: Engine.G, side: active, dice: toReroll, remaining: p.rerolls
      });
    });
  };

  Engine.onConfirm = function () {
    const G = Engine.G;
    if (Engine.animLock) return;

    const activeSide = Engine.getActiveSide();
    if (!activeSide) return;
    const activeP = G.sides[activeSide];
    if (!activeP) return;
    const selected = activeP.dice.filter(function (d) { return d.selected; });
    const value = Engine.getValue(activeP);
    const role = (activeSide === G.attacker) ? 'attacker' : 'defender';

    const beforeCtx = Engine.emit('confirm:before', {
      g: G, side: activeSide, role: role, value: value, dice: selected, cancelled: false
    });
    if (beforeCtx.cancelled) return;

    selected.forEach(function (d) {
      const behavior = window.DiceBehavior.get(d.kind);
      if (behavior && typeof behavior.onConfirmed === 'function') {
        try {
          behavior.onConfirmed(activeP, d, { g: G, side: activeSide, role: role, dice: selected, value: value });
        } catch (e) {
          console.error('[behavior onConfirmed:' + d.kind + ']', e);
        }
      }
    });

    Engine.emit('confirm:after', {
      g: G, side: activeSide, role: role, value: value, dice: selected
    });

    if (G.phase === 'attack') {
      G.phase = 'defense';
      const defSide = G.attacker === 'top' ? 'bottom' : 'top';
      const dp = G.sides[defSide];
      dp.rerolls = Engine.CONFIG.defenderRerolls;
      dp.dice.forEach(function (d) { d.selected = false; });
      Engine.render();

      Engine.rollDiceAnimated(defSide, dp.dice, function () {
        if (Engine.isAI(defSide)) Engine.aiTurn(defSide, G.battleToken);
      });

    } else if (G.phase === 'defense') {
      G.phase = 'resolve';
      Engine.render();
      setTimeout(Engine.playCompareAnimation, Engine.COMPARE_DELAY);
    }
  };

  Engine.playCompareAnimation = function () {
    const G = Engine.G;
    const token = G.battleToken;
    const atkSide = G.attacker;
    const defSide = atkSide === 'top' ? 'bottom' : 'top';
    const atkP = G.sides[atkSide];
    const defP = G.sides[defSide];

    if (!atkP || !defP) { Engine.resolveDamage(); return; }

    const atkVal = Engine.getAttackValue(atkP);
    const defVal = Engine.getDefenseValue(defP);

    const atkNum = document.querySelector('#final-' + atkSide + ' .final-number');
    const defNum = document.querySelector('#final-' + defSide + ' .final-number');

    if (!atkNum || !defNum) { Engine.resolveDamage(); return; }

    atkNum.style.animation = 'finalShake ' + (Engine.COMPARE_SHAKE_MS / 1000) + 's ease-in-out';
    defNum.style.animation = 'finalShake ' + (Engine.COMPARE_SHAKE_MS / 1000) + 's ease-in-out';

    setTimeout(function () {
      if (token !== G.battleToken) return;
      atkNum.style.animation = '';
      defNum.style.animation = '';

      const transStr = 'transform ' + (Engine.COMPARE_SCALE_MS / 1000) + 's cubic-bezier(.2,.9,.3,1)';
      if (atkVal > defVal) {
        atkNum.style.transition = transStr;
        atkNum.style.transform = 'scale(1.2)';
        defNum.style.transition = transStr;
        defNum.style.transform = 'scale(0.8)';
      } else if (defVal > atkVal) {
        defNum.style.transition = transStr;
        defNum.style.transform = 'scale(1.2)';
        atkNum.style.transition = transStr;
        atkNum.style.transform = 'scale(0.8)';
      }

      setTimeout(function () {
        if (token !== G.battleToken) return;
        Engine.resolveDamage();
      }, Engine.COMPARE_SCALE_MS + 50);

    }, Engine.COMPARE_SHAKE_MS + 50);
  };

  Engine.resolveDamage = function () {
    const G = Engine.G;
    const atkSide = G.attacker;
    const defSide = atkSide === 'top' ? 'bottom' : 'top';
    const atkP = G.sides[atkSide];
    const defP = G.sides[defSide];

    const ctx = {
      g: G,
      atkSide: atkSide,
      defSide: defSide,
      atkP: atkP,
      defP: defP
    };

    Stages.runFromTo('resolve:start', 'resolve:hitcheck', ctx);

    const totalHits = Engine.getHitCount(atkP);
    const dmg = ctx.dmg || 0;
    const canCounter = ctx.canCounter;
    const counterDmg = ctx.counterDmg;
    const effDefValue = ctx.effDefValue;

    let hitIndex = 0;

   function updateHpText() {
      const hpA = document.getElementById('hp-' + atkSide);
      if (hpA) {
        hpA.textContent = atkP.hp + ' / ' + atkP.maxHp;
        hpA.classList.toggle('hp-negative', atkP.hp < 0);
      }
      const hpD = document.getElementById('hp-' + defSide);
      if (hpD) {
        hpD.textContent = defP.hp + ' / ' + defP.maxHp;
        hpD.classList.toggle('hp-negative', defP.hp < 0);
      }
    }

    function applyOneHit() {
      if (dmg > 0) {
        const dealtCtx = Engine.emit('damage:dealt', {
          g: G, target: defSide, attacker: atkSide,
          amount: dmg, hitIndex: hitIndex, totalHits: totalHits
        });
        const finalDmg = dealtCtx.amount;
        if (finalDmg > 0) {
          const actual = Engine.applyDamage(defP, finalDmg);
          if (actual > 0) {
            defP._tookNormalDamageThisRound = true;
            Engine.showDamage(defSide, actual);
            Engine.shakePortrait(defSide, actual >= 10);
            Engine.emit('damage:taken', { g: G, target: defSide, amount: actual });
          }
          updateHpText();

          Engine.getBuffEntries(defP, 'reflect').forEach(function (entry) {
            const pct = entry.param || 0;
            const reflectDmg = Math.floor(effDefValue * pct / 100);
            if (reflectDmg > 0) {
              const a = Engine.applyDamage(atkP, reflectDmg);
              if (a > 0) {
                Engine.showDamage(atkSide, a);
                Engine.shakePortrait(atkSide, a >= 10);
              }
            }
          });

          Engine.getBuffEntries(atkP, 'siphon').forEach(function (entry) {
            const pct = entry.param || 0;
            const heal = Math.floor(finalDmg * pct / 100);
            if (heal > 0) {
              atkP.hp = Math.min(atkP.maxHp, atkP.hp + heal);
            }
          });
          updateHpText();
        }
      } else {
        Engine.showBlock(defSide);
      }

      if (canCounter && counterDmg > 0) {
        const counterCount = Engine.getBuffEntries(defP, 'counter').length;
        for (let i = 0; i < counterCount; i++) {
          const a = Engine.applyDamage(atkP, counterDmg);
          if (a > 0) {
            Engine.showDamage(atkSide, a);
            Engine.shakePortrait(atkSide, a >= 10);
          }
        }
        updateHpText();
      }

      // 每次命中结算完成后触发（含反伤/虹吸/反击之后）
      Engine.emit('attack:hit', {
        g: G, atkP: atkP, defP: defP,
        atkSide: atkSide, defSide: defSide,
        dmg: dmg, hitIndex: hitIndex, totalHits: totalHits
      });

      hitIndex++;
    }

    function finish() {
      Engine.emit('attack:end', { g: G, atkSide: atkSide, defSide: defSide });
      Stages.run('resolve:end', ctx);
      // 力量还没清（托帕在 round:end 才清），此时 render 最终值正确
      Engine.render();

      if (defP.hp <= 0 || atkP.hp <= 0) {
        G.phase = 'gameover';
        if (defP.hp <= 0) Engine.emit('unit:died', { g: G, side: defSide, unit: defP });
        if (atkP.hp <= 0) Engine.emit('unit:died', { g: G, side: atkSide, unit: atkP });

        let winner;
        if (defP.hp <= 0 && atkP.hp <= 0) winner = 'draw';
        else if (defP.hp <= 0) winner = atkSide;
        else winner = defSide;

        Engine.emit('battle:end', { g: G, winner: winner });
        Engine.render();
        setTimeout(function () {
          let text;
          if (winner === 'draw') text = '同 归 于 尽';
          else if (winner === 'bottom') text = '你 获 胜';
          else text = '敌 方 获 胜';
          Engine.showResult(text);
        }, 900);
        return;
      }

      Engine.emit('round:end', { g: G, round: G.round, attacker: G.attacker });
      setTimeout(Engine.nextRound, Engine.POST_HIT_DELAY);
    }

    applyOneHit();

    if (totalHits > 1) {
      setTimeout(function () {
        applyOneHit();
        finish();
      }, Engine.REATTACK_GAP);
    } else {
      finish();
    }
  };

  Engine.nextRound = function () {
    const G = Engine.G;
    if (G.phase === 'gameover') return;
    G.round++;
    G.attacker = G.attacker === 'top' ? 'bottom' : 'top';
    G.phase = 'attack';

    ['top', 'bottom'].forEach(function (s) {
      const p = G.sides[s];
      p.dice.forEach(function (d) { d.selected = false; d.value = 0; });
      p.rerolls = 0;
      p._jewelUsedThisRound = false;
      p._tookNormalDamageThisRound = false;

      // 耀彩骰在新回合开始前移除
      p.dice = p.dice.filter(function (d) { return d.kind !== 'jewel'; });
    });

    const ap = G.sides[G.attacker];
    ap.rerolls = computeRerolls(ap);

    Engine.emit('round:start', { g: G, round: G.round, attacker: G.attacker });

    Engine.rollDiceAnimated(G.attacker, ap.dice, function () {
      if (Engine.isAI(G.attacker)) Engine.aiTurn(G.attacker, G.battleToken);
    });
  };

})();