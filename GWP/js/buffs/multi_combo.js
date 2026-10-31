window.BuffRegistry.register('multi_combo', {
  name: '迭击',
  short: '迭击',
  color: '#ff7070',
  borderColor: '#8a1010',
  mergeable: false,
  temp: true,
  desc: function () {
    return '本次攻击结算 3 次。覆盖【连击】。回合结束时移除。';
  },
  hitCount: function () { return 3; },
  onApplied: function (p) {
    Engine.removeBuff(p, 'combo');
  }
});