window.BuffRegistry.register('hack', {
  name: '骇入',
  short: '骇',
  color: '#a080ff',
  borderColor: '#4a2a8a',
  mergeable: false,
  temp: true,
  desc: function () {
    return '即将进行伤害结算时，使对手选定骰子中点数最大的骰子点数变为 2。可复数存在。回合结束时移除。';
  }
});