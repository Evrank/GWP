(function () {
  'use strict';
  window.Engine = window.Engine || {};

  Engine.showDamage = function (side, amount) {
    const portrait = document.getElementById('portrait-' + side);
    const el = document.createElement('div');
    el.className = 'damage-pop';
    el.textContent = '-' + amount;
    portrait.appendChild(el);
    setTimeout(function () { el.remove(); }, Engine.DAMAGE_POP_CLEAN);
  };

  Engine.showBlock = function (side) {
    const portrait = document.getElementById('portrait-' + side);
    const el = document.createElement('div');
    el.className = 'block-pop';
    el.textContent = '格挡';
    portrait.appendChild(el);
    setTimeout(function () { el.remove(); }, Engine.DAMAGE_POP_CLEAN);
  };

  Engine.shakePortrait = function (side, hard) {
    const portrait = document.getElementById('portrait-' + side);
    const cls = hard ? 'shake-hard' : 'shake-soft';
    portrait.classList.remove('shake-soft', 'shake-hard');
    void portrait.offsetWidth;
    portrait.classList.add(cls);
    setTimeout(function () { portrait.classList.remove(cls); }, hard ? 750 : 450);
  };

  Engine.showResult = function (text) {
    document.getElementById('resultTitle').textContent = text;
    document.getElementById('result').style.display = 'flex';
  };

  Engine.showBuffTip = function (title, desc) {
    const t = document.getElementById('tipTitle');
    const d = document.getElementById('tipDesc');
    const m = document.getElementById('tipModal');
    if (!t || !d || !m) return;
    t.textContent = title;
    d.textContent = desc;
    m.classList.add('show');
  };
  
  Engine.showInstantDamage = function (side, amount) {
    const portrait = document.getElementById('portrait-' + side);
    if (!portrait) return;

    const slash = document.createElement('div');
    slash.className = 'instant-slash';
    portrait.appendChild(slash);
    setTimeout(function () { slash.remove(); }, 800);

    const pop = document.createElement('div');
    pop.className = 'instant-damage-pop';
    pop.textContent = amount;
    portrait.appendChild(pop);
    setTimeout(function () { pop.remove(); }, 1300);
  };

})();