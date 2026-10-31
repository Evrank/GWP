window.BuffRegistry.register('lucky', {
  name: '幸运',
  short: '运',
  color: '#ffd970',
  borderColor: '#c9a227',
  mergeable: false,
  desc: function () {
    return '所有骰子固定投掷出最大值。';
  }
});