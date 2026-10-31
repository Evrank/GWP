window.SkillRegistry.register('feijian', {
  name: '呼剑如影',
  desc: '攻击时：若选定的骰子点数全相同，获得 7 层【力量】，每次伤害结算后造成 3 点瞬伤；若对方生命值小于自己的【力量】层数，改为造成等同于自己【力量】的瞬伤。防御时：回合结束时，若本回合内受到过普通伤害，减少一半的【力量】（向下取整）。',

  enableDiceColorMark: true,
  previewAttackBonus: function (player) {
    const selected = player.dice.filter(function (d) { return d.selected; });
    if (selected.length < 2) return 0;
    const firstValue = selected[0].value;
    const allSame = selected.every(function (d) { return d.value === firstValue; });
    if (!allSame) return 0;
    return 7;
  },

  aiHint: {
    // 优先选能凑成"全相同"的点数
    // 出现次数 ≥ 需求数 → 极高优先级
    // 否则按出现次数加权
    scoreDie: function (die, player, allDice, ctx) {
      if (!ctx.isAttacker) return 0;
      const required = ctx.requiredCount;
      let count = 0;
      allDice.forEach(function (d) {
        if (d.value === die.value) count++;
      });
      if (count >= required) return 100;
      return count * 5;
    }
  },

  events: {
    // 攻击确定时：判定全相同 → +7 力量
    'confirm:after': function (ctx, owner) {
      if (ctx.side !== owner.side) return;
      if (ctx.role !== 'attacker') return;
      if (ctx.dice.length < 2) return;

      const firstValue = ctx.dice[0].value;
      const allSame = ctx.dice.every(function (d) { return d.value === firstValue; });
      if (!allSame) return;

      Engine.addBuff(owner, 'strength', { stacks: 7 });
      owner._allSameTriggered = true;
    },

    // 每次命中结算后：造成瞬伤
    'attack:hit': function (ctx, owner) {
      if (ctx.atkP !== owner) return;
      if (!owner._allSameTriggered) return;

      const strength = Engine.getBuffStacks(owner, 'strength');
      const targetHp = ctx.defP.hp;
      const dmg = targetHp < strength ? strength : 3;

      Engine.applyInstantDamage(ctx.defP, dmg, owner);
    },

    // 攻击结束时：重置本回合触发标记
    'attack:end': function (ctx, owner) {
      if (ctx.atkSide !== owner.side) return;
      owner._allSameTriggered = false;
    },

    // 回合结束时：若受到过普通伤害，力量减半
    'round:end': function (ctx, owner) {
      if (owner._tookNormalDamageThisRound) {
        const strength = Engine.getBuffStacks(owner, 'strength');
        const half = Math.floor(strength / 2);
        Engine.removeBuff(owner, 'strength');
        if (half > 0) Engine.addBuff(owner, 'strength', { stacks: half });
      }
    }
  }
});