(function () {
  'use strict';

  const _events = {};
  let _listenerId = 0;

  function define(name, opts) {
    if (_events[name]) {
      console.warn('[events] 重复定义事件:', name);
      return;
    }
    _events[name] = {
      mutable: !!(opts && opts.mutable),
      cancellable: !!(opts && opts.cancellable),
      listeners: []
    };
  }

  function ensure(name) {
    if (!_events[name]) {
      throw new Error('[events] 未定义的事件: ' + name + '（请在 event_defs.js 里先 define）');
    }
    return _events[name];
  }

  function on(name, fn, opts) {
    const ev = ensure(name);
    const listener = {
      id: ++_listenerId,
      fn: fn,
      priority: (opts && opts.priority) || 0,
      scope: (opts && opts.scope) || null
    };
    ev.listeners.push(listener);
    ev.listeners.sort(function (a, b) { return a.priority - b.priority; });
    return listener.id;
  }

  function onUnit(unit, name, fn, opts) {
    const o = Object.assign({}, opts || {}, { scope: unit });
    return on(name, fn, o);
  }

  function off(name, id) {
    const ev = ensure(name);
    ev.listeners = ev.listeners.filter(function (l) { return l.id !== id; });
  }

  function offUnit(unit) {
    Object.keys(_events).forEach(function (name) {
      _events[name].listeners = _events[name].listeners.filter(function (l) {
        return l.scope !== unit;
      });
    });
  }

  function emit(name, ctx) {
    const ev = ensure(name);
    ctx = ctx || {};
    for (let i = 0; i < ev.listeners.length; i++) {
      const l = ev.listeners[i];
      try {
        l.fn(ctx);
      } catch (e) {
        console.error('[event:' + name + ']', e);
      }
      if (ev.cancellable && ctx.cancelled) return ctx;
    }
    return ctx;
  }

  function inspect() {
    const out = {};
    Object.keys(_events).forEach(function (name) {
      out[name] = {
        mutable: _events[name].mutable,
        cancellable: _events[name].cancellable,
        listeners: _events[name].listeners.length
      };
    });
    return out;
  }

  window.Events = {
    define: define,
    emit: emit,
    on: on,
    onUnit: onUnit,
    off: off,
    offUnit: offUnit,
    inspect: inspect
  };

})();