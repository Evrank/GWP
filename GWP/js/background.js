(function () {
  'use strict';
  window.Engine = window.Engine || {};

  Engine.Background = {
    pool: [],
    current: null,

    collect: function () {
      const pool = [];
      if (window.PackRegistry) {
        const packs = window.PackRegistry.all();
        Object.keys(packs).forEach(function (id) {
          const p = packs[id];
          if (Array.isArray(p.backgrounds)) {
            p.backgrounds.forEach(function (src) {
              if (src) pool.push(src);
            });
          }
        });
      }
      this.pool = pool;
      return pool;
    },

    randomize: function () {
      if (this.pool.length === 0) {
        document.body.classList.remove('has-bg');
        document.body.style.removeProperty('--bg-image');
        this.current = null;
        return;
      }

      let next = this.pool[Math.floor(Math.random() * this.pool.length)];

      if (this.pool.length > 1 && next === this.current) {
        const idx = this.pool.indexOf(next);
        next = this.pool[(idx + 1) % this.pool.length];
      }

      this.current = next;

      // ★ 把相对路径转成绝对 URL，避免 CSS 变量按 style.css 所在目录解析
      let absUrl;
      try {
        absUrl = new URL(next, document.baseURI).href;
      } catch (e) {
        absUrl = next;
      }

      document.body.style.setProperty('--bg-image', 'url("' + absUrl + '")');
      document.body.classList.add('has-bg');

      // 调试用：控制台里能看到实际加载的绝对路径
      console.log('[Background] ' + absUrl);
    }
  };

})();