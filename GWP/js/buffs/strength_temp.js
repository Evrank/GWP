window.BuffRegistry.register('strength_temp', {
  name: '力量（临时）',
  short: '力',
  color: '#ffb870',
  borderColor: '#7a4a20',
  mergeable: true,
  temp: true,
  desc: function (e) {
    return '每层使攻击值 +1。回合结束时移除。当前 ' + e.stacks + ' 层。';
  },
  attackBonus: function (p, e) { return e.stacks; }
});