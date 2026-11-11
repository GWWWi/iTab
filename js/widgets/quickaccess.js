/* ============================================================
   quickaccess.js — 常用网址磁贴
   暴露 window.QuickAccessWidget.{ initQuickAccess, resetToDefault }
   - 默认常用站点，点击在新标签打开
   - hover 出现 编辑/删除；「+ 添加」弹窗（名称+URL，自动取 favicon）
   - HTML5 拖拽排序，顺序持久化到 storage
   - 图标按域名持久缓存（Store 键 icon.<host>，值 base64 dataURL 或 'FAIL'）：
     命中缓存则零网络秒显；未缓存走 Google→DuckDuckGo→首字母，
     成功后后台 fetch 转 base64 持久化，供下次秒开。
   ============================================================ */
window.QuickAccessWidget = (function () {
  'use strict';

  const escapeHtml = window.iTabUtils.escapeHtml;
  const hostOf = window.iTabUtils.hostOf;

  const TRANSPARENT = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  const ICON_PREFIX = 'icon.';

  // 首字母徽标配色（按站点名 hash 取 8 个柔和色之一）
  const LETTER_COLORS = [
    ['#e3f2fd', '#1565c0'],
    ['#fce4ec', '#c2185b'],
    ['#e8f5e9', '#2e7d32'],
    ['#fff3e0', '#e65100'],
    ['#f3e5f5', '#6a1b9a'],
    ['#e0f7fa', '#00838f'],
    ['#fff9c4', '#f57f17'],
    ['#efebe9', '#5d4037']
  ];

  function favicon(url) {
    const host = hostOf(url);
    return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(host) + '&sz=64';
  }

  function normalizeUrl(url) {
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
  }

  function letterStyle(name) {
    const s = String(name || '?');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const c = LETTER_COLORS[h % LETTER_COLORS.length];
    return 'background:' + c[0] + ';color:' + c[1] + ';';
  }

  function iconKey(host) {
    return ICON_PREFIX + host;
  }

  let currentDefaults = [];
  // Store 持久缓存的内存镜像：host -> base64 dataURL | 'FAIL'
  const iconCache = Object.create(null);
  // 缓存条目上限：每个图标是 base64 图片，无上限时常用网址一多就会撞上
  // chrome.storage.local 配额，届时**所有**写入（含设置、待办）都会失败。
  const ICON_CACHE_LIMIT = 120;
  const iconOrder = [];   // 插入顺序，用于淘汰最早的一条

  function setIconCache(host, value) {
    if (!(host in iconCache)) iconOrder.push(host);
    iconCache[host] = value;
    const o = {};
    o[iconKey(host)] = value;
    Store.set(o);
    // 超出上限时淘汰最早的条目（内存与持久层同步删除）
    while (iconOrder.length > ICON_CACHE_LIMIT) {
      const oldest = iconOrder.shift();
      if (oldest === host) {
        // 当前这条刚写入，不能被自己淘汰：放回队尾继续找下一条
        iconOrder.push(oldest);
        break;
      }
      if (!oldest) continue;
      delete iconCache[oldest];
      Store.remove(iconKey(oldest));
    }
  }

  // 后台把成功加载的图标转 base64 持久化；失败静默，不影响主流程
  function cacheIconFromUrl(host, url) {
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('fetch failed');
        return r.blob();
      })
      .then(function (blob) {
        return new Promise(function (resolve, reject) {
          const fr = new FileReader();
          fr.onload = function () { resolve(fr.result); };
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
      })
      .then(function (dataUrl) {
        setIconCache(host, dataUrl);
      })
      .catch(function () {
        /* 缓存失败忽略，不影响显示，下次仍会尝试 */
      });
  }

  // 未缓存图标的加载链路：Google → DuckDuckGo → 首字母
  function wireIcon(tile, imgEl, host) {
    let triedFallback = false;
    imgEl.addEventListener('load', function () {
      tile.classList.add('loaded');
      cacheIconFromUrl(host, imgEl.currentSrc || imgEl.src);
    });
    imgEl.addEventListener('error', function () {
      if (!triedFallback) {
        triedFallback = true;
        imgEl.src = 'https://icons.duckduckgo.com/ip3/' + host + '.ico';
      } else {
        setIconCache(host, 'FAIL');
        tile.classList.add('no-icon');
      }
    });
  }

  function initQuickAccess(root, defaults) {
    currentDefaults = defaults || [];
    root.innerHTML =
      '<div class="widget-header"><h3>常用网址</h3></div>' +
      '<div class="qa-grid" id="qaGrid"></div>' +
      '<button class="qa-add" id="qaAdd">+ 添加</button>';

    const grid = root.querySelector('#qaGrid');
    const addBtn = root.querySelector('#qaAdd');

    // 为尚未入内存镜像的 host 一次性读取 Store 持久缓存，再渲染
    function refreshIconCache(items, cb) {
      const need = {};
      (items || []).forEach(function (it) {
        const h = hostOf(it.url);
        if (!(h in iconCache)) need[iconKey(h)] = null;
      });
      const keys = Object.keys(need);
      if (!keys.length) {
        cb();
        return;
      }
      Store.get(need, function (data) {
        keys.forEach(function (k) {
          const v = data[k];
          if (v) iconCache[k.slice(ICON_PREFIX.length)] = v;
        });
        cb();
      });
    }

    function render(items) {
      grid.innerHTML = '';
      (items || []).forEach(function (item, index) {
        const host = hostOf(item.url);
        const cached = iconCache[host];
        const hasIcon = !!cached && cached !== 'FAIL';
        const isFail = cached === 'FAIL';

        const tile = document.createElement('div');
        tile.className = 'qa-tile' + (hasIcon ? ' loaded' : '') + (isFail ? ' no-icon' : '');
        tile.draggable = true;
        tile.dataset.index = String(index);
        const imgSrc = hasIcon ? cached : (isFail ? TRANSPARENT : favicon(item.url));
        tile.innerHTML =
          '<div class="qa-actions">' +
          '  <button class="qa-edit" title="编辑">✎</button>' +
          '  <button class="qa-del" title="删除">🗑</button>' +
          '</div>' +
          '<div class="qa-iconbox">' +
          '  <div class="qa-letter" style="' + letterStyle(item.name) + '">' +
          escapeHtml((item.name || '?').trim().charAt(0).toUpperCase()) + '</div>' +
          '  <img class="qa-icon" src="' + imgSrc + '" alt="" loading="lazy" />' +
          '</div>' +
          '<div class="qa-name">' + escapeHtml(item.name) + '</div>';

        tile.addEventListener('click', function () {
          window.open(item.url, '_blank', 'noopener');
        });
        tile.querySelector('.qa-edit').addEventListener('click', function (e) {
          e.stopPropagation();
          editItem(index);
        });
        tile.querySelector('.qa-del').addEventListener('click', function (e) {
          e.stopPropagation();
          deleteItem(index);
        });

        // 拖拽排序
        tile.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/plain', String(index));
          tile.classList.add('dragging');
        });
        tile.addEventListener('dragend', function () {
          tile.classList.remove('dragging');
        });
        tile.addEventListener('dragover', function (e) {
          e.preventDefault();
        });
        tile.addEventListener('drop', function (e) {
          e.preventDefault();
          const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
          const to = index;
          if (isNaN(from) || from === to) return;
          moveItem(from, to);
        });

        // 仅未缓存的图标才走 Google→DuckDuckGo→首字母 链路
        if (!hasIcon && !isFail) {
          wireIcon(tile, tile.querySelector('.qa-icon'), host);
        }

        grid.appendChild(tile);
      });
    }

    function loadAndRender() {
      Store.get({ quickaccess: defaults || [] }, function (data) {
        const items = data.quickaccess || [];
        refreshIconCache(items, function () {
          render(items);
        });
      });
    }

    function moveItem(from, to) {
      if (isNaN(from) || isNaN(to) || from < 0 || to < 0) return;
      Store.get({ quickaccess: defaults || [] }, function (data) {
        const items = data.quickaccess || [];
        if (from >= items.length || to >= items.length) return;
        const moved = items.splice(from, 1)[0];
        const target = from < to ? to - 1 : to;
        items.splice(target, 0, moved);
        Store.set({ quickaccess: items });
        render(items);
      });
    }

    function deleteItem(index) {
      Store.get({ quickaccess: defaults || [] }, function (data) {
        const items = data.quickaccess || [];
        items.splice(index, 1);
        Store.set({ quickaccess: items });
        render(items);
      });
    }

    function editItem(index) {
      Store.get({ quickaccess: defaults || [] }, function (data) {
        const items = data.quickaccess || [];
        const it = items[index];
        openModal('编辑网址', it.name, it.url, function (name, url) {
          items[index] = { name: name, url: normalizeUrl(url) };
          Store.set({ quickaccess: items });
          render(items);
        });
      });
    }

    addBtn.addEventListener('click', function () {
      openModal('添加网址', '', '', function (name, url) {
        Store.get({ quickaccess: defaults || [] }, function (data) {
          const items = data.quickaccess || [];
          items.push({ name: name, url: normalizeUrl(url) });
          Store.set({ quickaccess: items });
          render(items);
        });
      });
    });

    function openModal(title, name, url, onConfirm) {
      const modalRoot = document.getElementById('modalRoot');
      modalRoot.innerHTML =
        '<div class="modal-mask">' +
        '  <div class="modal-box">' +
        '    <h3>' + escapeHtml(title) + '</h3>' +
        '    <label>名称</label>' +
        '    <input id="mName" value="' + escapeHtml(name) + '" placeholder="如：百度" />' +
        '    <label>网址</label>' +
        '    <input id="mUrl" value="' + escapeHtml(url) + '" placeholder="https://..." />' +
        '    <div class="modal-actions">' +
        '      <button id="mCancel">取消</button>' +
        '      <button id="mOk" class="primary">确定</button>' +
        '    </div>' +
        '  </div>' +
        '</div>';
      const mask = modalRoot.querySelector('.modal-mask');
      const nameI = modalRoot.querySelector('#mName');
      const urlI = modalRoot.querySelector('#mUrl');
      modalRoot.querySelector('#mCancel').addEventListener('click', function () {
        modalRoot.innerHTML = '';
      });
      mask.addEventListener('click', function (e) {
        if (e.target === mask) modalRoot.innerHTML = '';
      });
      modalRoot.querySelector('#mOk').addEventListener('click', function () {
        const n = nameI.value.trim();
        const u = urlI.value.trim();
        if (!n || !u) {
          alert('请填写名称和网址');
          return;
        }
        onConfirm(n, u);
        modalRoot.innerHTML = '';
      });
      setTimeout(function () {
        nameI.focus();
      }, 50);
    }

    loadAndRender();
    Store.onChange(function (dirty) {
      if (dirty.quickaccess) {
        refreshIconCache(dirty.quickaccess, function () {
          render(dirty.quickaccess);
        });
      }
    });
  }

  // 恢复出厂默认常用网址（模块级：供设置面板调用；写入后由 onChange 触发重渲染）
  function resetToDefault() {
    const list = (window.ITAB_DEFAULT_SITES || currentDefaults || []).slice();
    Store.set({ quickaccess: list });
  }

  return { initQuickAccess: initQuickAccess, resetToDefault: resetToDefault };
})();
