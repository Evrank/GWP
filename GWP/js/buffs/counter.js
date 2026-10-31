window.BuffRegistry.register('counter', {
  name: '反击',
  short: '反击',
  color: '#ffb870',
  borderColor: '#7a4a20',
  mergeable: false,
  temp: true,
  desc: function () {
    return '本回合进行伤害结算时，如果自己的防御值＞对手的攻击值，则根据差值对对手造成伤害。可复数存在，每次伤害结算各触发 1 次。回合结束时移除。';
  }
});