/* ============================================================
   notes.js — 笔记 widget
   暴露 window.NotesWidget.initNotes(root)
   - textarea 自动保存（防抖）到 storage
   ============================================================ */
window.NotesWidget = (function () {
  'use strict';

  function initNotes(root) {
    root.innerHTML =
      '<div class="widget-header"><h3>笔记</h3><span class="notes-saved" id="notesSaved"></span></div>' +
      '<textarea class="notes-area" id="notesArea" placeholder="随手记点什么，自动保存..."></textarea>';

    const area = root.querySelector('#notesArea');
    const saved = root.querySelector('#notesSaved');
    let timer = null;

    Store.get({ notes: '' }, function (d) {
      area.value = d.notes || '';
    });

    area.addEventListener('input', function () {
      saved.textContent = '';
      clearTimeout(timer);
      timer = setTimeout(function () {
        Store.set({ notes: area.value });
        saved.textContent = '已保存';
        setTimeout(function () {
          saved.textContent = '';
        }, 1500);
      }, 600);
    });

    Store.onChange(function (dirty) {
      // 其他页面改了笔记时同步（当前未聚焦才覆盖，避免打断输入）
      if (dirty.notes !== undefined && document.activeElement !== area) {
        area.value = dirty.notes || '';
      }
    });
  }

  return { initNotes: initNotes };
})();
