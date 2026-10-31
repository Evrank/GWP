window.BuffRegistry.register('interference', {
  name: '干扰',
  short: '扰',
  color: '#a0a0a0',
  borderColor: '#505050',
  mergeable: true,
  desc: function (e) {
    return '每层使自己的重投次数 -1（最低 0）。当前 ' + e.stacks + ' 层。';
  }
});