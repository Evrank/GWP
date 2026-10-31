window.BuffRegistry.register('tenacity', {
  name: '韧性',
  short: '韧',
  color: '#7fd2ff',
  borderColor: '#1a4a6a',
  mergeable: true,
  desc: function (e) {
    return '每层使防御值 +1。当前 ' + e.stacks + ' 层。';
  },
  defenseBonus: function (p, e) { return e.stacks; }
});