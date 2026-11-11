/* ============================================================
   weather.js — 天气 widget（Open-Meteo 免费接口，无需 Key）
   暴露 window.WeatherWidget.initWeather(root, settings)
   - 默认南京，设置可改城市（内置常用城市，未知城市自动地理解析）
   - 显示 温度 / 湿度 / 风速 / 天气图标+中文描述
   ============================================================ */
window.WeatherWidget = (function () {
  'use strict';

  const escapeHtml = window.iTabUtils.escapeHtml;
  const CITIES = window.iTabUtils.cities;

  // WMO 天气代码 -> [中文描述, emoji]
  const WMO = {
    0: ['晴', '☀️'], 1: ['大致晴朗', '🌤️'], 2: ['局部多云', '⛅'], 3: ['阴', '☁️'],
    45: ['雾', '🌫️'], 48: ['雾凇', '🌫️'],
    51: ['毛毛雨', '🌦️'], 53: ['毛毛雨', '🌦️'], 55: ['毛毛雨', '🌦️'],
    56: ['冻毛毛雨', '🌧️'], 57: ['冻毛毛雨', '🌧️'],
    61: ['小雨', '🌧️'], 63: ['中雨', '🌧️'], 65: ['大雨', '🌧️'],
    66: ['冻雨', '🌧️'], 67: ['冻雨', '🌧️'],
    71: ['小雪', '🌨️'], 73: ['中雪', '🌨️'], 75: ['大雪', '🌨️'], 77: ['雪粒', '🌨️'],
    80: ['阵雨', '🌦️'], 81: ['阵雨', '🌦️'], 82: ['强阵雨', '🌦️'],
    85: ['阵雪', '🌨️'], 86: ['阵雪', '🌨️'],
    95: ['雷阵雨', '⛈️'], 96: ['雷阵雨伴冰雹', '⛈️'], 99: ['雷阵雨伴冰雹', '⛈️']
  };

  function wmo(code) {
    return WMO[code] || ['未知', '🌡️'];
  }

  // 城市名 -> 经纬度（内置优先，否则调地理解析接口）
  async function resolveCity(name) {
    if (CITIES[name]) return { lat: CITIES[name][0], lon: CITIES[name][1] };
    const url =
      'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(name) +
      '&count=1&language=zh&format=json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('geo failed');
    const data = await res.json();
    if (data.results && data.results[0]) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    }
    throw new Error('city not found');
  }

  function initWeather(root, settings) {
    root.innerHTML =
      '<div class="widget-header"><h3>天气</h3>' +
      '<button class="refresh-btn" id="weatherRefresh" title="刷新">⟳</button></div>' +
      '<div id="weatherContent" class="weather-content"></div>' +
      '<div id="weatherStatus" class="weather-status">加载中...</div>';

    const content = root.querySelector('#weatherContent');
    const status = root.querySelector('#weatherStatus');
    const refresh = root.querySelector('#weatherRefresh');

    let lastCity = null;

    async function doLoad() {
      const cityName = (Settings.current && Settings.current.weatherCity) || settings.weatherCity || '南京';
      if (cityName === lastCity) return; // 避免非城市变更触发重复请求
      lastCity = cityName;
      try {
        status.textContent = '加载中...';
        status.classList.remove('hidden');
        const coord = await resolveCity(cityName);
        const api =
          'https://api.open-meteo.com/v1/forecast?latitude=' + coord.lat +
          '&longitude=' + coord.lon +
          '&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m';
        const res = await fetch(api);
        if (!res.ok) throw new Error('api failed');
        const data = await res.json();
        const cur = data.current;
        const desc = wmo(cur.weather_code);
        content.innerHTML =
          '<div class="weather-main">' +
          '  <div class="weather-icon">' + desc[1] + '</div>' +
          '  <div class="weather-temp">' + Math.round(cur.temperature_2m) + '°</div>' +
          '</div>' +
          '<div class="weather-desc">' + desc[0] + '</div>' +
          '<div class="weather-meta">' +
          '  <span>💧 湿度 ' + Math.round(cur.relative_humidity_2m) + '%</span>' +
          '  <span>🌬️ 风速 ' + Math.round(cur.wind_speed_10m) + ' km/h</span>' +
          '</div>' +
          '<div class="weather-city">📍 ' + escapeHtml(cityName) + '</div>';
        status.classList.add('hidden');
      } catch (err) {
        content.innerHTML = '';
        status.textContent = '天气加载失败（请检查网络）';
        status.classList.remove('hidden');
      }
    }

    refresh.addEventListener('click', function () {
      lastCity = null;
      doLoad();
    });
    doLoad();
    Store.onChange(function (dirty) {
      if (dirty.settings && dirty.settings.weatherCity) doLoad();
    });
    setInterval(function () {
      lastCity = null;
      doLoad();
    }, 10 * 60 * 1000);
  }

  return { initWeather: initWeather };
})();
