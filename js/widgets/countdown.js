/* ============================================================
   countdown.js — 倒计时 widget
   暴露 window.CountdownWidget.initCountdown(root)
   - 设置目标事件名 + 日期，实时显示 距 XX 还有 N天/时/分/秒
   - 可删除；每秒刷新；持久化 storage
   ============================================================ */
window.CountdownWidget = (function () {
  'use strict';

  let timers = [];

  const escapeHtml = window.iTabUtils.escapeHtml;

  function computeRemain(dateStr, name) {
    const target = new Date(dateStr).getTime();
    if (isNaN(target)) return '日期无效';
    let diff = target - Date.now();
    if (diff <= 0) return '「' + name + '」已到';
    const d = Math.floor(diff / 86400000);
    diff -= d * 86400000;
    const h = Math.floor(diff / 3600000);
    diff -= h * 3600000;
    const m = Math.floor(diff / 60000);
    diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    return '距 ' + name + ' 还有 ' + d + '天 ' + h + '时 ' + m + '分 ' + s + '秒';
  }

  function initCountdown(root) {
    root.innerHTML =
      '<div class="widget-header"><h3>倒计时</h3></div>' +
      '<form class="cd-add" id="cdAdd">' +
      '  <input id="cdName" placeholder="事件名，如：元旦" />' +
      '  <input id="cdDate" type="datetime-local" />' +
      '  <button type="submit" class="primary">添加</button>' +
      '</form>' +
      '<ul class="cd-list" id="cdList"></ul>';

    const listEl = root.querySelector('#cdList');
    const form = root.querySelector('#cdAdd');
    const nameI = root.querySelector('#cdName');
    const dateI = root.querySelector('#cdDate');

    function render(items) {
      timers.forEach(clearInterval);
      timers = [];
      listEl.innerHTML = '';
      (items || []).forEach(function (c) {
        const li = document.createElement('li');
        li.className = 'cd-item';
        li.innerHTML =
          '<div class="cd-top">' +
          '  <span class="cd-name">' + escapeHtml(c.name) + '</span>' +
          '  <button class="cd-del" title="删除">✕</button>' +
          '</div>' +
          '<div class="cd-remain">--</div>';
        li.querySelector('.cd-del').addEventListener('click', function () {
          remove(c.id);
        });
        listEl.appendChild(li);
        const remainEl = li.querySelector('.cd-remain');
        const tick = function () {
          remainEl.textContent = computeRemain(c.date, c.name);
        };
        tick();
        timers.push(setInterval(tick, 1000));
      });
    }

    function load() {
      Store.get({ countdowns: [] }, function (d) {
        render(d.countdowns);
      });
    }

    function remove(id) {
      Store.get({ countdowns: [] }, function (d) {
        const items = d.countdowns.filter(function (c) {
          return c.id !== id;
        });
        Store.set({ countdowns: items });
        render(items);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = nameI.value.trim();
      const date = dateI.value;
      if (!name || !date) {
        alert('请填写事件名和日期');
        return;
      }
      Store.get({ countdowns: [] }, function (d) {
        const items = d.countdowns.slice();
        items.push({
          id: 'c' + Date.now() + Math.random().toString(36).slice(2, 6),
          name: name,
          date: date
        });
        Store.set({ countdowns: items });
        render(items);
        nameI.value = '';
        dateI.value = '';
      });
    });

    load();
    Store.onChange(function (dirty) {
      if (dirty.countdowns) render(dirty.countdowns);
    });
  }

  return { initCountdown: initCountdown };
})();
