# 前端環境建置教學（setup-frontend.md）

> 版本：v2.1（2026-11-05）
> 變更摘要：v2.1 第 8 節：e2e 改為自動判定（e2e/check.mjs），新增「怎麼看結果」與「寫新腳本」。
> v2.0 變更摘要：v2.0 App 更名「溫叨Pantry」→「溫叨@Pantry」（使用者決定）：第 4 節的 --product 與說明更新。
> v1.9 新增第 9 節「在手機上測試（家裡 Wi-Fi）」與相關疑難排解；第 8 節 e2e 腳本清單更新。
> v1.8 App 更名為「溫叨Pantry」：第 4 節的 --product 改為新名稱，並註明當初用的是舊名稱。
> v1.7 新增 e2e 驗證（frontend/e2e/run.sh）。
> v1.6 測試改用 @quasar/vite-plugin 載入真正的 Quasar 元件、新增 setup 檔；e2e 要用真實滑鼠鍵盤事件。
> v1.5 測試清單更新到 task 6.6（287 項）；說明測試工具 fakePocketBase / mountPage。
> v1.4 測試清單更新到 task 5.5（207 項）。
> v1.3 測試清單更新到 task 5.3（200 項）；vitest 加上 #q-app 別名。
> v1.2 新增第 7 節自動化測試（task 2.8）。
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
  --name wendao-frontend --product "溫叨@Pantry" \
  --no-git --install --defaults

cd frontend
npx quasar mode add pwa
```

> 2026-11-01 建立時用的是舊名稱「家庭ERP」，2026-11-03 先改名為「溫叨Pantry」，同日再改為「溫叨@Pantry」（`package.json` 的 `productName`、`src-pwa/manifest.json` 的 `name` / `short_name`）。畫面上的名稱集中在 `src/constants/app.ts`。

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

- 設定檔：`vitest.config.ts`（`@/` 別名、`.vue` 編譯、測試用的 PocketBase 網址、Quasar 改用 client 版本、`#q-app` 指向 Quasar 官方實作）。
- 測試檔放在被測程式旁邊的 `__tests__/` 資料夾，檔名 `*.test.ts`。商業邏輯（task 3）放 `src/composables/__tests__/`。
- 測試**不連真正的 PocketBase**：需要 client 的地方傳入假的 client（例如 `src/lib/__tests__/restoreAuth.test.ts`）；store 與頁面測試用 `src/test-utils/fakePocketBase.ts`（記憶體假資料庫，模擬 UNIQUE、Restrict、連線錯誤）。
- 頁面測試用 `src/test-utils/mountPage.ts` 掛載（Pinia、路由、Quasar 與 Notify / Dialog），頁面會放在 QLayout 裡（和真正的 App 一樣）。
- `vitest.config.ts` 加了 `@quasar/vite-plugin`（和正式 build 一樣自動載入 `<q-dialog>` 等元件）。**少了它，Quasar 元件在測試裡只是沒有功能的普通標籤**，對話框之類的問題測不出來。
- `src/test-utils/setup.ts`：補上 jsdom 沒有的 `ResizeObserver`（QLayout 需要）。
- 假資料庫**不會模擬 SDK 本身的行為**（例如自動取消請求），所以重要流程仍要用無頭 Chrome 對正式 build 做 e2e 驗證。
- e2e 要用**真正的滑鼠與鍵盤事件**（Chrome DevTools Protocol 的 `Input.dispatchMouseEvent`、`Input.insertText`），不要用程式直接 `el.click()` 或改 `value`：後者會繞過點擊穿透、焦點等真實行為（task 6.5 面板「一點就關閉」就是這樣漏掉的）。

目前的測試：

| 測試檔（`src/` 底下） | 驗證什麼 | 項目數 |
|---|---|---|
| `boot/__tests__/pocketbase.test.ts` | App 啟動流程（AC-1.7）：重開 App 仍登入並換新 token、過期 / 被拒變未登入、連不上伺服器保持登入、啟動後持續同步 | 6 |
| `lib/__tests__/restoreAuth.test.ts` | 啟動時恢復登入（AC-1.7）：沒 token、過期、有效、401/403/404/500、連不上伺服器、其他錯誤 | 9 |
| `lib/__tests__/pocketbase.test.ts` | 回歸測試：同一 collection 並行查詢不會被 SDK 自動取消（task 6.5 e2e 發現） | 1 |
| `lib/__tests__/feedback.test.ts` | 真正的 Quasar 確認對話框（刪除 → true、取消 → false）與底部提示 | 4 |
| `router/__tests__/authGuard.test.ts` | 守衛邏輯：12 條路由、未登入導向登入頁（AC-1.3）、已登入可進入、屬性測試（任意 id） | 28 |
| `router/__tests__/router.test.ts` | 真正的 router 串接：守衛讀 SDK 登入狀態、token 過期或登出後下一次換頁被擋 | 5 |
| `stores/__tests__/stores.test.ts` | auth 與 SDK 同步、各 store 初始狀態與 getters、未實作 action 的錯誤訊息 | 9 |
| `stores/__tests__/auth.test.ts` | login / logout（AC-1.1、1.2、1.6、1.7）、登入錯誤訊息對應 | 11 |
| `stores/__tests__/category.test.ts` | 分類 CRUD（AC-2.1～2.9）：空白 / 重複 / 有商品不能刪、資料庫 UNIQUE / Restrict 擋下、連線錯誤 | 20 |
| `stores/__tests__/customField.test.ts` | 自訂欄位（AC-4.1、4.2、4.7～4.11）：新增、改名、排序、已使用不能刪 / 改型別、另一人同時操作 | 19 |
| `pages/__tests__/Login.test.ts` | 登入頁：成功導向首頁、ERR-001、ERR-014、空白 ERR-009、登入中停用、顯示密碼 | 8 |
| `pages/__tests__/Categories.test.ts` | 分類列表與新增（AC-2.1～2.4）：統計、圖塊、空清單、載入失敗重試、BDD 情境 | 13 |
| `pages/__tests__/CategoryEdit.test.ts` | 編輯分類（AC-2.5～2.9、4.7～4.11）：刪除確認、名稱編輯、欄位清單、下方面板鎖定與錯誤 | 22 |
| `layouts/__tests__/MainLayout.test.ts` | 使用者名稱、頭像、登出（AC-1.5、1.6）、導覽列 4 項與目前頁 | 7 |
| `constants/__tests__/messages.test.ts` | 41 則訊息與 design.md 一字不差、出現在 requirements.md、數量、不重複、withName | 78 |
| `composables/__tests__/calculations.test.ts` | 單位均價、數量組成、歷史均價、價格比較（Property 1～4、7） | 20 |
| `composables/__tests__/depletion.test.ts` | 日期工具、耗盡日期、消耗狀態（Property 5、6 與 BDD 4 個邊界） | 27 |
| **合計** | | **287** |

> `messages.test.ts` 會讀規格文件：之後改了 design.md 的訊息文字卻沒同步改 `messages.ts`，測試就會失敗提醒你。

## 8. e2e 驗證（正式 build + 臨時 PocketBase + 無頭 Chrome）

```bash
cd ~/Projects/WenDao/frontend
./e2e/run.sh                       # 全部腳本（清單見 e2e/run.sh 的 SCRIPTS）
./e2e/run.sh custom-field-sheet    # 只跑一支
```

- 會先 `quasar build -m pwa`，再開一個**臨時** PocketBase（port 8099，跑完自動刪除，不碰正式資料），用 migrations 建好種子資料，加測試帳號 `alice@family.home`。
- 腳本用 Chrome DevTools Protocol 送出**真實的滑鼠與鍵盤事件**；截圖在 `e2e/.shots/`（不進 git）。
- **自動判定**（task 12.1）：每支腳本用 `e2e/check.mjs` 比對每個步驟的預期值，全部跑完後最後一行是：
  - `== ✓ 17 支腳本全部符合`：通過，結束代碼 0。
  - `== ✗ 有 N 支腳本不符：腳本名稱…`：不通過，結束代碼 1；往上找 `✗` 那一行，下面會印出「預期」與「實際」。

**寫新的 e2e 腳本**：複製一支相近的腳本改，判定一律用 `check.mjs`：

```js
import { check, ok, done, mdIn, shortIn, dbDateIn } from './check.mjs';
check('步驟說明', 實際值, 預期值);           // 物件、陣列逐項比較
ok('步驟說明', 條件, 不符時想看的細節);       // 只要條件成立
check('日期以今天推算', 文字, `預計 ${mdIn(15)} 用完`); // 不要把日期寫死
done();                                      // 最後呼叫：有不符時結束代碼 1
```

- 測試資料由腳本自己用 API 建在自己的分類下；e2e 共用一個臨時資料庫，**不要假設別的腳本建的資料**（例如種子分類的先後、全部商品的數量），需要時改成「互相核對」（摘要數字＝清單列數）。
- 寫好後故意把一個預期值改錯跑一次，確認會出現 ✗。
- 需要：已下載 `backend/pocketbase`、已安裝 Google Chrome、Node 22 以上。

## 9. 在手機上測試（家裡 Wi-Fi）

想在 iPhone 上看實際畫面、試日期選擇器之類的操作時用這個方法。正式的外網存取（HTTPS）是 task 13 用 Tailscale 部署，這裡先用家裡的 Wi-Fi。

**原理**：讓 PocketBase 同時提供「建置好的前端畫面」與 API，並開放給家裡的 Wi-Fi 連線；手機用 Safari 連到這台 Mac 的 IP。

```text
iPhone Safari ──家裡 Wi-Fi──► Mac 的 IP:8090 ──► 前端畫面（frontend/dist/pwa）
                                            └──► PocketBase API 與資料（backend/pb_data）
```

### 9.1 步驟

1. **建置最新的前端**（程式有改過才需要）：

   ```bash
   cd ~/Projects/WenDao/frontend
   npx quasar build -m pwa
   ```

2. **停掉平常的 PocketBase**：到正在跑 PocketBase 的終端機視窗按 `Ctrl + C`。

3. **重新啟動：開放給區域網路，並提供前端畫面**：

   ```bash
   cd ~/Projects/WenDao/backend
   ./pocketbase serve --http=0.0.0.0:8090 --publicDir=../frontend/dist/pwa
   ```

   - `0.0.0.0`：所有網路介面都接受連線（平常的 `127.0.0.1` 只有這台 Mac 自己連得到）。
   - `--publicDir`：讓 PocketBase 直接提供 `dist/pwa` 裡的畫面，不需要複製到 `pb_public`。

4. **查這台 Mac 的 IP**（Wi-Fi 可能是 en0 或 en1，所以兩個都試）：

   ```bash
   ipconfig getifaddr en0 || ipconfig getifaddr en1
   ```

   會得到像 `192.168.x.x` 的位址。換網路或重開機後可能會變，每次測試前都查一次。

5. **iPhone 連上同一個 Wi-Fi**，用 Safari 開 `http://<上一步的 IP>:8090`，用自己的帳號登入。

6. **測完改回平常的設定**：按 `Ctrl + C` 停掉，再用原本的方式啟動：

   ```bash
   ./pocketbase serve --http=127.0.0.1:8090
   ```

### 9.2 要注意的地方

- **用的是真實資料**：手機上新增、修改的內容會直接存進 `backend/pb_data`，和平常是同一份。
- **測試期間，家裡 Wi-Fi 上的其他裝置也連得到登入頁**：公開註冊已關閉（task 1.7），沒有帳密登不進去；測完仍請照第 6 步改回 `127.0.0.1`。
- **這是 HTTP 不是 HTTPS**：畫面與操作都能測；PWA 的離線功能、加入主畫面後像 App 一樣全螢幕開啟，要等 task 13 的 HTTPS（Tailscale）才會完整運作。
- **為什麼不用 `quasar dev`（開發伺服器）**：開發模式的前端會連 `http://localhost:8090`（第 6 節），在手機上 `localhost` 指的是手機自己，會連不到資料。用 PocketBase 提供建置好的畫面，前端與 API 在同一個網址（`VITE_POCKETBASE_URL = /`），就不會有這個問題。
- 2026-11-03 已在 Mac 上用區域網路 IP 驗證：首頁、`/purchases` 這類網址（history 路由）、API 都回應 200，分頁標題是「溫叨Pantry」。

## 疑難排解

| 狀況 | 原因 | 處理方式 |
|---|---|---|
| `quasar: command not found` | 沒有全域安裝 Quasar CLI | 改用 `npx quasar ...`，或用 `npm run dev` / `npm run build` |
| 建置 PWA 時找不到 `workbox-build` | 沒有安裝 `src-pwa/` 的套件 | `cd src-pwa && npm install` |
| `Port 9000 is already in use` | 已經有一個 dev server 在跑 | 關掉另一個，或加 `--port 9100` 換一個 port |
| 手機上看不到「加到主畫面」 | service worker 只能在 HTTPS 或 localhost 下運作 | 正式環境要透過 `tailscale serve` 提供 HTTPS（task 13.1） |
| 測試出現 `QPage needs to be a deep child of QLayout` | 頁面沒有放在 QLayout 裡 | 用 `mountPage` 掛載（它會包好 QLayout） |
| 測試出現 `ResizeObserver is not defined` | jsdom 沒有這個 API | 確認 `vitest.config.ts` 有 `setupFiles: ['src/test-utils/setup.ts']` |
| 測試出現 `The SSR server build was installed without an ssrContext` | 測試沒有用到 Quasar 的瀏覽器版本 | 確認 `vitest.config.ts` 的 alias 有 `/^quasar$/ → quasar/dist/quasar.client.js` |
| `npm audit` 顯示十幾個 moderate 漏洞 | 都在 ESLint 相關的**開發工具**裡（minimatch），不會打包進 App | 用 `npm audit --omit=dev` 檢查正式會用到的套件（應為 0）。不要執行 `npm audit fix --force`，它會把 ESLint 降到很舊的版本 |
| 安裝時出現 `npm warn install-scripts` | npm 11 預設不執行套件的安裝腳本（`@parcel/watcher`、`fsevents`） | 目前不影響開發與建置，不用處理 |
| 手機開 `http://<IP>:8090` 一直轉圈或「無法連接伺服器」 | 手機和 Mac 不在同一個 Wi-Fi、IP 換了，或 PocketBase 還綁在 `127.0.0.1` | 確認同一個 Wi-Fi；重新查 IP（第 9 節第 4 步）；確認啟動時用的是 `--http=0.0.0.0:8090` |
| 手機看得到登入頁，但登入後畫面空白或出現連線錯誤 | 用了 `quasar dev` 的網址（port 9000），前端去連手機自己的 `localhost:8090` | 改用第 9 節的方式：PocketBase 加 `--publicDir`，網址用 port 8090 |
| 第 9 節啟動時出現 `bind: address already in use` | 平常的 PocketBase 還在跑 | 先到那個視窗按 `Ctrl + C`；找不到視窗時用 `lsof -i :8090` 查出程式再關掉 |
| 打開 macOS 防火牆後手機連不到 | 防火牆擋下外部連線 | 系統設定 → 網路 → 防火牆 → 選項，允許 `pocketbase` 接收連入連線 |
| 手機上看到的是舊畫面 | `dist/pwa` 不是最新的建置，或 Safari 快取 | 重新執行第 9 節第 1 步；Safari 重新整理（必要時 設定 → Safari → 清除瀏覽紀錄與網站資料） |
| 改了 manifest，手機上卻沒變 | 舊的 service worker 還在快取舊檔案 | 瀏覽器開發者工具 → Application → Service Workers → Unregister，再重新整理 |
