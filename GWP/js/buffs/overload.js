window.BuffRegistry.register('overload', {
  name: '过载',
  short: '载',
  color: '#ff8080',
  borderColor: '#8a0000',
  mergeable: true,
  desc: function (e) {
    return '伤害结算阶段开始时：作为进攻方，每层使攻击值 +1；作为防守方，受到层数 50% 的伤害（向下取整）。当前 ' + e.stacks + ' 层。';
  },
  attackBonus: function (p, e) { return e.stacks; }
});