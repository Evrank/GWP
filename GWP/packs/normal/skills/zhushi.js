window.SkillRegistry.register('zhushi', {
  name: '猪市',
  desc: '攻击时：选定的骰子每有 1 个最大值，获得 2 层【力量】。若攻击值 ≥ 20，获得【连击】，回合结束时清除自己的【力量】。',

  previewAttackBonus: function (player) {
    let gain = 0;
    player.dice.forEach(function (d) {
      if (d.selected && Engine.isMaxValue(d)) gain += 2;
    });
    return gain;
  },

  getDiceMark: function (die) {
    if (Engine.isMaxValue(die)) return '※';
    return null;
  },
  aiHint: {
        // 优先选最大值骰子（叠力量）
    scoreDie: function (die, player, allDice, ctx) {
      if (!ctx.isAttacker) return 0;
      if (Engine.isMaxValue(die)) return 50;
      return 0;
    }
  },

  events: {
    // 确认瞬间：叠力量 + 判定连击
    'confirm:after': function (ctx, owner) {
      if (ctx.side !== owner.side) return;
      if (ctx.role !== 'attacker') return;

      let maxCount = 0;
      ctx.dice.forEach(function (d) {
        if (Engine.isMaxValue(d)) maxCount++;
      });

      if (maxCount > 0) {
        Engine.addBuff(owner, 'strength', { stacks: maxCount * 2 });
      }

      const totalAtk = ctx.value + Engine.getBuffStacks(owner, 'strength');
      if (totalAtk >= 20) {
        Engine.addBuff(owner, 'combo');
        owner._clearStrengthAfterAttack = true;
      }
    },

    // 回合结束清力量（触发过连击时）
    'round:end': function (ctx, owner) {
      if (owner._clearStrengthAfterAttack) {
        Engine.removeBuff(owner, 'strength');
        owner._clearStrengthAfterAttack = false;
      }
    }
  }
});