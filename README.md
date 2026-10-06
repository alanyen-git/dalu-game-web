# 異界旅人

目前 Android App 與網頁版使用同一套 `qunlu-app/` 原始碼與介面。

## CURRENT-1.126.0

- App 原始碼：`qunlu-app/`
- 新網頁遊戲入口：`/app/`
- 舊 `/game/`、`/play/`：不再部署
- Web：直接完整複製 App 原始碼，不進行 UI 轉換
- 頁首不含 NEW WEB / APP同步版
- 進入遊戲後使用 App 的柳橋鎮 town-home：世界地圖、設定、當地地圖
- 根網址只負責移除舊 Service Worker / Cache 後導向 `/app/`
