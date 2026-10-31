window.BuffRegistry.register('unyielding', {
  name: '不屈',
  short: '屈',
  color: '#ffb870',
  borderColor: '#7a4a20',
  mergeable: false,
  temp: true,
  desc: function () {
    return '本回合自己的生命值不会低于 1。回合结束时移除。';
  }
});