window.BuffRegistry.register('backwater', {
  name: '背水',
  short: '背',
  color: '#ff5050',
  borderColor: '#8a0000',
  mergeable: false,
  temp: true,
  desc: function (e) {
    return '本回合攻击值 +' + (e.stacks || 0) + '。回合结束时移除。';
  },
  onApplied: function (p, e) {
    const lost = Math.max(0, p.hp - 1);
    p.hp = Math.max(1, p.hp);
    e.stacks = lost;
  },
  attackBonus: function (p, e) { return e.stacks || 0; }
});