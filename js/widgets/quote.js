/* ============================================================
   quote.js — 每日一言
   暴露 window.QuoteWidget.initQuote(root)
   - 调用 https://v1.hitokoto.cn/ ，失败兜底本地名言
   ============================================================ */
window.QuoteWidget = (function () {
  'use strict';

  const FALLBACK = [
    { hitokoto: '路漫漫其修远兮，吾将上下而求索。', from: '屈原' },
    { hitokoto: '生活不止眼前的苟且，还有诗和远方的田野。', from: '高晓松' },
    { hitokoto: '世界上最快乐的事，莫过于为理想而奋斗。', from: '苏格拉底' },
    { hitokoto: '每一个不曾起舞的日子，都是对生命的辜负。', from: '尼采' },
    { hitokoto: '今天应做的事没有做，明天再早也是耽误了。', from: '裴斯泰洛齐' }
  ];

  function initQuote(root) {
    root.innerHTML =
      '<div class="quote-box">' +
      '  <div class="quote-text" id="quoteText">加载中...</div>' +
      '  <div class="quote-from" id="quoteFrom"></div>' +
      '</div>';

    const textEl = root.querySelector('#quoteText');
    const fromEl = root.querySelector('#quoteFrom');

    function applyLocal() {
      const q = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
      textEl.textContent = q.hitokoto;
      fromEl.textContent = '—— ' + q.from;
    }

    async function load() {
      try {
        const res = await fetch('https://v1.hitokoto.cn/');
        if (!res.ok) throw new Error('fail');
        const data = await res.json();
        textEl.textContent = data.hitokoto || '';
        fromEl.textContent = data.from ? '—— ' + data.from : '';
      } catch (_) {
        applyLocal();
      }
    }

    load();
    setInterval(load, 30 * 60 * 1000);
  }

  return { initQuote: initQuote };
})();
