(function () {
  'use strict';
  window.Engine = window.Engine || {};

  Engine.DIE_SIDES = { 1: 4, 2: 6, 3: 8, 4: 10, 5: 12, 6: 16, 7: 20 };
  Engine.DIE_NAMES = { 1: 'd4', 2: 'd6', 3: 'd8', 4: 'd10', 5: 'd12', 6: 'd16', 7: 'd20' };
  Engine.DIE_COLORS = {
    1: '#3b82f6',
    2: '#8b5cf6',
    3: '#c9a227',
    4: '#0d9488',
    5: '#ea580c',
    6: '#db2777',
    7: '#64748b'
  };

  Engine.CONFIG = {
    attackerRerolls: 2,
    defenderRerolls: 0,
    jewelUses: 2,
    aiSide: 'top',
    aiThinkMin: 420,
    aiThinkMax: 620,
    aiGarbageRatio: 0.5
  };

  Engine.FLASH_INTERVAL     = 55;
  Engine.FLASH_DURATION     = 420;
  Engine.POP_DURATION       = 460;
  Engine.COMPARE_DELAY      = 250;
  Engine.COMPARE_SHAKE_MS   = 400;
  Engine.COMPARE_SCALE_MS   = 500;
  Engine.REATTACK_GAP       = 700;
  Engine.POST_HIT_DELAY     = 1500;
  Engine.DAMAGE_POP_CLEAN   = 1600;

  Engine._jewelUid = 0;
  Engine.DICE_VALUE_COLORS = [
    '#ff6b6b', '#4ecdc4', '#ffe66d', '#a855f7',
    '#ff9f43', '#54a0ff', '#5f27cd', '#ff9ff3'
  ];
  Engine.getValueColor = function (value) {
    const idx = Math.abs(value) % Engine.DICE_VALUE_COLORS.length;
    return Engine.DICE_VALUE_COLORS[idx];
  };

})();