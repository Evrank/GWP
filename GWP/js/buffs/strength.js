window.BuffRegistry.register('strength', {
  name: '力量',
  short: '力',
  color: '#ffd970',
  borderColor: '#5a4a20',
  mergeable: true,
  desc: function (e) {
    return '每层使攻击值 +1。当前 ' + e.stacks + ' 层。';
  },
  attackBonus: function (p, e) { return e.stacks; }
});