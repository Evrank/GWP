window.JewelRegistry.register('starshield', {
  name: '真·星盾',
  desc: '仅限防御时可用。',
  when: 'defense',
  unlock: null,

  aiHint: {
    // 对手有洞穿 → 不用
    // 自己当前能凑出完全防御 → 不用
    // 否则用
    wantsUse: function (player, ctx) {
      if (ctx.isAttacker) return false;

      const opponent = Engine.G.sides[player.side === 'top' ? 'bottom' : 'top'];
      if (!opponent) return false;

      // 对手有洞穿 → 力场无效 → 不用
      if (Engine.hasBuff(opponent, 'pierce')) return false;

      // 对手最终攻击值
      const atkValue = Engine.getAttackValue(opponent);

      // 自己当前能凑出的最高防御值（普通骰选 required 颗最高值 + 韧性 buff）
      const required = player.char.def;
      const normalDice = player.dice.filter(function (d) { return d.kind === 'normal'; });
      const sorted = normalDice.slice().sort(function (a, b) { return b.value - a.value; });
      let maxDef = 0;
      const n = Math.min(required, sorted.length);
      for (let i = 0; i < n; i++) maxDef += sorted[i].value;

      Engine.forEachBuff(player, function (def, entry) {
        if (typeof def.defenseBonus === 'function') {
          maxDef += def.defenseBonus(player, entry) || 0;
        }
      });

      // 能完全防御 → 不用
      if (maxDef >= atkValue) return false;

      return true;
    },
    // 力场面加分（优先级高于 7 点面）
    scoreDie: function (die, player, allDice, ctx) {
      if (die.face && die.face.label === '力场1') return 20;
      return 0;
    },
    // 权重 < 20 就重投
    wantsReroll: function (die, player, allDice, ctx) {
      return Engine.jewelWeight(die, player, allDice, ctx) < 20;
    }
  },

  faces: [
    { value: 7, desc: '获得 7 点数' },
    { value: 7, desc: '获得 7 点数' },
    { value: 7, desc: '获得 7 点数' },
    { value: 1, label: '力场1', desc: '获得 1 点数，本回合获得【力场】', onConfirm: function (ctx, owner) {
      Engine.addBuff(owner, 'force_field');
    }},
    { value: 1, label: '力场1', desc: '获得 1 点数，本回合获得【力场】', onConfirm: function (ctx, owner) {
      Engine.addBuff(owner, 'force_field');
    }},
    { value: 1, label: '力场1', desc: '获得 1 点数，本回合获得【力场】', onConfirm: function (ctx, owner) {
      Engine.addBuff(owner, 'force_field');
    }}
  ]
});