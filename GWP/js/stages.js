(function () {
  'use strict';

  const _stages = {};
  let _order = [];
  let _listenerId = 0;

  function defineOrder(order) {
    _order = order.slice();
  }

  function define(name) {
    if (_stages[name]) {
      console.warn('[stages] 重复定义阶段:', name);
      return;
    }
    _stages[name] = { listeners: [] };
  }

  function ensure(name) {
    if (!_stages[name]) {
      throw new Error('[stages] 未定义的阶段: ' + name + '（请在 stage_defs.js 里先 define）');
    }
    return _stages[name];
  }

  function use(stageName, fn, opts) {
    const st = ensure(stageName);
    const listener = {
      id: ++_listenerId,
      fn: fn,
      priority: (opts && opts.priority) || 0,
      scope: (opts && opts.scope) || null
    };
    st.listeners.push(listener);
    st.listeners.sort(function (a, b) { return a.priority - b.priority; });
    return listener.id;
  }

  function off(stageName, id) {
    const st = ensure(stageName);
    st.listeners = st.listeners.filter(function (l) { return l.id !== id; });
  }

  function offUnit(unit) {
    Object.keys(_stages).forEach(function (name) {
      _stages[name].listeners = _stages[name].listeners.filter(function (l) {
        return l.scope !== unit;
      });
    });
  }

  function runOne(name, ctx) {
    const st = ensure(name);
    for (let i = 0; i < st.listeners.length; i++) {
      const l = st.listeners[i];
      try {
        l.fn(ctx);
      } catch (e) {
        console.error('[stage:' + name + ']', e);
      }
    }
  }

  function runFrom(startName, ctx) {
    const idx = _order.indexOf(startName);
    if (idx < 0) throw new Error('[stages] 未知阶段: ' + startName);
    for (let i = idx; i < _order.length; i++) {
      runOne(_order[i], ctx);
    }
    return ctx;
  }

  function runFromTo(startName, endName, ctx) {
    const startIdx = _order.indexOf(startName);
    const endIdx   = _order.indexOf(endName);
    if (startIdx < 0) throw new Error('[stages] 未知起点阶段: ' + startName);
    if (endIdx < 0)   throw new Error('[stages] 未知终点阶段: ' + endName);
    for (let i = startIdx; i <= endIdx; i++) {
      runOne(_order[i], ctx);
    }
    return ctx;
  }

  window.Stages = {
    defineOrder: defineOrder,
    define: define,
    use: use,
    off: off,
    offUnit: offUnit,
    run: runOne,
    runFrom: runFrom,
    runFromTo: runFromTo,
    getOrder: function () { return _order.slice(); }
  };

})();