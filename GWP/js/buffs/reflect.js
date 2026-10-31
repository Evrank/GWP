window.BuffRegistry.register('reflect', {
  name: '反伤',
  short: '反伤',
  color: '#ff8080',
  borderColor: '#8a2020',
  mergeable: false,
  temp: true,
  desc: function (e) {
    return '本回合受到伤害后，对对手造成自己防御值 ' + (e.param || 0) + '% 的伤害。可复数存在，每次伤害结算各触发 1 次。回合结束时移除。';
  }
});