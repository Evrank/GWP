window.BuffRegistry.register('siphon', {
  name: '虹吸',
  short: '虹吸',
  color: '#80ffb0',
  borderColor: '#208a50',
  mergeable: false,
  temp: true,
  desc: function (e) {
    return '本回合造成伤害后，治愈自己伤害量 ' + (e.param || 0) + '% 的生命。可复数存在，每次伤害结算各触发 1 次。回合结束时移除。';
  }
});