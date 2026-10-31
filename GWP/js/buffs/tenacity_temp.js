window.BuffRegistry.register('tenacity_temp', {
  name: '韧性（临时）',
  short: '韧',
  color: '#8fd8ff',
  borderColor: '#2a5a7a',
  mergeable: true,
  temp: true,
  desc: function (e) {
    return '每层使防御值 +1。回合结束时移除。当前 ' + e.stacks + ' 层。';
  },
  defenseBonus: function (p, e) { return e.stacks; }
});