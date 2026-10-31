// ============================================
// 所有事件的显式声明
// mutable:    允许监听器修改 ctx 字段
// cancellable: 允许监听器设置 ctx.cancelled 中断后续流程
// ============================================

// 战斗级
Events.define('battle:start',  { mutable: false, cancellable: false });
Events.define('battle:end',    { mutable: false, cancellable: false });
Events.define('round:start',   { mutable: false, cancellable: false });
Events.define('round:end',     { mutable: false, cancellable: false });

// 投骰级
Events.define('roll:before',   { mutable: true,  cancellable: true  });
Events.define('roll:after',    { mutable: false, cancellable: false });

// 重投级
Events.define('reroll:before', { mutable: false, cancellable: true  });
Events.define('reroll:after',  { mutable: false, cancellable: false });

// 选骰级
Events.define('die:selected',      { mutable: false, cancellable: false });
Events.define('die:deselected',    { mutable: false, cancellable: false });
Events.define('die:valueChanged',  { mutable: false, cancellable: false });

// 确认级
Events.define('confirm:before', { mutable: false, cancellable: true  });
Events.define('confirm:after',  { mutable: false, cancellable: false });

// 结算级（循环内触发）
Events.define('damage:dealt',  { mutable: true,  cancellable: false });
Events.define('damage:taken',  { mutable: false, cancellable: false });
Events.define('hp:changed',    { mutable: false, cancellable: false });
Events.define('attack:end',    { mutable: false, cancellable: false });
Events.define('attack:hit',    { mutable: false, cancellable: false });
Events.define('unit:died',     { mutable: false, cancellable: false });

// Buff 级
Events.define('buff:added',    { mutable: false, cancellable: false });
Events.define('buff:removed',  { mutable: false, cancellable: false });