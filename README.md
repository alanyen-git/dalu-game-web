# 異界旅人

《異界旅人》是手機優先的單人回合制 RPG，Android App 與網頁版共用 `qunlu-app/` 同一套遊戲來源。

## 正式建置來源

- 遊戲名稱：異界旅人
- App／Web 共用來源：`qunlu-app/`
- Android：Capacitor 封裝 `www/`
- Web：GitHub Pages 部署 `www/`
- PWA：支援離線快取與本機存檔
- 舊版根目錄網頁遊戲已移除，不再參與任何建置或部署

## CURRENT-1.120.0

- HP、MP、SP、攻擊、魔攻、防禦、魔防等核心絕對戰鬥數值提高 100%。
- 敵方、隊友、寵物、召喚獸與固定技能消耗／治療／道具傷害同步等比例調整。
- 命中、閃避、爆擊率、格擋率、抗性、速度、破甲、射程等比例或機率型數值維持原值。
- 100 種戰鬥職業與目前 214 筆怪物資料皆綁定獨立立繪資料。
- 新網頁版每次部署前會先刪除舊 `www/` 產物，再由目前 App 原始碼乾淨重建。

## 建置

```sh
npm install
npm run test:qunlu-app
npm run prepare:web
npm run test:qunlu-bundle
```

Android debug APK：

```sh
npm run prepare:android
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```
