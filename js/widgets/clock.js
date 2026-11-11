/* ============================================================
   clock.js — 居中大时钟 + 中文日期星期
   暴露 window.ClockWidget.initClock(root)
   ============================================================ */
window.ClockWidget = (function () {
  'use strict';

  const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  function initClock(root) {
    root.innerHTML =
      '<div class="clock-time" id="clockTime">--:--:--</div>' +
      '<div class="clock-date" id="clockDate"></div>';

    const timeEl = root.querySelector('#clockTime');
    const dateEl = root.querySelector('#clockDate');

    function pad(n) {
      return String(n).padStart(2, '0');
    }

    function tick() {
      const now = new Date();
      const h = pad(now.getHours());
      const m = pad(now.getMinutes());
      const s = pad(now.getSeconds());
      timeEl.textContent = h + ':' + m + ':' + s;
      dateEl.textContent =
        now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + WEEK[now.getDay()];
    }

    tick();
    setInterval(tick, 1000);
  }

  return { initClock: initClock };
})();
