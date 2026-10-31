(function () {
  'use strict';
  window.Engine = window.Engine || {};

  // 耀彩骰综合权重 = base + aiHint.scoreDie 加分
  Engine.jewelWeight = function (die, player, allDice, ctx) {
    let score = die.value || 0;
    const jewel = window.JewelRegistry && window.JewelRegistry.get(die.jewelId);
    if (jewel && jewel.aiHint && typeof jewel.aiHint.scoreDie === 'function') {
      try {
        score += jewel.aiHint.scoreDie(die, player, allDice, ctx) || 0;
      } catch (e) {
        console.error('[jewel aiHint.scoreDie:' + die.jewelId + ']', e);
      }
    }
    return score;
  };

  // 每颗骰子的综合分数（技能 aiHint + 耀彩骰 aiHint）
  Engine.aiComputeScores = function (p, required) {
    const allDice = p.dice;
    const ctx = {
      requiredCount: required,
      isAttacker: (p.side === Engine.G.attacker)
    };
    return allDice.map(function (die) {
      let score = die.value || 0;

      // 技能 aiHint
      (p.char.skills || []).forEach(function (sid) {
        const skill = window.SkillRegistry && window.SkillRegistry.get(sid);
        if (skill && skill.aiHint && typeof skill.aiHint.scoreDie === 'function') {
          try {
            score += skill.aiHint.scoreDie(die, p, allDice, ctx) || 0;
          } catch (e) {
            console.error('[aiHint:' + sid + ']', e);
          }
        }
      });

      // 耀彩骰 aiHint
      if (die.kind === 'jewel') {
        const jewel = window.JewelRegistry && window.JewelRegistry.get(die.jewelId);
        if (jewel && jewel.aiHint && typeof jewel.aiHint.scoreDie === 'function') {
          try {
            score += jewel.aiHint.scoreDie(die, p, allDice, ctx) || 0;
          } catch (e) {
            console.error('[jewel aiHint:' + die.jewelId + ']', e);
          }
        }
      }

      return score;
    });
  };

  // 判断是否使用耀彩骰
  Engine.aiShouldUseJewel = function (p) {
    if (!Engine.canUseJewel(p).ok) return false;
    const jewel = window.JewelRegistry && window.JewelRegistry.get(p.jewelId);
    if (!jewel) return false;

    // 没写 wantsUse → 默认用
    if (!jewel.aiHint || typeof jewel.aiHint.wantsUse !== 'function') return true;

    try {
      return !!jewel.aiHint.wantsUse(p, {
        phase: Engine.G.phase,
        isAttacker: (p.side === Engine.G.attacker),
        rerollsLeft: p.rerolls
      });
    } catch (e) {
      console.error('[jewel aiHint.wantsUse:' + p.jewelId + ']', e);
      return true;
    }
  };

  // 判断某颗骰子是否应该重投
  Engine.aiShouldReroll = function (die, p, allDice, ctx) {
    if (die.kind === 'jewel') {
      const jewel = window.JewelRegistry && window.JewelRegistry.get(die.jewelId);
      if (jewel && jewel.aiHint && typeof jewel.aiHint.wantsReroll === 'function') {
        try {
          return !!jewel.aiHint.wantsReroll(die, p, allDice, ctx);
        } catch (e) {
          console.error('[jewel aiHint.wantsReroll:' + die.jewelId + ']', e);
          return false;
        }
      }
      // 默认：按面值一半判定
      const behavior = window.DiceBehavior.get(die.kind);
      if (!behavior || typeof behavior.getFaceValues !== 'function') return false;
      const faces = behavior.getFaceValues(die);
      if (faces.length === 0) return false;
      const maxFace = Math.max.apply(null, faces);
      const threshold = Math.floor(maxFace * Engine.CONFIG.aiGarbageRatio);
      return die.value <= threshold;
    }

    // 普通骰
    const behavior = window.DiceBehavior.get(die.kind);
    if (!behavior || !behavior.isGarbageCandidate) return false;
    const threshold = Math.floor(Engine.DIE_SIDES[die.level] * Engine.CONFIG.aiGarbageRatio);
    return die.value <= threshold;
  };

  // 选出需要重投的骰子（普通骰 + 耀彩骰合并）
  Engine.aiSelectReroll = function (p) {
    p.dice.forEach(function (d) { d.selected = false; });
    const required = (p.side === Engine.G.attacker) ? p.char.atk : p.char.def;
    const ctx = {
      requiredCount: required,
      isAttacker: (p.side === Engine.G.attacker)
    };
    let any = false;
    p.dice.forEach(function (d) {
      if (Engine.aiShouldReroll(d, p, p.dice, ctx)) {
        d.selected = true;
        any = true;
      }
    });
    return any;
  };

  Engine.aiPickBest = function (p, required) {
    p.dice.forEach(function (d) { d.selected = false; });
    const scores = Engine.aiComputeScores(p, required);
    const indexed = p.dice.map(function (d, i) { return { die: d, score: scores[i] }; });
    indexed.sort(function (a, b) { return b.score - a.score; });
    const n = Math.min(required, p.dice.length);
    for (let i = 0; i < n; i++) indexed[i].die.selected = true;
  };

  Engine.aiTurn = function (side, token) {
    const G = Engine.G;
    if (token !== G.battleToken) return;
    if (Engine.animLock) return;
    if (G.phase !== 'attack' && G.phase !== 'defense') return;
    if (Engine.getActiveSide() !== side) return;

    const p = G.sides[side];
    if (!p) return;

    const isAttacker = (side === G.attacker);

    // 1. 判断是否使用耀彩骰（普通骰子已投完）
    if (Engine.aiShouldUseJewel(p)) {
      Engine.useJewel(p);
      setTimeout(function () {
        if (token !== G.battleToken) return;
        Engine.aiTurn(side, token);
      }, 1000);
      return;
    }

    // 2. 重投（合并普通骰 + 耀彩骰）
    if (p.rerolls > 0) {
      if (Engine.aiSelectReroll(p)) {
        Engine.render();
        setTimeout(function () {
          if (token !== G.battleToken) return;
          if (Engine.animLock) return;

          const toReroll = p.dice.filter(function (d) { return d.selected; });
          if (toReroll.length === 0) { Engine.aiTurn(side, token); return; }

          const rCtx = Engine.emit('reroll:before', {
            g: G, side: side, dice: toReroll, remaining: p.rerolls, cancelled: false
          });
          if (rCtx.cancelled) { Engine.aiTurn(side, token); return; }

          toReroll.forEach(function (d) { d.selected = false; });
          p.rerolls--;
          Engine.render();

          Engine.rollDiceAnimated(side, toReroll, function () {
            if (token !== G.battleToken) return;
            Engine.emit('reroll:after', {
              g: G, side: side, dice: toReroll, remaining: p.rerolls
            });
            Engine.aiTurn(side, token);
          });
        }, Engine.randDelay());
        return;
      }
    }

    // 3. 选骰 + 确定
    Engine.aiPickBest(p, isAttacker ? p.char.atk : p.char.def);
    Engine.render();

    setTimeout(function () {
      if (token !== G.battleToken) return;
      if (Engine.animLock) return;
      Engine.onConfirm();
    }, Engine.randDelay());
  };

  // 兼容旧接口
  Engine.aiSelectGarbage = function (p) {
    return Engine.aiSelectReroll(p);
  };

})();