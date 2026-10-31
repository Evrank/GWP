window.BuffRegistry.register('deadly_poison', {
  name: '猛毒',
  short: '猛毒',
  color: '#a0ff50',
  borderColor: '#3a5a00',
  mergeable: true,
  desc: function (e) {
    return '每层使【中毒】伤害 ×2（最多 2 层）。当前 ' + e.stacks + ' 层。';
  }
});