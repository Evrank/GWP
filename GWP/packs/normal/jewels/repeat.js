window.JewelRegistry.register('repeat', {
  name: '真·复读',
  desc: '本场战斗中累计选定 2 颗 4 点骰子后解锁。仅限攻击时可用。',
  when: 'attack',
  unlock: {
    events: ['confirm:after'],
    onEvent: function (ctx, owner, jewel) {
      if (ctx.side !== owner.side) return;
      let count = 0;
      ctx.dice.forEach(function (d) { if (d.value === 4) count++; });
      if (count > 0) {
        if (!owner._jewelCounters) owner._jewelCounters = {};
        owner._jewelCounters.repeat4 = (owner._jewelCounters.repeat4 || 0) + count;
      }
    },
    check: function (owner, jewel) {
      if (!owner._jewelCounters) return false;
      return (owner._jewelCounters.repeat4 || 0) >= 2;
    }
  },

  aiHint: {
    // 连击面 +20 权重
    scoreDie: function (die, player, allDice, ctx) {
      if (die.face && die.face.label === '连击4') return 20;
      return 0;
    },
    // 权重 < 23 就重投（只有连击面 24 分值得留）
    wantsReroll: function (die, player, allDice, ctx) {
      return Engine.jewelWeight(die, player, allDice, ctx) < 23;
    }
  },

  faces: [
    { value: 1, desc: '获得 1 点数' },
    { value: 1, desc: '获得 1 点数' },
    { value: 4, desc: '获得 4 点数' },
    { value: 4, desc: '获得 4 点数' },
    { value: 4, label: '连击4', desc: '获得 4 点数，本回合获得【连击】', onConfirm: function (ctx, owner) {
      Engine.addBuff(owner, 'combo');
    }},
    { value: 4, label: '连击4', desc: '获得 4 点数，本回合获得【连击】', onConfirm: function (ctx, owner) {
      Engine.addBuff(owner, 'combo');
    }}
  ]
});