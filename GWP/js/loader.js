(function () {
  'use strict';

  const _packs = {};
  const _characters = {};
  const _skills = {};

  const PackRegistry = {
    register: function (pack) {
      if (!pack || !pack.id) {
        console.warn('[PackRegistry] 缺少 id，忽略:', pack);
        return;
      }
      _packs[pack.id] = pack;
    },
    get: function (id) { return _packs[id]; },
    all: function () { return _packs; }
  };

  const CharacterRegistry = {
    register: function (id, data) {
      if (!id) { console.warn('[CharacterRegistry] 缺少 id'); return; }
      _characters[id] = data;
    },
    get: function (id) { return _characters[id]; },
    has: function (id) { return !!_characters[id]; },
    all: function () { return _characters; }
  };

  const SkillRegistry = {
    register: function (id, def) {
      if (!id) { console.warn('[SkillRegistry] 缺少 id'); return; }
      _skills[id] = def;
    },
    get: function (id) { return _skills[id]; },
    all: function () { return _skills; }
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('脚本加载失败: ' + src)); };
      document.head.appendChild(s);
    });
  }

  function loadSeq(list) {
    return list.reduce(function (p, src) {
      return p.then(function () { return loadScript(src); });
    }, Promise.resolve());
  }

  function loadAllPacks() {
    const phase0 = loadSeq((window.GLOBAL_BUFFS || []).slice());

    const phase1 = function () {
      return loadSeq((window.PACKS || []).slice());
    };

    const phase2 = function () {
      const extra = [];
      Object.keys(_packs).forEach(function (id) {
        const pack = _packs[id];
        (pack.files || []).forEach(function (src) { extra.push(src); });
      });
      return loadSeq(extra);
    };

    return phase0.then(phase1).then(phase2);
  }

  window.PackRegistry = PackRegistry;
  window.CharacterRegistry = CharacterRegistry;
  window.SkillRegistry = SkillRegistry;
  window.PackLoader = {
    loadAllPacks: loadAllPacks,
    loadScript: loadScript
  };

})();