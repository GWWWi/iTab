/* ============================================================
   utils.js — 共享工具函数与单一数据源
   暴露 window.iTabUtils = { escapeHtml, hostOf, cities }
   - escapeHtml / hostOf：供各 widget 复用
   - cities：内置城市坐标表（天气解析 + 设置面板候选列表共用，
     避免多处硬编码导致不一致）
   ============================================================ */
window.iTabUtils = (function () {
  'use strict';

  /** 转义 HTML 特殊字符，防止注入 */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** 从 URL 提取域名；非法 URL 时原样返回 */
  function hostOf(url) {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return url;
    }
  }

  // 内置城市 -> [纬度, 经度]
  const CITIES = {
    北京: [39.9, 116.4], 上海: [31.23, 121.47], 广州: [23.13, 113.26],
    深圳: [22.54, 114.06], 南京: [32.06, 118.8], 杭州: [30.27, 120.15],
    成都: [30.57, 104.07], 武汉: [30.59, 114.3], 西安: [34.34, 108.94],
    重庆: [29.56, 106.55], 香港: [22.32, 114.17], 纽约: [40.71, -74.01],
    伦敦: [51.51, -0.13], 东京: [35.68, 139.69], 悉尼: [-33.87, 151.21]
  };

  return { escapeHtml: escapeHtml, hostOf: hostOf, cities: CITIES };
})();
