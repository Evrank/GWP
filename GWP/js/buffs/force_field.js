window.BuffRegistry.register('force_field', {
  name: '力场',
  short: '场',
  color: '#7fd2ff',
  borderColor: '#1a4a6a',
  mergeable: false,
  temp: true,
  desc: function () {
    return '本回合对手的攻击对自己造成的伤害固定为 0。回合结束时移除。';
  }
});