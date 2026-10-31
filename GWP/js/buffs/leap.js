window.BuffRegistry.register('leap', {
  name: '跃升',
  short: '跃',
  color: '#c0a0ff',
  borderColor: '#5a3a9a',
  mergeable: false,
  temp: true,
  desc: function () {
    return '即将进行伤害结算时，将自己选定的骰子中点数最小的一个点数变为该骰子的最大值。可复数存在。回合结束时移除。';
  }
});