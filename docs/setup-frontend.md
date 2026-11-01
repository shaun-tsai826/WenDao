# 前端環境建置教學（setup-frontend.md）

> 版本：v1.0（2026-11-01）
> 變更摘要：初次建立（task 2.1）。說明 Quasar 專案怎麼建立、怎麼啟動、怎麼建置 PWA，附疑難排解。

## 這是什麼？

前端就是「使用者看到、點到的畫面」。本專案用 **Quasar**：它是建在 Vue 3 上的框架，按鈕、表格、對話框這些元件都現成做好了，還能一鍵打包成 **PWA**。

**PWA**（Progressive Web App）是「可以裝到手機主畫面的網頁」。打開時像一個 App，沒有網址列。

| 項目 | 版本 |
|---|---|
| Node.js（用 nvm 安裝） | 26.10.0（Quasar 支援 20.20+ / 22.22+ / 24 / 26 / 28 / 30） |
| create-quasar（建立專案的工具） | 5.0.35 |
| quasar | 2.35.2 |
| @quasar/app-vite | 3.10.3 |

## 1. 換到另一台電腦時（最常用）

專案已經建好並放進 git，所以**不需要重新建立**，只要安裝套件：

```bash
cd ~/Projects/WenDao/frontend
npm install
cd src-pwa && npm install && cd ..
```

> `node_modules/`、`dist/`、`.quasar/` 不會進 git，每台電腦各自用 `npm install` 產生。

## 2. 啟動開發伺服器

```bash
cd ~/Projects/WenDao/frontend
npx quasar dev -m pwa
```

- 瀏覽器會自動打開 `http://localhost:9000`，改程式碼後畫面會自動更新。
- 停止服務：在這個終端機視窗按 `Ctrl + C`。
- 只想用一般網頁模式（不含 PWA）的話，用 `npm run dev`。

## 3. 檢查與建置

```bash
npm run lint:check   # 檢查程式碼風格（ESLint + Prettier）
npm run lint         # 自動修正排版
npm run typecheck    # TypeScript 型別檢查
npx quasar build -m pwa
```

建置結果會放在 `dist/pwa/`，裡面有 `manifest.json`（App 名稱、圖示）和 `sw.js`（service worker，負責離線快取）。

## 4. 這個專案當初是怎麼建立的（task 2.1，只需要做一次）

所有問題的答案都用參數一次帶入，不需要互動回答：

```bash
cd ~/Projects/WenDao
npm init -y quasar@5.0.35 frontend -- \
  --template app \
  --preset typescript --preset sass --preset eslint --preset pinia \
  --name wendao-frontend --product "家庭ERP" \
  --no-git --install --defaults

cd frontend
npx quasar mode add pwa
```

| 參數 | 意思 |
|---|---|
| `--preset typescript` | 使用 TypeScript |
| `--preset sass` | 使用 Sass 寫樣式 |
| `--preset eslint` | ESLint + Prettier 檢查與排版（使用者選擇） |
| `--preset pinia` | 啟用 Pinia 狀態管理（Vue Router 是內建的，不用另外選） |
| 沒有加 `--preset fbr` | 路由手動寫在 `src/router/routes.ts`（task 2.4） |
| `--no-git` | **不要另外 git init**。`frontend/` 已經在 WenDao repo 裡，再 init 一次會變成 repo 裡面又有 repo |
| `--defaults` | 其他沒指定的選項都用預設值 |

建立完成後，又手動調整了下面這些地方：

1. `package.json`：`author` 拿掉 email（從 git 設定自動帶入的），`description` 改成「家庭用品管理系統」。
2. `src-pwa/manifest.json`：依 design.md 加上 `name`、`short_name`、`description`；刪除 `display_override`，因為規格指定 `standalone`，`fullscreen` 會連手機狀態列都蓋掉。
3. 刪除 `.vscode/mcp.json`：它會用 `@quasar/mcp@latest` 自動啟動 MCP server，沒有鎖定版本，使用者也用不到（使用者決定刪除）。
4. App 圖示暫時使用 Quasar 預設圖示（`public/icons/`）。之後換成正式圖示時，只要用同樣的檔名覆蓋這些圖檔，不用改程式。

## 5. 資料夾說明

```
frontend/
├── quasar.config.ts      Quasar 主設定（含 pwa.workboxMode: 'GenerateSW'）
├── src/                  畫面與程式（router、stores、pages、layouts…）
├── src-pwa/
│   ├── manifest.json     PWA 名稱、顏色、圖示
│   ├── register-sw.ts    註冊 service worker
│   └── package.json      PWA 專用套件（workbox），要另外 npm install
└── public/icons/         App 圖示
```

## 疑難排解

| 狀況 | 原因 | 處理方式 |
|---|---|---|
| `quasar: command not found` | 沒有全域安裝 Quasar CLI | 改用 `npx quasar ...`，或用 `npm run dev` / `npm run build` |
| 建置 PWA 時找不到 `workbox-build` | 沒有安裝 `src-pwa/` 的套件 | `cd src-pwa && npm install` |
| `Port 9000 is already in use` | 已經有一個 dev server 在跑 | 關掉另一個，或加 `--port 9100` 換一個 port |
| 手機上看不到「加到主畫面」 | service worker 只能在 HTTPS 或 localhost 下運作 | 正式環境要透過 `tailscale serve` 提供 HTTPS（task 13.1） |
| 改了 manifest，手機上卻沒變 | 舊的 service worker 還在快取舊檔案 | 瀏覽器開發者工具 → Application → Service Workers → Unregister，再重新整理 |
