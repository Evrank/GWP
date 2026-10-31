window.BuffRegistry.register('poison', {
  name: '中毒',
  short: '毒',
  color: '#80a050',
  borderColor: '#3a5a10',
  mergeable: true,
  desc: function (e) {
    return '回合结束时，受到等同于层数的伤害（受【猛毒】倍数影响），随后层数 -1。当前 ' + e.stacks + ' 层。';
  }
});