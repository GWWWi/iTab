/* ============================================================
   app.js — 入口
   - 装配各 widget、设置面板、加载并兜底默认数据
   - 经典脚本，DOM 就绪后统一初始化
   ============================================================ */
(function () {
  'use strict';

  const DEFAULT_SITES = [
    { name: '公司远程', url: 'http://auth.wiztek.com.cn/' },
    { name: '京东', url: 'https://www.jd.com/' },
    { name: 'NGA', url: 'https://ngabbs.com/thread.php?fid=-7955747&rand=674' },
    { name: '小红书', url: 'https://www.xiaohongshu.com/explore' },
    { name: '荔枝数码', url: 'https://lizhi.shop/' },
    { name: '汽车之家', url: 'https://www.autohome.com.cn/nanjing/' },
    { name: '百度地图', url: 'https://map.baidu.com/@13216592,3765197,13z' },
    { name: '虎扑', url: 'https://bbs.hupu.com/love' },
    { name: '微博', url: 'https://weibo.com/mygroups?gid=110005392694502' },
    { name: '南京天气', url: 'https://www.nmc.cn/publish/forecast/AJS/nanjing.html' }
  ];

  // 暴露出厂默认常用网址，供「重置为默认」使用
  window.ITAB_DEFAULT_SITES = DEFAULT_SITES;

  const DEFAULTS = {
    settings: {
      searchEngine: 'baidu',
      weatherCity: '南京',
      wallpaper: { type: 'preset', value: 'g1' },
      widgetVisibility: { weather: false, todo: false, notes: false, countdown: false, quote: false },
      clockSize: 'medium'
    },
    quickaccess: DEFAULT_SITES,
    todos: [],
    notes: '',
    countdowns: []
  };

  function normalizeSettings(s) {
    const base = DEFAULTS.settings;
    const out = Object.assign({}, base, s || {});
    out.widgetVisibility = Object.assign({}, base.widgetVisibility, (s && s.widgetVisibility) || {});
    out.wallpaper = (s && s.wallpaper) || base.wallpaper;
    return out;
  }

  // 单个 widget 初始化失败不应连累整页：逐个 try/catch
  function safeInit(name, fn) {
    try {
      fn();
    } catch (e) {
      console.error('[iTab] 组件初始化失败: ' + name, e);
    }
  }

  function start() {
    Store.get(DEFAULTS, function (data) {
      const settings = normalizeSettings(data.settings);

      safeInit('settings', function () { Settings.init(settings); });
      safeInit('clock', function () { ClockWidget.initClock(document.getElementById('clock')); });
      safeInit('search', function () { SearchWidget.initSearch(document.getElementById('search'), settings); });
      safeInit('weather', function () { WeatherWidget.initWeather(document.getElementById('weather'), settings); });
      safeInit('quickaccess', function () { QuickAccessWidget.initQuickAccess(document.getElementById('quickaccess'), data.quickaccess); });
      safeInit('todo', function () { TodoWidget.initTodo(document.getElementById('todo')); });
      safeInit('notes', function () { NotesWidget.initNotes(document.getElementById('notes')); });
      safeInit('countdown', function () { CountdownWidget.initCountdown(document.getElementById('countdown')); });
      safeInit('quote', function () { QuoteWidget.initQuote(document.getElementById('quote')); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
