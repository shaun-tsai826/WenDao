# 前端環境建置教學（setup-frontend.md）

> 版本：v1.2（2026-11-02）
> 變更摘要：v1.2 新增第 7 節自動化測試（task 2.8）。
> v1.1 新增第 6 節 PocketBase 網址設定與套件版本（task 2.2）、補充 npm audit 說明。
> v1.0 初次建立（task 2.1）。說明 Quasar 專案怎麼建立、怎麼啟動、怎麼建置 PWA，附疑難排解。

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

## 6. PocketBase 網址設定（task 2.2）

前端用 `import.meta.env.VITE_POCKETBASE_URL` 取得 PocketBase 的網址，設定寫在 `quasar.config.ts` 的 `build.defineEnv`：

| 指令 | 值 | 原因 |
|---|---|---|
| `quasar dev`（開發） | `http://localhost:8090` | 前端在 9000 port、PocketBase 在 8090 port，兩個不同網址，要寫完整網址 |
| `quasar build`（正式） | `/` | 前端會放進 PocketBase 的 `pb_public`，畫面和 API 是同一個網址，相對路徑就夠了 |

> 正式環境用 `/` 的好處：不用把 Tailscale 主機名稱寫進 public repo，換網址也不用重新 build，也沒有跨網域（CORS）問題。

> Quasar 3 沒有 `build.env`，對應的設定是 `build.defineEnv`。它會把值放進 `import.meta.env.XXX`。

本專案使用的套件版本：

| 套件 | 版本 | 用途 |
|---|---|---|
| `pocketbase` | **0.28.1**（鎖定版本，對應 PocketBase 0.40.6） | 連線 PocketBase 的 JS SDK |
| `chart.js` | ^4.6.1 | 價格趨勢圖 |
| `fast-check` | ^4.10.2（devDependencies） | 屬性測試 |

```bash
npm install --save-exact pocketbase@0.28.1
npm install chart.js@4.6.1
npm install -D fast-check@4.10.2
```

## 7. 自動化測試（task 2.8）

```bash
cd ~/Projects/WenDao/frontend
npm test              # 全部跑一次（commit 前跑）
npm run test:watch    # 改檔案時自動重跑（開發時開著）
```

看到 `Tests  131 passed` 這類全部通過的訊息就代表 OK；有 `failed` 時，畫面會列出是哪一項、預期值和實際值。

| 工具 | 版本 | 用途 |
|---|---|---|
| Vitest | 5.0.5 | 測試框架（`describe` / `it` / `expect`） |
| fast-check | 4.10.2 | 屬性測試：自動產生大量隨機輸入，驗證「對任何輸入都成立」的規則 |
| @vue/test-utils | 2.5.1 | 在測試裡掛載 Vue 元件、找元素、檢查文字 |
| jsdom | 30.1.3 | 在 Node 裡模擬瀏覽器（DOM、localStorage） |
| @vitejs/plugin-vue | 6.0.10 | 讓測試讀得懂 `.vue` 檔 |

- 設定檔：`vitest.config.ts`（`@/` 別名、`.vue` 編譯、測試用的 PocketBase 網址、Quasar 改用 client 版本）。
- 測試檔放在被測程式旁邊的 `__tests__/` 資料夾，檔名 `*.test.ts`。商業邏輯（task 3）放 `src/composables/__tests__/`。
- 測試**不連真正的 PocketBase**：需要 client 的地方傳入假的 client（例如 `src/lib/__tests__/restoreAuth.test.ts`）。

目前的測試：

| 測試檔 | 驗證什麼 | 項目數 |
|---|---|---|
| `lib/__tests__/restoreAuth.test.ts` | 啟動時恢復登入（AC-1.7）：沒 token、過期、有效、401/403/404/500、連不上伺服器、其他錯誤 | 9 |
| `router/__tests__/authGuard.test.ts` | 12 條路由、未登入導向登入頁（AC-1.3）、已登入可進入、屬性測試（任意 id） | 28 |
| `stores/__tests__/stores.test.ts` | auth 與 SDK 同步、各 store 初始狀態與 getters、未實作 action 的錯誤訊息 | 13 |
| `constants/__tests__/messages.test.ts` | 39 則訊息與 design.md 一字不差、出現在 requirements.md、數量、不重複 | 75 |
| `layouts/__tests__/MainLayout.test.ts` | 使用者名稱、頭像、登出按鈕（AC-1.5）、導覽列 4 項與目前頁 | 6 |

> `messages.test.ts` 會讀規格文件：之後改了 design.md 的訊息文字卻沒同步改 `messages.ts`，測試就會失敗提醒你。

## 疑難排解

| 狀況 | 原因 | 處理方式 |
|---|---|---|
| `quasar: command not found` | 沒有全域安裝 Quasar CLI | 改用 `npx quasar ...`，或用 `npm run dev` / `npm run build` |
| 建置 PWA 時找不到 `workbox-build` | 沒有安裝 `src-pwa/` 的套件 | `cd src-pwa && npm install` |
| `Port 9000 is already in use` | 已經有一個 dev server 在跑 | 關掉另一個，或加 `--port 9100` 換一個 port |
| 手機上看不到「加到主畫面」 | service worker 只能在 HTTPS 或 localhost 下運作 | 正式環境要透過 `tailscale serve` 提供 HTTPS（task 13.1） |
| 測試出現 `The SSR server build was installed without an ssrContext` | 測試沒有用到 Quasar 的瀏覽器版本 | 確認 `vitest.config.ts` 的 alias 有 `/^quasar$/ → quasar/dist/quasar.client.js` |
| `npm audit` 顯示十幾個 moderate 漏洞 | 都在 ESLint 相關的**開發工具**裡（minimatch），不會打包進 App | 用 `npm audit --omit=dev` 檢查正式會用到的套件（應為 0）。不要執行 `npm audit fix --force`，它會把 ESLint 降到很舊的版本 |
| 安裝時出現 `npm warn install-scripts` | npm 11 預設不執行套件的安裝腳本（`@parcel/watcher`、`fsevents`） | 目前不影響開發與建置，不用處理 |
| 改了 manifest，手機上卻沒變 | 舊的 service worker 還在快取舊檔案 | 瀏覽器開發者工具 → Application → Service Workers → Unregister，再重新整理 |
