window.JewelRegistry.register('heartbeat', {
  name: '真·心跳',
  desc: '无使用条件与限制。',
  when: null,
  unlock: null,

  aiHint: {
    // 有重投次数才用（否则抽到 1 点也换不掉）
    wantsUse: function (player, ctx) {
      return ctx.rerollsLeft > 0;
    },
    // 权重 < 9 就重投（只有 9 点面值得留）
    wantsReroll: function (die, player, allDice, ctx) {
      return Engine.jewelWeight(die, player, allDice, ctx) < 9;
    }
  },

  faces: [
    { value: 1, desc: '获得 1 点数' },
    { value: 1, desc: '获得 1 点数' },
    { value: 1, desc: '获得 1 点数' },
    { value: 1, desc: '获得 1 点数' },
    { value: 9, label: '耀彩9', desc: '获得 9 点数，并获得 1 次耀彩骰使用次数', onConfirm: function (ctx, owner) {
      owner.jewelUses += 1;
    }},
    { value: 9, label: '耀彩9', desc: '获得 9 点数，并获得 1 次耀彩骰使用次数', onConfirm: function (ctx, owner) {
      owner.jewelUses += 1;
    }}
  ]
});