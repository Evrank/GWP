window.BuffRegistry.register('thorn', {
  name: '荆棘',
  short: '荆',
  color: '#a08050',
  borderColor: '#5a3a10',
  mergeable: true,
  desc: function (e) {
    return '回合结束时，受到等同于层数的伤害，并移除本效果。当前 ' + e.stacks + ' 层。';
  }
});