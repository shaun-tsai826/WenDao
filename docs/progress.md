# 專案進度紀錄（progress.md）

> 版本：v2.1（2026-11-01）
> 變更摘要：v2.1 完成 task 2.2（SDK / chart.js / fast-check、PocketBase 網址）。新增 K-9；記錄暫停使用 Kiro 與 2.6 前先做設計稿。
> v2.0 完成 task 2.1（Quasar 前端專案），新增 docs/setup-frontend.md 與 K-8。
> v1.9 完成 task 1.8（種子資料），task 1（環境建置）全部完成。
> v1.8 完成 task 1.7（API Rules，公開註冊已關閉）。
> v1.7 完成 task 1.6（purchase_record_field_values），新增 K-7。
> v1.6 完成 task 1.5（purchase_records），新增 K-6。
> v1.5 完成 task 1.4（products）。新增「需回寫 Kiro 的變更」清單。
> v1.4 完成 task 1.3（custom_fields）。
> v1.3 完成 task 1.2（users 設定、categories 建立）。
> v1.2 完成 task 1.1（PocketBase 0.40.6、superuser 建立），新增 docs/setup-pocketbase.md。
> v1.1 規格已由 Kiro 修正並產出 BDD，Claude Code 完成第二輪審查與修正（F-1～F-6）；docs/specs 改為指向 .kiro/specs/home-erp 的捷徑。
> v1.0（2026-10-31）初次建立。

## 目前階段

**實作中。** task 1（環境建置）全部完成；task 2.1～2.2 完成，下一步是 task 2.3（PocketBase client 與 boot 檔）。

> **2026-11-01 起短期內不使用 Kiro**：規格需要修改時，由 Claude Code 先問使用者、同意後直接改（含版本號與變更摘要）。
> **task 2.6 之前**：先用已安裝的設計 skills（ui-ux-pro-max、taste-skill）做 2～3 種風格的手機畫面稿（儀表板、新增購買記錄），使用者選定後整理成 UI 設計規範寫進規格。

```
規格撰寫 ──► 規格審查 ──► Kiro 修正 + BDD ──► 第二輪審查 ──► 實作（2.2 完成，下一步 2.3）
  (完成)       (完成)          (完成)            (完成)        ◄ 目前在這裡
```

## 規格文件（正本在 `.kiro/specs/home-erp/`，`docs/specs/` 是指向它的捷徑）

| 文件 | 版本 |
|---|---|
| requirements.md | v1.3 |
| design.md | v2.3 |
| tasks.md | v1.2（勾選狀態持續更新） |
| BDD.md | v1.1 |
| review-notes.md | v1.2 |

> 從 `docs/specs/` 或 `.kiro/specs/home-erp/` 打開都是同一份檔案，改哪一邊都一樣。**不要另外複製一份**，以免版本對不起來。

## 已完成

| 日期 | 項目 | 產出 |
|---|---|---|
| 2026-10-24 前 | Kiro 撰寫規格 | requirements v1.1、design v2.0、tasks v1.0 |
| 2026-10-30 | Claude Code 審查規格，使用者確認修正方向 | review-notes v1.0 |
| 2026-10-31 | git init、建立 public repo、資料夾骨架（結構 A） | https://github.com/shaun-tsai826/WenDao、review-notes v1.1（R-6） |
| 2026-11-01 | Kiro 依 review-notes 修正規格（含 Q-1～Q-4 的回答），產出 BDD | requirements v1.2、design v2.1、tasks v1.1、BDD v1.0 |
| 2026-11-01 | Claude Code 第二輪審查並直接修正 F-1～F-6（經使用者同意） | requirements v1.3、design v2.2、tasks v1.2、BDD v1.1、review-notes v1.2 |
| 2026-11-01 | **task 1.1**：鎖定 PocketBase 0.40.6 / SDK 0.28.1，下載到 `backend/`（checksum OK），使用者建立 superuser | design v2.3、`docs/setup-pocketbase.md` v1.0 |
| 2026-11-01 | **task 1.2**：migration `1793536337_users_categories.js`（users.name 改必填、只用 email 登入；新增 categories，name 必填、上限 100 字、UNIQUE INDEX），已在臨時資料庫用 API 驗證 | `docs/setup-pocketbase.md` v1.1 |
| 2026-11-01 | **task 1.3**：migration `1793538685_custom_fields.js`（category 關聯 Cascade、field_type 選項 number/text、(category, field_name) 複合 UNIQUE INDEX），已在臨時資料庫用 API 驗證 | — |
| 2026-11-01 | **task 1.4**：migration `1793539175_products.js`（category 關聯 Restrict、(category, brand, name) 複合 UNIQUE INDEX、消耗與剩餘數量欄位），已在臨時資料庫用 API 驗證 | — |
| 2026-11-01 | **task 1.5**：migration `1793539430_purchase_records.js`（product、user 關聯皆 Restrict；total_price 必填且 ≥ 0.01），已在臨時資料庫用 API 驗證 | — |
| 2026-11-01 | **task 1.6**：migration `1793540171_purchase_record_field_values.js`（purchase_record Cascade、custom_field Restrict、(purchase_record, custom_field) 複合 UNIQUE INDEX），已在臨時資料庫用 API 驗證 | — |
| 2026-11-01 | **task 1.7**：migration `1793543324_api_rules.js`（5 張資料表一律「已登入才可操作」；users 只能 List/View，Create/Update/Delete 為 Locked）。已用未登入 / 使用者 / superuser 三種身分驗證；正式環境公開註冊回 403 | — |
| 2026-11-01 | **task 1.8**：使用者在 superuser UI 手動建立 2 位家庭使用者（email 不寫進 repo）；migration `1793544611_seed_data.js` 建立分類「衛生紙」「蔬菜」、衛生紙的 3 個自訂欄位、商品「春風 抽取式衛生紙」 | — |
| 2026-11-01 | **task 2.1**：`npm init quasar@5.0.35` 建立 `frontend/`（TypeScript、Sass、ESLint + Prettier、Pinia、手動路由），加入 PWA 模式並依 design.md 調整 manifest。lint、typecheck、`quasar build -m pwa`、dev server 都驗證通過 | `docs/setup-frontend.md` v1.0 |
| 2026-11-01 | **task 2.2**：安裝 pocketbase 0.28.1（鎖定）、chart.js 4.6.1、fast-check 4.10.2；`build.defineEnv` 設定 `VITE_POCKETBASE_URL`（開發 `http://localhost:8090`、正式 `/`）。已驗證兩種模式的值、SDK 連線、CORS | `docs/setup-frontend.md` v1.1 |

## 待辦（依順序）

1. **[Claude Code]** task 2.3：建立 `src/lib/pocketbase.ts` 與 `src/boot/pocketbase.ts`。
2. **[Claude Code + 使用者]** task 2.6 前：用設計 skills 做畫面稿，使用者確認風格。
3. 之後依 `tasks.md` 順序，一次做一個 task → 勾選 `[x]` → commit（message 帶 task 編號）。

## 重要決定紀錄

| 決定 | 內容 | 出處 |
|---|---|---|
| 剩餘數量 | **手動輸入**，不用公式推算 | review-notes C-6 |
| 雙單位 | 計價單位 `unit`（抽）用來算均價；消耗單位 `consumption_unit`（包）用於消耗速率與剩餘數量 | review-notes C-8 |
| 新增購買後 | 跳出對話框，詢問是否更新剩餘數量，**預先帶入目前的剩餘數量**（未設定時留空） | review-notes Q-1、F-4 |
| 外網存取 | Tailscale + `tailscale serve` 提供 HTTPS（PWA 需要 HTTPS） | review-notes R-2 |
| 資料夾結構 | 前端、PocketBase、部署設定都放在 repo；資料表結構用 `pb_migrations` 做版本管理 | review-notes R-6 |
| 版本鎖定 | **PocketBase 0.40.6、JS SDK 0.28.1**（task 1.1 鎖定） | review-notes F-1、design v2.3 |
| 文件位置 | 正本留在 `.kiro/`（Kiro 只讀這裡），`docs/specs` 是捷徑 | — |
| Repo 公開 | GitHub public repo。**密碼與 `.env` 一律不進 git** | — |
| users 由系統預設建立 | PocketBase 0.23+ 會自動建立 users，migration 是「修改」它；預設的 `avatar` 欄位保留不用。公開註冊已在 task 1.7 關閉 | task 1.2 |
| PocketBase 的 required | bool 設 required 代表「必須是 true」，number 設 required 代表「不可為 0」（已實測）。所以「預設 false / 0」的欄位一律**不設 required**。PocketBase 沒有欄位預設值，沒填時會存 false / 0 | task 1.3 |
| 自訂欄位名稱唯一 | 使用者決定**加上** `(category, field_name)` 複合 UNIQUE INDEX，前端仍會先查詢並顯示友善訊息 | task 1.3 |
| 剩餘數量「未設定」 | PocketBase 的 number 存不了 null（沒填或送 null 都會存 0，已實測）。使用者決定：**`remaining_updated_at` 為空 = 未設定**，前端讀取商品時把 remaining_quantity 轉成 null；兩個欄位一起寫入、一起清空。consumption_rate 的 0 = 未設定 | task 1.4 |
| 購買記錄的數量缺失 | quantity 沒填會存 0；**quantity = 0 視為缺失**（AC-6.5 原本就把 0 和缺失一樣處理）。前端讀取時把 quantity 0 與它的 unit_price 都轉成 null，算歷史均價時排除這些記錄 | task 1.5 |
| 種子資料 | 使用者帳號由使用者在後台手動建立（**真實 email 不進 repo**）；BDD 的 Alice / Bob 只是測試用假資料。正式資料庫只建 tasks.md 列的 1 個商品（春風），BDD 的 Kleenex 只放在前端測試假資料。「層數」型別依 BDD 用 number | task 1.8 |
| 正式環境 PocketBase 網址 | 使用者決定用相對路徑 `/`（前端放在 pb_public，與 API 同網址），不把 Tailscale 主機名稱寫進 repo | task 2.2 |
| 前端工具 | Linter 用 **ESLint + Prettier**；App 圖示**先用 Quasar 預設**；刪除自動產生的 `.vscode/mcp.json`（未鎖版本的 MCP server）。以上皆為使用者選擇 | task 2.1 |
| 欄位值唯一 | 沿用前兩次的決定：加上 `(purchase_record, custom_field)` 複合 UNIQUE INDEX | task 1.6 |
| 商品唯一 | 使用者決定**加上** `(category, brand, name)` 複合 UNIQUE INDEX（只擋完全相同）；AC-3.6 的正規化比對由前端負責 | task 1.4 |
| Kiro 不能 push | Kiro 改完的文件由 Claude Code 審查後 commit / push | — |

## 待回寫規格的變更（暫停使用 Kiro 期間，經使用者同意後由 Claude Code 直接改）

| # | 來源 | 內容 |
|---|---|---|
| K-1 | task 1.2 | users 段落改為「修改系統預設的 users Collection」；預設 `avatar` 欄位保留不用；「關閉 username 登入」改為「登入識別欄位只用 email」（0.23+ 沒有 username） |
| K-2 | task 1.3 | custom_fields 的 `is_quantity_component`、`display_order` 改為非必填（沒填存 false / 0），註明 PocketBase required 語意 |
| K-3 | task 1.3 | 刪除「複合唯一約束無法在 PocketBase schema 設定」，改為 `(category, field_name)` UNIQUE INDEX + 前端查詢 |
| K-4 | task 1.4 | products 同上，改為 `(category, brand, name)` UNIQUE INDEX + 前端正規化查詢 |
| K-5 | task 1.4 | products 的「未設定時為 null」改為：consumption_rate 未設定存 0；remaining_quantity 以 `remaining_updated_at` 為空判斷未設定，前端讀取時轉成 null（getDepletionStatus 的邏輯不變） |
| K-6 | task 1.5 | purchase_records 的「可為 null」改為：quantity 沒填存 0，0 = 缺失；unit_price 在 quantity 為 0 時視為 null（前端讀取轉換、歷史均價排除）。另註明：總價送 0 時 PocketBase 回 `validation_required`、負數回 `validation_min_number_constraint`，前端依 AC-5.11 一律顯示「總價必須大於 0」 |
| K-8 | task 2.1 | design.md 的前端結構：`quasar.config.js` → `quasar.config.ts`；PWA manifest 改放在 `src-pwa/manifest.json`（不是寫在 quasar.config 裡）；`workboxMode: 'generateSW'` → `'GenerateSW'`（@quasar/app-vite 3 的寫法）；圖示多了 192 / 384 / maskable 等尺寸（Quasar 預設）；沒有 `vite.config.ts`（由 quasar.config 管理）。design.md 範例的 `import { boot } from 'quasar/wrappers'` 在新版改為 `import { defineBoot } from '#q-app'`（router / store 同樣是 `defineRouter` / `defineStore` from `#q-app`） |
| K-9 | task 2.2 | tasks.md 2.2 與 design.md：`build.env` → `build.defineEnv`；正式環境 `VITE_POCKETBASE_URL` 由 `https://<mac-mini>.<tailnet>.ts.net` 改為 `/` |
| K-7 | task 1.6 | purchase_record_field_values 同 K-3，改為 `(purchase_record, custom_field)` UNIQUE INDEX + 前端保證 |

## 下次接手時

```bash
cd ~/Projects/WenDao   # 另一台電腦第一次使用時先 git clone https://github.com/shaun-tsai826/WenDao.git
git pull
```

然後跟 Claude Code 說：「讀 docs/progress.md，接著做」。

> 新電腦的 `backend/pocketbase` 與 `pb_data/` 不在 git 裡：執行檔請照 `docs/setup-pocketbase.md` 重新下載；資料庫要另外搬移或備份還原。
