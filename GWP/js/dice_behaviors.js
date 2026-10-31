(function () {
  'use strict';

  const _behaviors = {};

  window.DiceBehavior = {
    register: function (kind, def) {
      if (!kind) { console.warn('[DiceBehavior] 缺少 kind'); return; }
      _behaviors[kind] = Object.assign({ kind: kind }, def);
    },
    get: function (kind) {
      return _behaviors[kind] || _behaviors.normal;
    },
    has: function (kind) {
      return !!_behaviors[kind];
    },
    all: function () { return _behaviors; }
  };

  // ============================================
  // 普通骰
  // ============================================
  DiceBehavior.register('normal', {
    isGarbageCandidate: true,

    getFaceValues: function (d) {
      const sides = Engine.DIE_SIDES[d.level];
      if (!sides) return [];
      const arr = [];
      for (let i = 1; i <= sides; i++) arr.push(i);
      return arr;
    },

    roll: function (p, d) {
      if (Engine.hasBuff(p, 'lucky')) {
        d.value = Engine.DIE_SIDES[d.level];
      } else {
        d.value = 1 + Math.floor(Math.random() * Engine.DIE_SIDES[d.level]);
      }
    },

    flashValue: function (p, d) {
      if (Engine.hasBuff(p, 'lucky')) return Engine.DIE_SIDES[d.level];
      return 1 + Math.floor(Math.random() * Engine.DIE_SIDES[d.level]);
    },

    canLeap: function () { return true; },
    canHack: function () { return true; },

    render: function (d) {
      return {
        text: d.value > 0 ? String(d.value) : '·',
        color: Engine.DIE_COLORS[d.level] || '#666',
        title: Engine.DIE_NAMES[d.level] + '（' + Engine.DIE_SIDES[d.level] + '面）',
        isJewel: false,
        marks: []
      };
    },

    onConfirmed: null
  });

  // ============================================
  // 耀彩骰
  // ============================================
  DiceBehavior.register('jewel', {
    isGarbageCandidate: false,

    getFaceValues: function (d) {
      const jewel = window.JewelRegistry && window.JewelRegistry.get(d.jewelId);
      if (!jewel || !jewel.faces) return [];
      const seen = {};
      jewel.faces.forEach(function (f) { seen[f.value] = true; });
      return Object.keys(seen).map(Number);
    },

    roll: function (p, d) {
      const jewel = window.JewelRegistry && window.JewelRegistry.get(d.jewelId);
      if (!jewel || !jewel.faces || jewel.faces.length === 0) {
        d.value = 0;
        d.face = null;
        return;
      }
      let face;
      if (Engine.hasBuff(p, 'lucky')) {
        face = jewel.faces.reduce(function (a, b) {
          return a.value >= b.value ? a : b;
        });
      } else {
        face = jewel.faces[Math.floor(Math.random() * jewel.faces.length)];
      }
      d.face = face;
      d.value = face.value;
    },

    flashValue: function (p, d) {
      const jewel = window.JewelRegistry && window.JewelRegistry.get(d.jewelId);
      if (!jewel || !jewel.faces || jewel.faces.length === 0) return '·';
      if (Engine.hasBuff(p, 'lucky')) {
        return jewel.faces.reduce(function (a, b) {
          return a.value >= b.value ? a : b;
        }).value;
      }
      return jewel.faces[Math.floor(Math.random() * jewel.faces.length)].value;
    },

    canLeap: function () { return false; },
    canHack: function () { return false; },

    render: function (d) {
      const jName = (d.face && d.face.label) ? d.face.label : (d.jewelId || '耀彩骰');
      const marks = [];
      if (d.face && typeof d.face.onConfirm === 'function') {
        marks.push({ text: '★', className: 'die-jewel-mark' });
      }
      return {
        text: d.value > 0 ? String(d.value) : '·',
        color: '#a855f7',
        title: '耀彩骰：' + jName,
        isJewel: true,
        marks: marks
      };
    },

    onConfirmed: function (p, d, ctx) {
      if (d.face && typeof d.face.onConfirm === 'function') {
        d.face.onConfirm(ctx, p);
      }
    }
  });

})();