# 異界旅人

Android App 與網頁版現在使用同一套 `qunlu-app/` 原始碼與同一套介面。

## CURRENT-1.124.0

- App 原始碼：`qunlu-app/`
- 網頁遊戲：`/game/`
- Web 建置模式：**1:1 App Mirror**
- 網頁版不再注入任何 WEB 2.0 專用 UI 或 CSS
- `index.html`、`runtime.js`、`game-data.js`、主要 CSS 皆以 SHA-256 測試確認與 App 原始碼完全一致
- 舊 `/play/` 已移除
- 根網址只負責清除舊 Service Worker / Cache 後導向 `/game/`

戰鬥倍率與立繪資料皆沿用 App：HP／MP／SP／攻防等核心絕對值 ×2；100 種戰鬥職業與目前 214 筆怪物完整綁定立繪。
