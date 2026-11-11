/* ============================================================
   settings.js — 设置面板
   暴露全局 Settings：init / update / apply / toggle / open / close
   - 搜索引擎、天气城市、壁纸（预设/上传/在线URL）
   - 组件显隐开关、时钟字号
   - 所有改动即时生效并写入存储
   ============================================================ */
window.Settings = (function () {
  'use strict';

  const WALLPAPERS = {
    g1: { label: '紫蓝渐变', css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    g2: { label: '粉红渐变', css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    g3: { label: '青蓝渐变', css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    g4: { label: '薄荷渐变', css: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    g5: { label: '晴空蓝', css: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' },
    g6: { label: '深空灰', css: 'linear-gradient(135deg, #232526 0%, #414345 100%)' }
  };
  const ENGINES = { baidu: '百度', google: 'Google', bing: 'Bing' };
  const BUILTIN_CITIES = Object.keys(window.iTabUtils.cities);

  let current = null;
  let panel = null;
  let widgetEls = {};

  function init(settings) {
    current = settings;
    panel = document.getElementById('settingsPanel');
    renderPanel();
    document.getElementById('settingsBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });
    panel.addEventListener('click', function (e) {
      if (e.target === panel) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    document.addEventListener('click', function (e) {
      if (!panel.classList.contains('open')) return;
      if (e.target.id === 'settingsBtn') return;
      if (panel.contains(e.target)) return;
      if (e.target.closest && e.target.closest('#settingsBtn')) return;
      close();
    });
    cacheWidgetEls();
    apply(current);
    Store.onChange(function (dirty) {
      if (dirty.settings) {
        current = dirty.settings;
        apply(current);
        syncControls();
      }
    });
  }

  function renderPanel() {
    const opts = Object.entries(WALLPAPERS)
      .map(function (kv) {
        return '<option value="' + kv[0] + '">' + kv[1].label + '</option>';
      })
      .join('');
    const cityOpts = BUILTIN_CITIES
      .map(function (c) {
        return '<option value="' + c + '"></option>';
      })
      .join('');

    panel.innerHTML =
      '<div class="settings-card">' +
      '  <div class="settings-header">' +
      '    <h2>设置</h2>' +
      '    <button class="close-btn" id="settingsClose" title="关闭">✕</button>' +
      '  </div>' +
      '  <div class="settings-body">' +
      '    <div class="setting-row">' +
      '      <label>默认搜索引擎</label>' +
      '      <select id="setEngine">' +
      Object.entries(ENGINES)
        .map(function (kv) {
          return '<option value="' + kv[0] + '">' + kv[1] + '</option>';
        })
        .join('') +
      '      </select>' +
      '    </div>' +
      '    <div class="setting-row">' +
      '      <label>天气城市</label>' +
      '      <input id="setCity" list="cityList" placeholder="如：南京" />' +
      '      <datalist id="cityList">' + cityOpts + '</datalist>' +
      '    </div>' +
      '    <div class="setting-row col">' +
      '      <label>壁纸</label>' +
      '      <select id="setWallpaper">' +
      '        <option value="__preset">— 预设渐变 —</option>' +
      opts +
      '        <option value="__url">在线图片 URL</option>' +
      '        <option value="__upload">上传本地图片</option>' +
      '      </select>' +
      '      <input id="setWallpaperUrl" class="hidden" placeholder="https://... 图片地址" />' +
      '      <input id="setWallpaperFile" class="hidden" type="file" accept="image/*" />' +
      '    </div>' +
      '    <div class="setting-row">' +
      '      <label>时钟字号</label>' +
      '      <select id="setClockSize">' +
      '        <option value="small">小</option>' +
      '        <option value="medium">中</option>' +
      '        <option value="large">大</option>' +
      '      </select>' +
      '    </div>' +
      '    <div class="setting-row col">' +
      '      <label>显示组件</label>' +
      '      <label class="chk"><input type="checkbox" data-w="weather" /> 天气</label>' +
      '      <label class="chk"><input type="checkbox" data-w="todo" /> 待办</label>' +
      '      <label class="chk"><input type="checkbox" data-w="notes" /> 笔记</label>' +
      '      <label class="chk"><input type="checkbox" data-w="countdown" /> 倒计时</label>' +
      '      <label class="chk"><input type="checkbox" data-w="quote" /> 每日一言</label>' +
      '    </div>' +
      '    <div class="setting-row">' +
      '      <button id="setResetQa" class="reset-btn" type="button">重置常用网址为默认</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    panel.querySelector('#settingsClose').addEventListener('click', close);
    panel.querySelector('#setEngine').addEventListener('change', function (e) {
      update({ searchEngine: e.target.value });
    });
    panel.querySelector('#setCity').addEventListener('change', function (e) {
      update({ weatherCity: e.target.value.trim() || '南京' });
    });
    panel.querySelector('#setClockSize').addEventListener('change', function (e) {
      update({ clockSize: e.target.value });
    });
    panel.querySelector('#setWallpaper').addEventListener('change', function (e) {
      const v = e.target.value;
      const urlInput = panel.querySelector('#setWallpaperUrl');
      const fileInput = panel.querySelector('#setWallpaperFile');
      urlInput.classList.add('hidden');
      fileInput.classList.add('hidden');
      fileInput.value = '';
      if (v === '__url') {
        urlInput.classList.remove('hidden');
      } else if (v === '__upload') {
        fileInput.classList.remove('hidden');
      } else if (WALLPAPERS[v]) {
        update({ wallpaper: { type: 'preset', value: v } });
      }
    });
    panel.querySelector('#setWallpaperUrl').addEventListener('change', function (e) {
      const url = e.target.value.trim();
      if (url) update({ wallpaper: { type: 'url', value: url } });
    });
    panel.querySelector('#setWallpaperFile').addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      compressImage(file, 1600, 0.82)
        .then(function (dataUrl) {
          update({ wallpaper: { type: 'upload', value: dataUrl } });
        })
        .catch(function () {
          alert('图片读取失败，请换一张试试');
        });
    });
    panel.querySelectorAll('.chk input').forEach(function (cb) {
      cb.addEventListener('change', function () {
        const vis = Object.assign({}, current.widgetVisibility);
        panel.querySelectorAll('.chk input').forEach(function (c) {
          vis[c.dataset.w] = c.checked;
        });
        update({ widgetVisibility: vis });
      });
    });
    panel.querySelector('#setResetQa').addEventListener('click', function () {
      if (window.QuickAccessWidget && QuickAccessWidget.resetToDefault) {
        if (window.confirm('确定把常用网址恢复为默认 9 个站点吗？当前自定义磁贴会被覆盖。')) {
          QuickAccessWidget.resetToDefault();
        }
      }
    });

    syncControls();
  }

  function syncControls() {
    if (!panel) return;
    panel.querySelector('#setEngine').value = current.searchEngine;
    panel.querySelector('#setCity').value = current.weatherCity;
    panel.querySelector('#setClockSize').value = current.clockSize;
    const wp = current.wallpaper || { type: 'preset', value: 'g1' };
    const sel = panel.querySelector('#setWallpaper');
    const urlInput = panel.querySelector('#setWallpaperUrl');
    const fileInput = panel.querySelector('#setWallpaperFile');
    urlInput.classList.add('hidden');
    fileInput.classList.add('hidden');
    if (wp.type === 'preset') {
      sel.value = wp.value;
    } else if (wp.type === 'url') {
      sel.value = '__url';
      urlInput.classList.remove('hidden');
      urlInput.value = wp.value;
    } else if (wp.type === 'upload') {
      sel.value = '__upload';
      fileInput.classList.remove('hidden');
    }
    panel.querySelectorAll('.chk input').forEach(function (c) {
      c.checked = !!(current.widgetVisibility && current.widgetVisibility[c.dataset.w]);
    });
  }

  function update(patch) {
    current = Object.assign({}, current, patch);
    Store.set({ settings: current });
    apply(current);
  }

  function apply(s) {
    applyWallpaper(s.wallpaper);
    applyVisibility(s.widgetVisibility);
    applyClockSize(s.clockSize);
  }

  function cssUrlSafe(v) {
    return String(v).replace(/["'()]/g, '');
  }

  function applyWallpaper(wp) {
    const body = document.body;
    if (!wp) {
      body.style.background = WALLPAPERS.g1.css;
      body.classList.remove('has-image');
      return;
    }
    if (wp.type === 'preset') {
      body.style.background = (WALLPAPERS[wp.value] && WALLPAPERS[wp.value].css) || WALLPAPERS.g1.css;
      body.classList.remove('has-image');
    } else if (wp.type === 'url') {
      body.style.background = 'url("' + cssUrlSafe(wp.value) + '") center / cover no-repeat fixed';
      body.classList.add('has-image');
    } else if (wp.type === 'upload') {
      body.style.background = 'url("' + cssUrlSafe(wp.value) + '") center / cover no-repeat fixed';
      body.classList.add('has-image');
    }
  }

  function cacheWidgetEls() {
    widgetEls = {};
    document.querySelectorAll('[data-widget]').forEach(function (el) {
      widgetEls[el.dataset.widget] = el;
    });
  }

  function applyVisibility(vis) {
    if (!vis) return;
    Object.keys(vis).forEach(function (k) {
      const el = widgetEls[k];
      if (el) el.classList.toggle('hidden', !vis[k]);
    });
  }

  function applyClockSize(size) {
    document.body.dataset.clockSize = size || 'medium';
  }

  function toggle() {
    if (panel.classList.contains('open')) close();
    else open();
  }
  function open() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
  }
  function close() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  /** 上传图片压缩为 JPEG base64，控制存储体积 */
  function compressImage(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        const img = new Image();
        img.onerror = reject;
        img.onload = function () {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (err) {
            reject(err);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  return {
    init: init,
    update: update,
    apply: apply,
    toggle: toggle,
    open: open,
    close: close,
    WALLPAPERS: WALLPAPERS,
    get current() {
      return current;
    }
  };
})();
