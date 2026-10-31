window.BuffRegistry.register('combo', {
  name: '连击',
  short: '连击',
  color: '#ff9a9a',
  borderColor: '#7a2020',
  mergeable: false,
  temp: true,
  desc: function () {
    return '本次攻击结算 2 次。回合结束时移除。';
  },
  hitCount: function () { return 2; }
});