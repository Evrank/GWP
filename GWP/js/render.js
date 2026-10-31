(function () {
  'use strict';
  window.Engine = window.Engine || {};

  Engine.render = function () {
    Engine.renderSide('top');
    Engine.renderSide('bottom');
    Engine.renderCoin();
    Engine.renderRoundInfo();
  };

  Engine.renderPortrait = function (side, char) {
    const box = document.getElementById('portrait-' + side);
    if (!box) return;

    const ph  = box.querySelector('.portrait-placeholder');
    let   img = box.querySelector('img.portrait-img');

    if (!char) {
      if (img) img.remove();
      if (ph) {
        ph.style.display = '';
        ph.textContent = side === 'bottom' ? '点击选择你的角色' : '点击随机对手';
      }
      box.classList.add('empty');
      return;
    }

    box.classList.remove('empty');

    if (!char.portrait) {
      if (img) img.remove();
      if (ph) {
        ph.style.display = '';
        ph.textContent = '立绘';
      }
      return;
    }

    if (!img) {
      img = document.createElement('img');
      img.className = 'portrait-img';
      img.alt = char.name || '';
      img.addEventListener('load', function () {
        img.style.display = '';
        if (ph) ph.style.display = 'none';
      });
      img.addEventListener('error', function () {
        img.style.display = 'none';
        if (ph) ph.style.display = '';
      });
      box.insertBefore(img, box.firstChild);
    }

    if (img.getAttribute('src') !== char.portrait) {
      img.src = char.portrait;
    }
  };

  Engine.renderSide = function (side) {
    const G = Engine.G;
    const p = G.sides[side];

    const diceList    = document.getElementById('dice-' + side);
    const selArea     = document.getElementById('sel-' + side);
    const actionsEl   = document.getElementById('actions-' + side);
    const formulaEl   = document.getElementById('formula-' + side);
    const finalEl     = document.getElementById('final-' + side);
    const selAreaBox  = document.getElementById('selarea-' + side);
    const hpEl        = document.getElementById('hp-' + side);
    const buffsEl     = document.getElementById('buffs-' + side);

    if (!p) {
      diceList.innerHTML = '';
      selArea.innerHTML = '';
      actionsEl.innerHTML = '';
      formulaEl.innerHTML = '';
      finalEl.innerHTML = '';
      buffsEl.innerHTML = '';
      hpEl.textContent = '— / —';
      selAreaBox.classList.remove('locked');
      formulaEl.classList.remove('atk', 'def');
      finalEl.classList.remove('atk', 'def');
      Engine.renderPortrait(side, null);
      return;
    }

    diceList.innerHTML = '';
    selArea.innerHTML = '';

     const markGetters = [];
    let enableColorMark = false;
    (p.char.skills || []).forEach(function (sid) {
      const skill = window.SkillRegistry && window.SkillRegistry.get(sid);
      if (!skill) return;
      if (typeof skill.getDiceMark === 'function') {
        markGetters.push(skill.getDiceMark);
      }
      if (skill.enableDiceColorMark) enableColorMark = true;
    });

    p.dice.forEach(function (d) {
      const behavior = window.DiceBehavior.get(d.kind);
      if (!behavior) {
        console.warn('[render] 未知骰子类型:', d.kind);
        return;
      }

      const view = behavior.render(d);

      const el = document.createElement('div');
      el.className = 'die';
      if (view.isJewel) el.classList.add('die-jewel');
      el.dataset.dieId = d.id;
      el.style.background = view.color;
      el.textContent = view.text;
      el.title = view.title;
      el.addEventListener('click', function () { Engine.onDieClick(d); });

      if (d.kind === 'normal' && markGetters.length > 0) {
        for (let i = 0; i < markGetters.length; i++) {
          const mark = markGetters[i](d);
          if (mark) {
            view.marks.push({ text: mark, className: 'die-max-mark' });
            break;
          }
        }
      }

      view.marks.forEach(function (m) {
        const markEl = document.createElement('div');
        markEl.className = m.className || 'die-max-mark';
        markEl.textContent = m.text;
        el.appendChild(markEl);
      });

      // 分色标记（按值固定颜色）
      if (d.selected && enableColorMark) {
        const colorEl = document.createElement('div');
        colorEl.className = 'die-value-mark';
        colorEl.style.background = Engine.getValueColor(d.value);
        el.appendChild(colorEl);
      }

      if (d.selected) {
        el.classList.add('selected');
        selArea.appendChild(el);
      } else {
        diceList.appendChild(el);
      }
    });

    const selected = p.dice.filter(function (d) { return d.selected; });
    const isAtk = (G.attacker === side);

    const currentBuffBonus = isAtk ? (Engine.getAttackValue(p) - Engine.getValue(p)) : 0;

    let previewBonus = 0;
    if (isAtk) {
      (p.char.skills || []).forEach(function (sid) {
        const sk = window.SkillRegistry && window.SkillRegistry.get(sid);
        if (sk && typeof sk.previewAttackBonus === 'function') {
          previewBonus += sk.previewAttackBonus(p);
        }
      });
    }

    const totalBonus = currentBuffBonus + previewBonus;
    const baseSum = selected.reduce(function (s, d) { return s + d.value; }, 0);
    const totalValue = baseSum + (isAtk ? totalBonus : 0);

    formulaEl.classList.toggle('atk', isAtk);
    formulaEl.classList.toggle('def', !isAtk);
    let formulaHTML = '';
    if (selected.length > 0) {
      const parts = selected.map(function (d) { return d.value; });
      let expr = parts.join(' + ');
      if (isAtk && totalBonus > 0) {
        expr += ' + ' + totalBonus;
      }
      expr += ' = ' + totalValue;
      formulaHTML =
        '<span class="formula-label">' + (isAtk ? '攻击值' : '防御值') + '</span>' +
        '<span class="formula-text">' + expr + '</span>';
    }
    formulaEl.innerHTML = formulaHTML;

    const locked = Engine.isLocked(side);
    selAreaBox.classList.toggle('locked', locked);
    finalEl.classList.toggle('atk', isAtk);
    finalEl.classList.toggle('def', !isAtk);
    if (locked) {
      const val = isAtk ? Engine.getAttackValue(p) : Engine.getDefenseValue(p);
      finalEl.innerHTML =
        '<div class="final-label">' + (isAtk ? '攻击值' : '防御值') + '</div>' +
        '<div class="final-number">' + val + '</div>';
    } else {
      finalEl.innerHTML = '';
    }

    if (buffsEl) {
      buffsEl.innerHTML = '';
      Engine.forEachBuff(p, function (def, entry, id) {
        const icon = document.createElement('div');
        icon.className = 'buff-icon';
        if (def.borderColor) icon.style.borderColor = def.borderColor;
        if (def.color) icon.style.color = def.color;

        const nameStr = def.short || def.name || id;
        const stacks = entry.stacks || 0;
        let numStr = '';
        if (stacks > 1) numStr = String(stacks);
        else if (entry.param !== undefined) numStr = entry.param + '%';

        icon.innerHTML =
          '<span class="buff-icon-name">' + nameStr + '</span>' +
          (numStr ? '<span class="buff-icon-num">' + numStr + '</span>' : '');

        icon.addEventListener('click', function () {
          const desc = typeof def.desc === 'function' ? def.desc(entry) : (def.desc || '');
          const title = (def.name || id) + (stacks > 1 ? ' ×' + stacks : (entry.param !== undefined ? ' ' + entry.param + '%' : ''));
          Engine.showBuffTip(title, desc);
        });
        buffsEl.appendChild(icon);
      });
    }

    actionsEl.innerHTML = '';
    const active = Engine.getActiveSide();
    if (active === side && !Engine.isAI(side) && !locked && !Engine.animLock) {
      Engine.renderActions(side, actionsEl, p);
    }

    hpEl.textContent = Math.max(0, p.hp) + ' / ' + p.maxHp;
    hpEl.classList.toggle('hp-negative', p.hp < 0);
    Engine.renderPortrait(side, p.char);
  };

  Engine.renderActions = function (side, container, p) {
    const isAttacker = (side === Engine.G.attacker);
    const required = isAttacker ? p.char.atk : p.char.def;
    const selectedCount = p.dice.filter(function (d) { return d.selected; }).length;
    const totalCount = p.dice.length;

    if (p.jewelId) {
      const jewel = window.JewelRegistry && window.JewelRegistry.get(p.jewelId);
      if (jewel) {
        const check = Engine.canUseJewel(p);
        const jBtn = document.createElement('button');
        jBtn.className = 'btn btn-jewel';
        jBtn.textContent = jewel.name + ' ×' + p.jewelUses;
        jBtn.disabled = !check.ok;
        jBtn.title = check.ok ? '使用耀彩骰' : check.reason;
        jBtn.addEventListener('click', function () {
          if (!check.ok) return;
          Engine.showConfirm(
            '使用耀彩骰',
            '是否使用【' + jewel.name + '】？剩余 ' + p.jewelUses + ' 次。使用后不可撤销。',
            function () { Engine.useJewel(p); }
          );
        });
        container.appendChild(jBtn);
      }
    }

    if (isAttacker && p.rerolls > 0 && selectedCount > 0) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-reroll';
      btn.textContent = '重投 ×' + p.rerolls;
      btn.addEventListener('click', Engine.onReroll);
      container.appendChild(btn);
    }

    const cond1 = (selectedCount === required);
    const cond2 = (totalCount < required && selectedCount === totalCount && selectedCount > 0);
    if (cond1 || cond2) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-confirm';
      btn.textContent = '确定';
      btn.addEventListener('click', Engine.onConfirm);
      container.appendChild(btn);
    }
  };

  Engine.renderCoin = function () {
    const G = Engine.G;
    const coin = document.getElementById('coin');
    coin.classList.toggle('clickable', G.phase === 'coin');

    if (G.phase === 'coin' || G.phase === 'selecting') {
      coin.textContent = '?';
    } else if (G.attacker === 'top') {
      coin.textContent = '↑';
    } else if (G.attacker === 'bottom') {
      coin.textContent = '↓';
    } else {
      coin.textContent = '?';
    }
  };

  Engine.renderRoundInfo = function () {
    const G = Engine.G;
    const el = document.getElementById('roundInfo');
    if (G.phase === 'selecting') {
      el.textContent = '请选择角色';
    } else if (G.phase === 'coin') {
      el.textContent = '点击硬币决定先手';
    } else if (G.phase === 'gameover') {
      el.textContent = '战斗结束';
    } else {
      const who = G.attacker === 'top' ? '敌方' : '你';
      el.textContent = '回合 ' + G.round + ' · ' + who + '进攻';
    }
  };

})();