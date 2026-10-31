(function () {
  'use strict';

  const _buffs = {};

  window.BuffRegistry = {
    register: function (id, def) {
      if (!id) { console.warn('[BuffRegistry] 缺少 id'); return; }
      _buffs[id] = Object.assign({ id: id }, def);
    },
    get: function (id) { return _buffs[id]; },
    has: function (id) { return !!_buffs[id]; },
    all: function () { return _buffs; }
  };

})();