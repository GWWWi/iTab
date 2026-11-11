# iTab 新标签页（Edge / Chrome 扩展克隆版）

一个用**纯 HTML / CSS / JavaScript**（原生、无框架、无打包）实现的「类 iTab」新标签页扩展（Manifest V3）。解压即可在 Edge / Chrome 中加载运行，无需任何构建步骤。

## 在 Edge 中加载

1. 打开 Edge，地址栏输入 `edge://extensions` 并回车。
2. 打开左侧「**开发者模式**」开关。
3. 点击「**加载解压缩的扩展**」。
4. 选择本项目所在的 `iTab` 目录。
5. 打开新标签页（Ctrl+T），即可看到自定义仪表盘。

> Chrome 用户同理：地址栏输入 `chrome://extensions`，开启开发者模式后「加载解压缩的扩展」，选择本目录。

## 功能列表

- **搜索框**（顶部居中）：支持 百度 / Google / Bing 切换，回车在新标签打开搜索结果；聚焦高亮。
- **大时钟 + 日期**（居中大字）：每秒刷新，显示时间与中文星期/日期。
- **天气 widget**：Open-Meteo 免费接口（无需 Key），默认南京；设置可改城市（内置常用城市，未知城市自动地理解析）；显示温度 / 湿度 / 风速与天气图标 + 中文描述。
- **常用网址磁贴**：默认国内常用站点；点击在新标签打开；hover 出现「编辑 / 删除」；「+ 添加」弹窗（名称 + URL，自动取域名 favicon）；支持 **HTML5 拖拽排序**（顺序持久化）；首次加载写入默认列表。
- **待办 widget**：增删、勾选完成（删除线），存 storage。
- **笔记 widget**：一个 textarea，自动保存（防抖）到 storage。
- **倒计时 widget**：设置目标事件名 + 日期，实时显示「距 XX 还有 N 天/时/分/秒」，可删除。
- **每日一言**：调用 `https://v1.hitokoto.cn/`，失败兜底本地内置名言。
- **壁纸背景**：多套预设渐变；支持「上传本地图片」（前端压缩到最大边长 1600px 后存为 base64）或「在线图片 URL」；应用于 body。
- **设置面板**（右上角齿轮）：搜索引擎、天气城市、壁纸（预设 / 上传 / 在线 URL）、组件显隐开关、时钟字号；全部即时生效并持久化。

## 数据存储

- 扩展环境使用 `chrome.storage.local`，所有键统一加前缀 `itab.`。
- 非扩展环境（直接双击打开 `index.html` 调试）自动回退到 `localStorage`，不会崩溃。

## 图标缓存

常用网址的 favicon 采用「按域名持久缓存 + 缓存优先」策略：

- 首次加载某站点图标时，通过 `<img>` 依次尝试 Google → DuckDuckGo → 站点名首字母徽标（`<img>` 不依赖跨域权限即可显示）。
- 成功从 Google / DuckDuckGo 加载的图标，会在后台 `fetch`（依赖 manifest 的 `host_permissions`）转成 base64，持久化到存储，键为 `itab.icon.<域名>`。
- 之后打开新标签页时，命中缓存的图标直接以 base64 显示，**零网络请求、秒开**；加载失败的域名记录为 `FAIL`，直接显示首字母徽标，避免反复无效请求。
- 缓存存于 `chrome.storage.local`（调试环境回退 `localStorage`）；清除站点数据或浏览器缓存后会按需重新拉取。

## 文件结构

```
iTab/
├── manifest.json              # MV3 清单，newtab 覆盖
├── index.html                 # 入口页面
├── css/style.css              # 全部样式（毛玻璃/圆角/柔和阴影）
├── js/
│   ├── storage.js             # 统一存储封装（chrome.storage / localStorage 兜底）
│   ├── utils.js               # 共享工具（escapeHtml / hostOf）+ 单一数据源（内置城市坐标）
│   ├── settings.js            # 设置面板
│   ├── app.js                 # 入口装配
│   └── widgets/
│       ├── clock.js           # 时钟
│       ├── search.js          # 搜索
│       ├── weather.js         # 天气
│       ├── quickaccess.js     # 常用网址
│       ├── todo.js            # 待办
│       ├── notes.js           # 笔记
│       ├── countdown.js       # 倒计时
│       └── quote.js           # 每日一言
├── assets/                    # 图标 png
└── README.md
```

## 代码约定

- **单一数据源**：内置城市坐标表统一维护在 `js/utils.js` 的 `iTabUtils.cities` 中，`weather.js`（天气解析）与 `settings.js`（设置候选列表）均从这里取用，新增城市只需改一处。
- **共享工具**：HTML 转义统一用 `iTabUtils.escapeHtml`，域名提取用 `iTabUtils.hostOf`，各 widget 不再各自实现。
- 脚本按依赖顺序在 `index.html` 底部加载（`utils.js` 在 `settings.js` 及各 widget 之前），无构建、无模块打包，可直接双击 `index.html` 调试。

## 注意事项

- 天气、每日一言、favicon 依赖联网；离线时相关组件会显示兜底内容或加载失败提示。
- favicon 使用 Google / DuckDuckGo 公共服务，个别站点可能无图标。
- 上传壁纸以 base64 存入 storage，已在浏览器端压缩以控制体积；超大原图仍可能占用较多存储配额。
- 修改 `manifest.json`（如新增 `host_permissions`）后，需到 `chrome://extensions` / `edge://extensions` 点击扩展的「刷新」按钮重新加载，权限变更才会生效。
- 本扩展为「功能级忠实复刻」，仅用于学习与个人使用，并非 iTab 官方产品。
