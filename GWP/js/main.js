(function () {
  'use strict';
  window.Engine = window.Engine || {};

  Engine.bindEvents = function () {
    document.getElementById('coin').addEventListener('click', Engine.onCoinClick);

    document.getElementById('portrait-top').addEventListener('click', function () {
      if (Engine.G.phase === 'selecting') {
        Engine.openPicker('top');
      } else {
        const p = Engine.G.sides.top;
        if (p) Engine.openModal(p.char);
      }
    });

    document.getElementById('portrait-bottom').addEventListener('click', function () {
      if (Engine.G.phase === 'selecting') {
        Engine.openPicker('bottom');
      } else {
        const p = Engine.G.sides.bottom;
        if (p) Engine.openModal(p.char);
      }
    });

    document.getElementById('modalClose').addEventListener('click', Engine.closeModal);
    document.getElementById('modal').addEventListener('click', function (e) {
      if (e.target.id === 'modal') Engine.closeModal();
    });

    document.getElementById('pickerClose').addEventListener('click', Engine.closePicker);
    document.getElementById('picker').addEventListener('click', function (e) {
      if (e.target.id === 'picker') Engine.closePicker();
    });
    document.getElementById('pickerConfirm').addEventListener('click', Engine.confirmPicker);
    document.getElementById('pickerRandom').addEventListener('click', Engine.randomPickerSelection);

    const jpClose = document.getElementById('jewelPickerClose');
    if (jpClose) jpClose.addEventListener('click', Engine.closeJewelPicker);
    const jpOverlay = document.getElementById('jewelPicker');
    if (jpOverlay) {
      jpOverlay.addEventListener('click', function (e) {
        if (e.target.id === 'jewelPicker') Engine.closeJewelPicker();
      });
    }
    const jpConfirm = document.getElementById('jewelPickerConfirm');
    if (jpConfirm) jpConfirm.addEventListener('click', Engine.confirmJewelPicker);

    const tip = document.getElementById('tipModal');
    if (tip) {
      tip.addEventListener('click', function () {
        tip.classList.remove('show');
      });
    }

    document.getElementById('btnRestart').addEventListener('click', Engine.resetToSelection);
    document.getElementById('btnAgain').addEventListener('click', Engine.resetToSelection);
  };

  Engine.boot = function () {
    if (!window.PackLoader) {
      console.error('PackLoader 未加载，检查 index.html 的 script 顺序');
      return;
    }

    Engine.initResolveStages();

    window.PackLoader.loadAllPacks().then(function () {
      Engine.loadCharacters();
      Engine.bindEvents();
      Engine.resetToSelection();
    }).catch(function (e) {
      console.error('包加载失败:', e);
      document.body.innerHTML =
        '<pre style="color:#f88;padding:24px;font-size:14px;white-space:pre-wrap">' +
        '包加载失败:\n' + (e && e.message ? e.message : e) +
        '</pre>';
    });
  };

  window.GameEngine = Engine;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Engine.boot);
  } else {
    Engine.boot();
  }

})();