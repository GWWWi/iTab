/* ============================================================
   storage.js — 统一存储读写封装
   - 优先使用 chrome.storage.local（扩展环境）
   - 兜底使用 localStorage（直接双击打开 index.html 调试时）
   - 所有键统一加前缀 "itab."
   - 暴露全局 Storage：get / set / remove / onChange
   ============================================================ */
window.Store = (function () {
  'use strict';

  const PREFIX = 'itab.';
  const listeners = [];
  const hasChrome =
    typeof chrome !== 'undefined' &&
    chrome.storage &&
    chrome.storage.local &&
    typeof chrome.storage.local.get === 'function';

  function pkey(key) {
    return PREFIX + key;
  }

  /**
   * 读取配置；keys 为「默认值对象」，缺失的键用默认值填充。
   * @param {Object} defaults 形如 { key: defaultValue }
   * @param {Function} cb 回调返回合并后的值对象
   */
  function get(defaults, cb) {
    const keys = Object.keys(defaults);
    if (hasChrome) {
      chrome.storage.local.get(
        keys.map(pkey),
        function (items) {
          const out = {};
          keys.forEach(function (k) {
            const v = items[pkey(k)];
            out[k] = v === undefined ? defaults[k] : v;
          });
          cb(out);
        }
      );
    } else {
      const out = {};
      keys.forEach(function (k) {
        const raw = localStorage.getItem(pkey(k));
        out[k] = raw === null ? defaults[k] : safeParse(raw, defaults[k]);
      });
      cb(out);
    }
  }

  /**
   * 写入；obj 为 { key: value }，整体覆盖对应键。
   */
  function set(obj, cb) {
    if (hasChrome) {
      const o = {};
      Object.keys(obj).forEach(function (k) {
        o[pkey(k)] = obj[k];
      });
      chrome.storage.local.set(o, function () {
        if (cb) cb();
      });
    } else {
      Object.keys(obj).forEach(function (k) {
        localStorage.setItem(pkey(k), JSON.stringify(obj[k]));
      });
      if (cb) cb();
      fireListeners(obj);
    }
  }

  /** 删除键（字符串或数组） */
  function remove(keys, cb) {
    const arr = typeof keys === 'string' ? [keys] : keys;
    if (hasChrome) {
      chrome.storage.local.remove(
        arr.map(pkey),
        function () {
          if (cb) cb();
        }
      );
    } else {
      arr.forEach(function (k) {
        localStorage.removeItem(pkey(k));
      });
      if (cb) cb();
    }
  }

  /** 监听存储变化（跨页面/跨上下文即时同步设置） */
  function onChange(cb) {
    listeners.push(cb);
    if (hasChrome && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area !== 'local') return;
        const dirty = {};
        Object.keys(changes).forEach(function (ck) {
          if (ck.indexOf(PREFIX) === 0) {
            dirty[ck.slice(PREFIX.length)] = changes[ck].newValue;
          }
        });
        if (Object.keys(dirty).length) cb(dirty);
      });
    } else {
      window.addEventListener('storage', function (e) {
        if (e.key && e.key.indexOf(PREFIX) === 0) {
          const k = e.key.slice(PREFIX.length);
          let val = null;
          if (e.newValue !== null) {
            try {
              val = JSON.parse(e.newValue);
            } catch (_) {
              val = e.newValue;
            }
          }
          cb({ [k]: val });
        }
      });
    }
  }

  function safeParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function fireListeners(obj) {
    listeners.forEach(function (cb) {
      try {
        cb(obj);
      } catch (e) {
        /* 忽略单个监听回调异常 */
      }
    });
  }

  return {
    get: get,
    set: set,
    remove: remove,
    onChange: onChange,
    get isChrome() {
      return hasChrome;
    }
  };
})();
