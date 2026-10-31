// ============================================
// 结算流程阶段定义
// 顺序固定，按 defineOrder 的顺序执行
// ============================================

Stages.defineOrder([
  'resolve:start',
  'resolve:overload',
  'resolve:leap_hack',
  'resolve:calc',
  'resolve:postCalc',
  'resolve:hitcheck',
  'resolve:end'
]);

Stages.define('resolve:start');
Stages.define('resolve:overload');
Stages.define('resolve:leap_hack');
Stages.define('resolve:calc');
Stages.define('resolve:postCalc');
Stages.define('resolve:hitcheck');
Stages.define('resolve:end');