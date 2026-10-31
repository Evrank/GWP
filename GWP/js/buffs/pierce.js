window.BuffRegistry.register('pierce', {
  name: '洞穿',
  short: '穿',
  color: '#ff7070',
  borderColor: '#8a1010',
  mergeable: false,
  temp: true,
  desc: function () {
    return '本回合进行攻击结算时，无视对手的防御值与【力场】。回合结束时移除。';
  }
});