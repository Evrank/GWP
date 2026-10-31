(function () {
  'use strict';
  window.Engine = window.Engine || {};

  Engine.G = {
    phase: 'selecting',
    round: 1,
    attacker: null,
    sides: { top: null, bottom: null },
    selectedChars: { top: null, bottom: null },
    selectedJewels: { top: null, bottom: null },
    battleToken: 0
  };

  Engine.animLock = false;
  Engine.CHARACTERS = {};
  Engine.pickerSide = null;
  Engine.pickerSelectedId = null;
  Engine.jewelPickerSide = null;
  Engine.jewelPickerSelectedId = null;

  Engine.emit = function (name, ctx) {
    if (!window.Events) return ctx || {};
    return window.Events.emit(name, ctx);
  };

  Engine.parseChar = function (raw, meta) {
    const parts = raw.split(/[｜|]/).map(function (s) { return s.trim(); });
    if (parts.length < 5) throw new Error('角色数据字段不足：' + raw);

    const id   = parts[0];
    const name = parts[1];
    const hp   = parseInt(parts[2], 10);
    const ad   = parts[3].split('/').map(function (s) { return parseInt(s.trim(), 10); });
    const atk  = ad[0];
    const def  = ad[1];
    const skillsRaw = parts[parts.length - 1];

    const dice = [];
    for (let i = 4; i < parts.length - 1; i++) {
      const m = parts[i].match(/^(\d+)\s*[，,]\s*(\d+)$/);
      if (m) dice.push({ level: parseInt(m[1], 10), count: parseInt(m[2], 10) });
    }

    let skills = [];
    if (meta && Array.isArray(meta.skills)) {
      skills = meta.skills.slice();
    } else if (skillsRaw && skillsRaw !== '无') {
      skills = skillsRaw.split(/[,，、\s]+/).filter(Boolean);
    }

    return Object.assign({}, meta || {}, {
      id: id, name: name, hp: hp, atk: atk, def: def, dice: dice, skills: skills
    });
  };

  Engine.loadCharacters = function () {
    if (!window.CharacterRegistry) return;
    const all = window.CharacterRegistry.all();
    Object.keys(all).forEach(function (id) {
      Engine.CHARACTERS[id] = Engine.parseChar(all[id].raw, all[id]);
    });
  };

  Engine.makePlayer = function (char, side) {
    const dice = [];
    let uid = 0;
    char.dice.forEach(function (group) {
      for (let i = 0; i < group.count; i++) {
        dice.push({
          id: side + '_d' + (uid++),
          side: side,
          level: group.level,
          kind: 'normal',
          value: 0,
          selected: false
        });
      }
    });
    return {
      side: side,
      char: char,
      hp: char.hp,
      maxHp: char.hp,
      dice: dice,
      rerolls: 0,
      buffs: [],
      jewelId: null,
      jewelUses: 0,
      _jewelUsedThisRound: false,
      _jewelCounters: {},
      _registeredBuffHandlers: {},
      _skillFlags: {}
    };
  };

  // ---- Buff API ----
  Engine.getBuffEntries = function (p, id) {
    if (!p || !p.buffs) return [];
    return p.buffs.filter(function (e) { return e.id === id; });
  };

  Engine.getBuffStacks = function (p, id) {
    let total = 0;
    Engine.getBuffEntries(p, id).forEach(function (e) {
      total += (e.stacks || 1);
    });
    return total;
  };

  Engine.hasBuff = function (p, id) {
    if (!p || !p.buffs) return false;
    return p.buffs.some(function (e) { return e.id === id; });
  };

  Engine.addBuff = function (p, id, options) {
    if (!p) return;
    if (!p.buffs) p.buffs = [];
    const def = window.BuffRegistry && window.BuffRegistry.get(id);
    if (!def) { console.warn('[addBuff] 未注册的 buff:', id); return; }

    const opts = options || {};
    const stacks = opts.stacks || 1;
    const param = opts.param;

    let merged = false;
    if (def.mergeable === true) {
      const existing = p.buffs.find(function (e) { return e.id === id; });
      if (existing) {
        existing.stacks = (existing.stacks || 1) + stacks;
        merged = true;
      }
    } else if (def.mergeable === 'same-param') {
      const existing = p.buffs.find(function (e) {
        return e.id === id && e.param === param;
      });
      if (existing) {
        existing.stacks = (existing.stacks || 1) + stacks;
        merged = true;
      }
    }

    if (!merged) {
      const entry = { id: id };
      if (def.mergeable) entry.stacks = stacks;
      if (param !== undefined) entry.param = param;
      p.buffs.push(entry);

      if (!p._registeredBuffHandlers) p._registeredBuffHandlers = {};
      if (!p._registeredBuffHandlers[id]) {
        p._registeredBuffHandlers[id] = true;
        Engine.registerBuffHandlers(p, id);
      }

      if (typeof def.onApplied === 'function') {
        try { def.onApplied(p, entry); }
        catch (err) { console.error('[buff onApplied:' + id + ']', err); }
      }

      Engine.emit('buff:added', { g: Engine.G, unit: p, buffId: id, entry: entry });
    }
  };

  Engine.removeBuff = function (p, id, options) {
    if (!p || !p.buffs) return;
    const opts = options || {};
    const removed = [];
    if (opts.param !== undefined) {
      p.buffs = p.buffs.filter(function (e) {
        if (e.id === id && e.param === opts.param) { removed.push(e); return false; }
        return true;
      });
    } else {
      p.buffs = p.buffs.filter(function (e) {
        if (e.id === id) { removed.push(e); return false; }
        return true;
      });
    }
    removed.forEach(function (entry) {
      Engine.emit('buff:removed', { g: Engine.G, unit: p, buffId: id, entry: entry });
    });
  };

  Engine.decreaseStacks = function (p, id, n) {
    const entries = Engine.getBuffEntries(p, id);
    if (entries.length === 0) return;
    const e = entries[0];
    if (!e.stacks) return;
    e.stacks -= n;
    if (e.stacks <= 0) {
      p.buffs = p.buffs.filter(function (x) { return x !== e; });
      Engine.emit('buff:removed', { g: Engine.G, unit: p, buffId: id, entry: e });
    }
  };

  Engine.removeAllTempBuffs = function (p) {
    if (!p || !p.buffs) return;
    const removed = [];
    p.buffs = p.buffs.filter(function (e) {
      const def = window.BuffRegistry && window.BuffRegistry.get(e.id);
      if (def && def.temp) { removed.push(e); return false; }
      return true;
    });
    removed.forEach(function (entry) {
      Engine.emit('buff:removed', { g: Engine.G, unit: p, buffId: entry.id, entry: entry });
    });
  };

  Engine.forEachBuff = function (p, fn) {
    if (!p || !p.buffs) return;
    p.buffs.forEach(function (entry) {
      const def = window.BuffRegistry && window.BuffRegistry.get(entry.id);
      if (def) fn(def, entry, entry.id);
    });
  };

  Engine.registerBuffHandlers = function (player, buffId) {
    const def = window.BuffRegistry && window.BuffRegistry.get(buffId);
    if (!def) return;

    if (def.events) {
      Object.keys(def.events).forEach(function (eventName) {
        const spec = def.events[eventName];
        const fn = typeof spec === 'function' ? spec : spec.fn;
        const priority = (spec && spec.priority) || 0;
        Events.onUnit(player, eventName, function (ctx) {
          Engine.getBuffEntries(player, buffId).forEach(function (entry) {
            try { fn(ctx, player, entry); }
            catch (e) { console.error('[buff event:' + buffId + ':' + eventName + ']', e); }
          });
        }, { priority: priority });
      });
    }

    if (def.stages) {
      Object.keys(def.stages).forEach(function (stageName) {
        const spec = def.stages[stageName];
        const fn = typeof spec === 'function' ? spec : spec.fn;
        const priority = (spec && spec.priority) || 0;
        Stages.use(stageName, function (ctx) {
          Engine.getBuffEntries(player, buffId).forEach(function (entry) {
            try { fn(ctx, player, entry); }
            catch (e) { console.error('[buff stage:' + buffId + ':' + stageName + ']', e); }
          });
        }, { priority: priority, scope: player });
      });
    }
  };

  // ---- 数值计算 ----
  Engine.getValue = function (p) {
    let sum = 0;
    p.dice.forEach(function (d) { if (d.selected) sum += d.value; });
    return sum;
  };

  Engine.getAttackValue = function (p) {
    let v = Engine.getValue(p);
    Engine.forEachBuff(p, function (def, entry) {
      if (typeof def.attackBonus === 'function') {
        v += def.attackBonus(p, entry) || 0;
      }
    });
    return v;
  };

  Engine.getDefenseValue = function (p) {
    let v = Engine.getValue(p);
    Engine.forEachBuff(p, function (def, entry) {
      if (typeof def.defenseBonus === 'function') {
        v += def.defenseBonus(p, entry) || 0;
      }
    });
    return v;
  };

  Engine.getHitCount = function (p) {
    let count = 1;
    Engine.forEachBuff(p, function (def, entry) {
      if (typeof def.hitCount === 'function') {
        const c = def.hitCount(p, entry);
        if (c > count) count = c;
      }
    });
    return count;
  };

  Engine.applyDamage = function (p, amount) {
    if (amount <= 0 || !p) return 0;
    const oldHp = p.hp;

    if (Engine.hasBuff(p, 'unyielding')) {
      // 不屈：HP 不会低于 1
      p.hp = Math.max(1, p.hp - amount);
    } else {
      // 正常：HP 可以为负（伤害溢出）
      p.hp -= amount;
    }

    Engine.emit('hp:changed', {
      g: Engine.G, unit: p, oldHp: oldHp, newHp: p.hp,
      amount: amount,          // 理论伤害
      hpLoss: oldHp - p.hp     // 实际扣血（考虑不屈）
    });

    // 返回理论伤害，飘字显示用这个
    return amount;
  };

  Engine.applyInstantDamage = function (target, amount, source) {
    if (!target || amount <= 0) return 0;
    const actual = Engine.applyDamage(target, amount);
    if (actual > 0) {
      Engine.showInstantDamage(target.side, actual);
      Engine.shakePortrait(target.side, actual >= 10);
    }
    return actual;
  };

  // ---- 通用查询 ----
  Engine.getActiveSide = function () {
    if (Engine.G.phase === 'attack')  return Engine.G.attacker;
    if (Engine.G.phase === 'defense') return Engine.G.attacker === 'top' ? 'bottom' : 'top';
    return null;
  };

  Engine.isAI = function (side) {
    return Engine.CONFIG.aiSide && Engine.CONFIG.aiSide === side;
  };

  Engine.isLocked = function (side) {
    if (Engine.G.phase === 'defense') return side === Engine.G.attacker;
    if (Engine.G.phase === 'resolve') return true;
    if (Engine.G.phase === 'gameover') return true;
    return false;
  };

  // ---- ★ 通用值判断（不区分骰子类型，基于"面集合 + 当前值"） ----
  Engine.getFaceValues = function (d) {
    if (!d) return [];
    const behavior = window.DiceBehavior.get(d.kind);
    if (behavior && typeof behavior.getFaceValues === 'function') {
      return behavior.getFaceValues(d);
    }
    return [];
  };

  Engine.isMaxValue = function (d) {
    const faces = Engine.getFaceValues(d);
    if (faces.length === 0) return false;
    const maxVal = Math.max.apply(null, faces);
    return d.value === maxVal;
  };

  Engine.isMinValue = function (d) {
    const faces = Engine.getFaceValues(d);
    if (faces.length === 0) return false;
    const minVal = Math.min.apply(null, faces);
    return d.value === minVal;
  };

  Engine.isOddValue = function (d) {
    return (d.value % 2) === 1;
  };

  Engine.isEvenValue = function (d) {
    return (d.value % 2) === 0;
  };

  Engine.isPrimeValue = function (d) {
    const n = d.value;
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) return false;
    }
    return true;
  };

  Engine.isValueIn = function (d, arr) {
    return arr.indexOf(d.value) >= 0;
  };

  // ---- 投骰（走 DiceBehavior） ----
  Engine.rollDie = function (p, d) {
    const behavior = window.DiceBehavior.get(d.kind);
    if (behavior && typeof behavior.roll === 'function') {
      behavior.roll(p, d);
    }
  };

  Engine.randDelay = function () {
    const c = Engine.CONFIG;
    return c.aiThinkMin + Math.random() * (c.aiThinkMax - c.aiThinkMin);
  };

  // ---- 耀彩骰 API ----
  Engine.canUseJewel = function (player) {
    if (!player) return { ok: false, reason: '无角色' };
    if (!player.jewelId) return { ok: false, reason: '未携带耀彩骰' };
    if (player.jewelUses <= 0) return { ok: false, reason: '次数已用完' };
    if (player._jewelUsedThisRound) return { ok: false, reason: '本回合已使用过耀彩骰' };

    const jewel = window.JewelRegistry && window.JewelRegistry.get(player.jewelId);
    if (!jewel) return { ok: false, reason: '耀彩骰未注册' };

    if (jewel.when) {
      const phase = Engine.G.phase;
      const isAttacker = (player.side === Engine.G.attacker);
      let currentWhen = null;
      if (isAttacker && phase === 'attack') currentWhen = 'attack';
      else if (!isAttacker && phase === 'defense') currentWhen = 'defense';
      if (currentWhen !== jewel.when) {
        return { ok: false, reason: '仅限' + (jewel.when === 'attack' ? '攻击' : '防御') + '时使用' };
      }
    }

    if (jewel.unlock && typeof jewel.unlock.check === 'function') {
      if (!jewel.unlock.check(player, jewel)) return { ok: false, reason: '尚未解锁' };
    }

    return { ok: true };
  };

  Engine.useJewel = function (player) {
    const check = Engine.canUseJewel(player);
    if (!check.ok) return false;

    player.jewelUses -= 1;
    player._jewelUsedThisRound = true;

    Engine._jewelUid++;
    const side = player.side;
    const d = {
      id: side + '_j' + Engine._jewelUid,
      side: side,
      level: 0,
      kind: 'jewel',
      jewelId: player.jewelId,
      value: 0,
      selected: false,
      face: null
    };
    player.dice.push(d);

    Engine.rollDiceAnimated(side, [d], null);
    return true;
  };

  Engine.registerJewelHandlers = function (player, jewelId) {
    const jewel = window.JewelRegistry && window.JewelRegistry.get(jewelId);
    if (!jewel || !jewel.unlock || !jewel.unlock.events) return;
    jewel.unlock.events.forEach(function (eventName) {
      Events.onUnit(player, eventName, function (ctx) {
        try { jewel.unlock.onEvent(ctx, player, jewel); }
        catch (e) { console.error('[jewel unlock:' + jewelId + ':' + eventName + ']', e); }
      });
    });
  };

  // ---- 技能挂载 ----
  Engine.attachSkillHooks = function (player) {
    const ids = player.char.skills || [];
    if (!Array.isArray(ids) || ids.length === 0) return;
    ids.forEach(function (sid) {
      const skill = window.SkillRegistry && window.SkillRegistry.get(sid);
      if (!skill) return;

      if (skill.events) {
        Object.keys(skill.events).forEach(function (eventName) {
          const spec = skill.events[eventName];
          const fn = typeof spec === 'function' ? spec : spec.fn;
          const priority = (spec && spec.priority) || 0;
          Events.onUnit(player, eventName, function (ctx) {
            return fn(ctx, player);
          }, { priority: priority });
        });
      }

      if (skill.stages) {
        Object.keys(skill.stages).forEach(function (stageName) {
          const spec = skill.stages[stageName];
          const fn = typeof spec === 'function' ? spec : spec.fn;
          const priority = (spec && spec.priority) || 0;
          Stages.use(stageName, function (ctx) {
            return fn(ctx, player);
          }, { priority: priority, scope: player });
        });
      }
    });
  };

})();