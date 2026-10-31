(function () {
  'use strict';
  window.Engine = window.Engine || {};

  // ---- 通用确认框 ----
  Engine.showConfirm = function (title, desc, onOk) {
    const overlay = document.getElementById('confirmBox');
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    if (!overlay || !okBtn || !cancelBtn) { onOk && onOk(); return; }

    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmDesc').textContent = desc;
    overlay.classList.add('show');

    function cleanup() {
      overlay.classList.remove('show');
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      overlay.removeEventListener('click', handleOverlay);
    }
    function handleOk() { cleanup(); try { onOk(); } catch (e) { console.error('[confirm]', e); } }
    function handleCancel() { cleanup(); }
    function handleOverlay(e) { if (e.target === overlay) cleanup(); }

    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlay);
  };

  Engine.hideConfirm = function () {
    const overlay = document.getElementById('confirmBox');
    if (overlay) overlay.classList.remove('show');
  };

  // ---- 角色详情弹窗 ----
  Engine.openModal = function (c) {
    if (!c) return;

    document.getElementById('modalName').textContent = c.name;
    document.getElementById('modalId').textContent = 'ID: ' + c.id;

    const diceStr = c.dice.map(function (g) {
      return Engine.DIE_NAMES[g.level] + ' ×' + g.count;
    }).join('　');

    document.getElementById('modalStats').innerHTML =
      '<div>生命：' + c.hp + '</div>' +
      '<div>攻击等级：' + c.atk + '</div>' +
      '<div>防御等级：' + c.def + '</div>' +
      '<div>骰子：' + (diceStr || '无') + '</div>';

    document.getElementById('modalSkills').innerHTML = Engine.buildSkillsHTML(c);
    document.getElementById('modalDesc').textContent = c.desc || '（暂无简介）';

    const pBox = document.querySelector('.modal-portrait');
    if (pBox) {
      if (c.portrait) {
        pBox.innerHTML = '';
        const img = document.createElement('img');
        img.src = c.portrait;
        img.alt = c.name || '';
        img.className = 'portrait-img';
        pBox.appendChild(img);
      } else {
        pBox.textContent = '立绘';
      }
    }

    document.getElementById('modal').style.display = 'flex';
  };

  Engine.closeModal = function () {
    document.getElementById('modal').style.display = 'none';
  };

  // ---- 选角弹窗 ----
  Engine.openPicker = function (side) {
    Engine.pickerSide = side;
    Engine.pickerSelectedId = Engine.G.selectedChars[side] || null;

    const list = document.getElementById('pickerList');
    list.innerHTML = '';

    const ids = Object.keys(Engine.CHARACTERS);
    ids.forEach(function (id) {
      const c = Engine.CHARACTERS[id];
      const card = document.createElement('div');
      card.className = 'picker-card';
      card.dataset.charId = id;

      const imgBox = document.createElement('div');
      imgBox.className = 'picker-card-img';
      if (c.portrait) {
        const img = document.createElement('img');
        img.src = c.portrait;
        img.alt = c.name;
        imgBox.appendChild(img);
      } else {
        imgBox.textContent = '—';
      }
      card.appendChild(imgBox);

      const info = document.createElement('div');
      info.className = 'picker-card-info';

      const name = document.createElement('div');
      name.className = 'picker-card-name';
      name.textContent = c.name;

      const idEl = document.createElement('div');
      idEl.className = 'picker-card-id';
      idEl.textContent = 'ID: ' + c.id;

      info.appendChild(name);
      info.appendChild(idEl);
      card.appendChild(info);

      card.addEventListener('click', function () {
        Engine.pickerSelectedId = id;
        Engine.updatePickerSelection();
      });

      list.appendChild(card);
    });

    document.getElementById('pickerTitle').textContent =
      side === 'bottom' ? '选择你的角色' : '选择对手角色';

    document.getElementById('picker').classList.add('show');
    Engine.updatePickerSelection();
  };

  Engine.updatePickerSelection = function () {
    const cards = document.querySelectorAll('#pickerList .picker-card');
    for (let i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('selected', cards[i].dataset.charId === Engine.pickerSelectedId);
    }
    const confirmBtn = document.getElementById('pickerConfirm');
    confirmBtn.disabled = !Engine.pickerSelectedId;
    if (Engine.pickerSelectedId && Engine.CHARACTERS[Engine.pickerSelectedId]) {
      Engine.showPickerDetail(Engine.CHARACTERS[Engine.pickerSelectedId]);
    } else {
      Engine.showPickerDetail(null);
    }
  };

  Engine.buildSkillsHTML = function (c) {
    if (!Array.isArray(c.skills) || c.skills.length === 0) {
      return '<div class="skill-none">无</div>';
    }
    return c.skills.map(function (sid) {
      const sk = window.SkillRegistry && window.SkillRegistry.get(sid);
      if (sk) {
        return '<div class="skill-block">' +
          '<div class="skill-name">' + (sk.name || sid) + '</div>' +
          '<div class="skill-desc">' + (sk.desc || '') + '</div>' +
        '</div>';
      }
      return '<div class="skill-block">' +
        '<div class="skill-name">' + sid + '</div>' +
        '<div class="skill-desc">（未注册的技能）</div>' +
      '</div>';
    }).join('');
  };

  Engine.showPickerDetail = function (c) {
    const nameEl  = document.getElementById('pickerDetailName');
    const idEl    = document.getElementById('pickerDetailId');
    const statsEl = document.getElementById('pickerDetailStats');
    const skillEl = document.getElementById('pickerDetailSkills');
    const descEl  = document.getElementById('pickerDetailDesc');
    const jewelEl = document.getElementById('pickerDetailJewel');

    if (!c) {
      nameEl.textContent = '—';
      idEl.textContent = '—';
      statsEl.innerHTML = '';
      skillEl.innerHTML = '<div class="skill-none">—</div>';
      descEl.textContent = '—';
      if (jewelEl) {
        jewelEl.className = 'picker-detail-jewel disabled';
        jewelEl.textContent = '—';
        jewelEl.onclick = null;
      }
      return;
    }

    nameEl.textContent = c.name;
    idEl.textContent = 'ID: ' + c.id;

    const diceStr = c.dice.map(function (g) {
      return Engine.DIE_NAMES[g.level] + ' ×' + g.count;
    }).join('　');

    statsEl.innerHTML =
      '<div>生命：' + c.hp + '</div>' +
      '<div>攻击等级：' + c.atk + '</div>' +
      '<div>防御等级：' + c.def + '</div>' +
      '<div>骰子：' + (diceStr || '无') + '</div>';

    skillEl.innerHTML = Engine.buildSkillsHTML(c);
    descEl.textContent = c.desc || '（暂无简介）';

    if (jewelEl) {
      if (c.jewel === false) {
        jewelEl.className = 'picker-detail-jewel disabled';
        jewelEl.textContent = '不可携带';
        jewelEl.onclick = null;
      } else {
        jewelEl.className = 'picker-detail-jewel clickable';
        const side = Engine.pickerSide;
        const jewelId = side ? Engine.G.selectedJewels[side] : null;

        let displayId = jewelId;
        let isDefault = false;
        if (!displayId && c.defaultJewel && window.JewelRegistry && window.JewelRegistry.has(c.defaultJewel)) {
          displayId = c.defaultJewel;
          isDefault = true;
        }

        if (displayId) {
          const j = window.JewelRegistry && window.JewelRegistry.get(displayId);
          const name = j ? j.name : displayId;
          const prefix = isDefault ? '（默认）' : '';
          jewelEl.innerHTML = '<span class="jewel-current">' + prefix + name + '</span>';
        } else {
          jewelEl.innerHTML = '<span class="jewel-current empty">点击选择</span>';
        }
        jewelEl.onclick = function () {
          if (side) Engine.openJewelPicker(side);
        };
      }
    }
  };

  Engine.closePicker = function () {
    document.getElementById('picker').classList.remove('show');
    Engine.pickerSide = null;
    Engine.pickerSelectedId = null;
  };

   Engine.confirmPicker = function () {
    if (!Engine.pickerSelectedId || !Engine.pickerSide) return;

    const side = Engine.pickerSide;
    const charId = Engine.pickerSelectedId;
    const char = Engine.CHARACTERS[charId];
    if (!char) return;

    Engine.G.selectedChars[side] = charId;

    // 默认耀彩骰
    if (char.jewel !== false && !Engine.G.selectedJewels[side]) {
      if (char.defaultJewel && window.JewelRegistry && window.JewelRegistry.has(char.defaultJewel)) {
        Engine.G.selectedJewels[side] = char.defaultJewel;
      } else if (window.JewelRegistry) {
        const ids = Object.keys(window.JewelRegistry.all());
        if (ids.length > 0) Engine.G.selectedJewels[side] = ids[0];
      }
    }

    // 立刻建 player 用于预览
    const player = Engine.makePlayer(char, side);
    if (char.jewel !== false && Engine.G.selectedJewels[side]) {
      player.jewelId = Engine.G.selectedJewels[side];
      player.jewelUses = Engine.CONFIG.jewelUses;
    }
    Engine.G.sides[side] = player;

    Engine.closePicker();
    Engine.checkBothReady();
  };

  Engine.randomPickerSelection = function () {
    const ids = Object.keys(Engine.CHARACTERS);
    if (ids.length === 0) return;
    Engine.pickerSelectedId = ids[Math.floor(Math.random() * ids.length)];
    Engine.updatePickerSelection();
  };

  Engine.randomPickForAI = function () {
    const ids = Object.keys(Engine.CHARACTERS);
    if (ids.length === 0) return;
    Engine.G.selectedChars.top = ids[Math.floor(Math.random() * ids.length)];
    Engine.checkBothReady();
  };

  // ---- 耀彩骰选择弹窗 ----
  Engine.openJewelPicker = function (side) {
    if (!window.JewelRegistry) return;
    const all = window.JewelRegistry.all();
    if (Object.keys(all).length === 0) {
      Engine.showBuffTip('无可用耀彩骰', '当前没有已注册的耀彩骰。');
      return;
    }
    Engine.jewelPickerSide = side;
    Engine.jewelPickerSelectedId = Engine.G.selectedJewels[side] || null;

    const list = document.getElementById('jewelPickerList');
    list.innerHTML = '';

    Object.keys(all).forEach(function (id) {
      const j = all[id];
      const item = document.createElement('div');
      item.className = 'jewel-picker-item';
      item.dataset.jewelId = id;

      const dist = {};
      (j.faces || []).forEach(function (f) {
        dist[f.value] = (dist[f.value] || 0) + 1;
      });
      const distStr = Object.keys(dist).sort(function (a, b) { return a - b; }).map(function (v) {
        return v + '×' + dist[v];
      }).join('　');

      const seen = {};
      const specialFaces = [];
      (j.faces || []).forEach(function (f) {
        if (!f.desc && !f.label && !f.onConfirm) return;
        const key = f.value + '|' + (f.desc || '');
        if (seen[key]) return;
        seen[key] = true;
        specialFaces.push(f);
      });

      let facesHtml = '';
      if (specialFaces.length > 0) {
        facesHtml = '<div class="jewel-picker-faces">' +
          specialFaces.map(function (f) {
            const label = f.label || (f.value + ' 点');
            const desc = f.desc || '特殊效果';
            return '<div class="jewel-face-row">' +
              '<span class="jewel-face-label">' + label + '</span>' +
              '<span class="jewel-face-desc">' + desc + '</span>' +
            '</div>';
          }).join('') +
        '</div>';
      }

      item.innerHTML =
        '<div class="jewel-picker-name">' + j.name + '</div>' +
        '<div class="jewel-picker-desc">' + (j.desc || '') + '</div>' +
        '<div class="jewel-picker-dist">点数分布：' + distStr + '</div>' +
        facesHtml;

      item.addEventListener('click', function () {
        Engine.jewelPickerSelectedId = id;
        Engine.updateJewelPickerSelection();
      });
      list.appendChild(item);
    });

    document.getElementById('jewelPicker').classList.add('show');
    Engine.updateJewelPickerSelection();
  };

  Engine.updateJewelPickerSelection = function () {
    const items = document.querySelectorAll('#jewelPickerList .jewel-picker-item');
    for (let i = 0; i < items.length; i++) {
      items[i].classList.toggle('selected', items[i].dataset.jewelId === Engine.jewelPickerSelectedId);
    }
    const confirmBtn = document.getElementById('jewelPickerConfirm');
    confirmBtn.disabled = !Engine.jewelPickerSelectedId;
  };

  Engine.closeJewelPicker = function () {
    const el = document.getElementById('jewelPicker');
    if (el) el.classList.remove('show');
    Engine.jewelPickerSide = null;
    Engine.jewelPickerSelectedId = null;
  };

  Engine.confirmJewelPicker = function () {
    if (!Engine.jewelPickerSide || !Engine.jewelPickerSelectedId) return;
    Engine.G.selectedJewels[Engine.jewelPickerSide] = Engine.jewelPickerSelectedId;
    Engine.closeJewelPicker();
    Engine.updatePickerSelection();
  };

})();