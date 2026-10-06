# 異界旅人

《異界旅人》Android App 與 WEB 2.0 共用同一套遊戲核心資料，但網頁版使用獨立介面。

## CURRENT-1.122.0

- Android App 核心來源：`qunlu-app/`
- 新網頁遊戲：GitHub Pages `/game/`
- 舊網頁遊戲 `/play/`：已從部署產物移除
- 根網址：只負責清除舊 Service Worker / Cache 並導向 `/game/`
- WEB 2.0：獨立 UI，不再使用舊「旅途未竟，群陸在前」首頁版型
- 戰鬥核心：HP、MP、SP、攻擊、魔攻、防禦、魔防等絕對值 ×2；機率與百分比型數值維持原比例
- 立繪資料庫：100 種職業、目前 214 筆怪物完整綁定立繪

## 建置

```sh
npm install
npm run test:qunlu-app
npm run prepare:web
npm run test:qunlu-bundle
```

Android：

```sh
npm run prepare:android
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```
