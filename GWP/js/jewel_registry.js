(function () {
  'use strict';
  const _jewels = {};
  window.JewelRegistry = {
    register: function (id, def) {
      if (!id) { console.warn('[JewelRegistry] 缺少 id'); return; }
      _jewels[id] = Object.assign({ id: id }, def);
    },
    get: function (id) { return _jewels[id]; },
    has: function (id) { return !!_jewels[id]; },
    all: function () { return _jewels; }
  };
})();