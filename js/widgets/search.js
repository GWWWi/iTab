/* ============================================================
   search.js — 顶部搜索框（可切换引擎）
   暴露 window.SearchWidget.initSearch(root, settings)
   - 支持百度 / Google / Bing，默认百度
   - 回车在新标签打开搜索结果
   - 聚焦高亮（CSS :focus-within）
   ============================================================ */
window.SearchWidget = (function () {
  'use strict';

  const ENGINES = {
    baidu: { name: '百度', base: 'https://www.baidu.com/s?wd=' },
    google: { name: 'Google', base: 'https://www.google.com/search?q=' },
    bing: { name: 'Bing', base: 'https://www.bing.com/search?q=' }
  };

  function initSearch(root, settings) {
    root.innerHTML =
      '<form class="search-form" id="searchForm" autocomplete="off">' +
      '  <select class="search-engine" id="searchEngine" title="搜索引擎"></select>' +
      '  <input class="search-input" id="searchInput" type="text" placeholder="搜索一下..." />' +
      '  <button class="search-submit" type="submit" title="搜索">🔍</button>' +
      '</form>';

    const form = root.querySelector('#searchForm');
    const engineSel = root.querySelector('#searchEngine');
    const input = root.querySelector('#searchInput');

    engineSel.innerHTML = Object.entries(ENGINES)
      .map(function (kv) {
        return '<option value="' + kv[0] + '">' + kv[1].name + '</option>';
      })
      .join('');
    engineSel.value = settings.searchEngine || 'baidu';
    let lastEngine = engineSel.value;

    engineSel.addEventListener('change', function (e) {
      lastEngine = e.target.value;
      Settings.update({ searchEngine: e.target.value });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) {
        input.focus();
        return;
      }
      const eng = ENGINES[engineSel.value] || ENGINES.baidu;
      const url = eng.base + encodeURIComponent(q);
      window.open(url, '_blank', 'noopener');
    });

    Store.onChange(function (dirty) {
      if (dirty.settings && dirty.settings.searchEngine && dirty.settings.searchEngine !== lastEngine) {
        engineSel.value = dirty.settings.searchEngine;
        lastEngine = dirty.settings.searchEngine;
      }
    });
  }

  return { initSearch: initSearch };
})();
