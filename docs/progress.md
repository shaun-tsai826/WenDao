# 專案進度紀錄（progress.md）

> 版本：v5.2（2026-11-02）
> 變更摘要：v5.2 task 7.3（商品列表頁）完成；新增 e2e products。
> v5.1 task 7.2（DepletionBadge 元件）完成。
> v5.0 補齊交接（工作慣例、e2e 指令、待確認事項）；e2e 腳本移入 repo；記錄商業規則「儲存剩餘數量即更新日期」。
> v4.9 task 7.1（useProductStore、商品畫面用資料）完成。
> v4.8 商品管理設計稿確認（design.md v3.2）；新增「未來版本」清單。
> v4.7 K-14、K-15 回寫 design.md v3.1、tasks.md v1.5。
> v4.6 修正使用者回報：自訂欄位面板一點就關閉；測試環境改為載入真正的 Quasar 元件。
> v4.5 task 6.6 完成，task 6（分類管理）全部完成；新增 K-15。
> v4.4 task 6.5（編輯分類名稱與自訂欄位）完成；修正 SDK 自動取消造成的誤報（回歸測試）。
> v4.3 task 6.4（刪除分類）完成；新增 K-14。
> v4.2 task 6.3（新增分類）完成。
> v4.1 task 6.2（分類列表）完成。
> v4.0 分類管理設計稿確認，design.md v3.0、tasks.md v1.4（CONFIRM-003/004）。
> v3.9 task 6.1（useCategoryStore）完成；新增共用錯誤處理與測試用假 PocketBase。
> v3.8 task 5.5 完成，task 5（認證功能）全部完成。
> v3.7 task 5.4（登出按鈕）完成。
> v3.6 task 5.3（router 串接測試）完成。
> v3.5 登入頁設計稿確認；task 5.2（登入頁）完成。
> v3.4 task 4 Checkpoint 完成；task 5.1（auth store login / logout）完成。
> v3.3 完成 task 3（6 個核心計算 composables + Property 1～7），design.md v2.9。
> v3.2 完成 task 2.8（Vitest 測試環境，131 項測試），task 2 全部完成。
> v3.1 完成 task 2.7（訊息常數檔）；刪除範例元件 EssentialLink。
> v3.0 完成 task 2.6（MainLayout、Quasar 色彩、粉圓體、zh-TW）。
> v2.9 設計稿確認（B 資訊卡片 + A 粉圓體），UI 設計規範寫入 design.md v2.8。
> v2.8 K-13 已回寫 design.md v2.7；刪除範例 store。
> v2.7 完成 task 2.5（Pinia stores 骨架、auth 同步），新增 K-13。
> v2.6 K-12 已回寫 design.md v2.6。
> v2.5 完成 task 2.4（路由與守衛），新增 K-12。
> v2.4 K-10、K-11 已回寫 design.md v2.5。
> v2.3 完成 task 2.3（PocketBase client、boot、restoreAuth），新增 K-10、K-11。
> v2.2 K-1～K-9 已回寫 design.md v2.4、tasks.md v1.3。
> v2.1 完成 task 2.2（SDK / chart.js / fast-check、PocketBase 網址）。新增 K-9；記錄暫停使用 Kiro 與 2.6 前先做設計稿。
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

**實作中。** task 1（環境建置）全部完成；**task 1～6、7.1～7.3 完成**，下一步是 task 7.4（ProductNew 新增商品頁）。commit 前執行 `npm test`（目前 359 項）。

> **2026-11-01 起短期內不使用 Kiro**：規格需要修改時，由 Claude Code 先問使用者、同意後直接改（含版本號與變更摘要）。
> **task 2.6 之前**：先用已安裝的設計 skills（ui-ux-pro-max、taste-skill）做 2～3 種風格的手機畫面稿（儀表板、新增購買記錄），使用者選定後整理成 UI 設計規範寫進規格。

```
規格撰寫 ──► 規格審查 ──► Kiro 修正 + BDD ──► 第二輪審查 ──► 實作（7.3 完成，下一步 7.4）
  (完成)       (完成)          (完成)            (完成)        ◄ 目前在這裡
```

## 規格文件（正本在 `.kiro/specs/home-erp/`，`docs/specs/` 是指向它的捷徑）

| 文件 | 版本 |
|---|---|
| requirements.md | v1.3 |
| design.md | v3.2 |
| tasks.md | v1.5（勾選狀態持續更新） |
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
| 2026-11-01 | 規格回寫 K-1～K-9（使用者同意，不經 Kiro） | design.md v2.4、tasks.md v1.3 |
| 2026-11-01 | **task 2.3**：`src/lib/pocketbase.ts`（pb 實例）、`src/lib/restoreAuth.ts`（啟動時恢復登入：過期清除、有效則 authRefresh、連不上保留）、`src/boot/pocketbase.ts`。對測試伺服器驗證 6 種情境全部通過 | — |
| 2026-11-01 | **task 2.4**：12 條路由（/login 獨立，其餘 11 條為 MainLayout 子路由）、`src/router/authGuard.ts` 純函數守衛、history 模式、12 個佔位頁；刪除 Quasar 範例頁 IndexPage / SecondPage（使用者同意）。真實 vue-router 測試 26 項通過；PocketBase pb_public 的 history fallback 驗證通過 | — |
| 2026-11-01 | **task 2.5**：`src/types/models.ts`（6 張表的型別）、auth / category / product / purchase 四個 store 骨架（未實作的 action 丟出「尚未實作（task X）」）；auth store 由 boot 透過 `pb.authStore.onChange` 自動同步。執行期測試 7 項通過 | — |
| 2026-11-02 | **設計稿**：呼叫 ui-ux-pro-max、taste-skill 產出 A 溫暖居家 / B 資訊卡片 / C 家用帳本 3 種手機畫面稿（首頁、新增購買記錄）；使用者選 **B + A 的 Huninn 粉圓體**。整理成「UI 設計規範」（色彩、狀態標籤、分類圖塊、字體、間距、元件、禁止事項），14 組文字配色對比皆 ≥ 4.5:1 | design.md v2.8；設計稿 https://claude.ai/artifact/NFoy16EUs8ZDTwa2uMQDSf |
| 2026-11-02 | **task 2.6**：MainLayout（頂欄：品牌、頭像、名稱、登出按鈕；底部 4 項導覽列）、`AppIcon` 線條圖示、Quasar 色彩與 CSS 變數、Huninn 粉圓體（只用 400）、Quasar 語言包 zh-TW、manifest 顏色；登入佔位頁改為不依賴 q-layout。以無頭 Chrome 對正式 build 截圖驗證：導覽列目前頁、粉圓體載入、全站 400、Huninn 數字等寬（每個 9.81px） | — |
| 2026-11-02 | **task 2.7**：`src/constants/messages.ts`（MSG 10、ERR 19、CONFIRM 2、STATUS 8，語意化名稱 + 註解標規格編號）。比對程式逐字核對 design.md 訊息表與 requirements.md：79 PASS；故意改錯一字可抓到。刪除範例元件 EssentialLink.vue（使用者同意） | — |
| 2026-11-02 | **task 2.8**：Vitest 5.0.5 + fast-check + Vue Test Utils + jsdom，`npm test`。把 2.3～2.7 的一次性腳本改寫成正式測試，共 **131 項全過**（restoreAuth 9、authGuard 28、stores 13、MainLayout 6、messages 75）；故意改壞守衛會有 12 項失敗 | `docs/setup-frontend.md` v1.2 |
| 2026-11-02 | **task 3**：`src/composables/` 的 dates、useUnitPrice、useQuantityFromComponents（含 ERR-008 驗證）、useHistoricalAverage、useDepletionEstimate、useDepletionStatus、usePriceComparison。日期改用 'YYYY-MM-DD' 字串、today 可傳入（使用者同意）。新增 47 項測試（Property 1～7 屬性測試 + BDD 4 個邊界情境），全專案 178 項通過；6 種故意改壞皆被抓到 | design.md v2.9 |
| 2026-11-02 | **task 4** Checkpoint：使用者確認核心邏輯（耗盡天數四捨五入、組成欄位未填算 0、價格相等以 4 位小數比較、今天用裝置日期） | — |
| 2026-11-02 | **task 5.1**：`useAuthStore.login / logout`、`loginErrorMessage`（連不上 → ERR-014、5xx → ERR-013、其他 → ERR-001）。新增 `auth.test.ts` 11 項，全專案 187 項通過 | — |
| 2026-11-02 | **登入頁設計稿**：呼叫 ui-ux-pro-max（自動填入、顯示密碼、role=alert、送出中狀態），在設計稿 B 排新增「一般 / 密碼錯誤」兩張，使用者確認 | 設計稿 Login、Login-Error |
| 2026-11-02 | **task 5.2**：`pages/Login.vue`（依設計稿；空白欄位 ERR-009、登入失敗依原因 ERR-001/013/014、保留 email 清空密碼並聚焦、登入中停用）。`Login.test.ts` 8 項，全專案 195 項通過；無頭 Chrome 對正式 build 實際輸入驗證 6 個步驟（含重新整理仍登入） | — |
| 2026-11-02 | **task 5.3**：守衛與登入保持已在 2.3 / 2.4 實作；補上真正的 `router/index.ts` 串接測試 5 項（未登入被擋、有效 token 可進入、使用中 token 過期或登出後下一次換頁被擋、已登入開 /login 導回首頁）。vitest 的 `#q-app` 指向 Quasar 官方實作。全專案 200 項通過；拿掉守衛那一行會有 4 項失敗 | `docs/setup-frontend.md` v1.3 |
| 2026-11-02 | **task 5.4**：MainLayout「登出」按鈕接上 `auth.logout()` 並 `router.replace('/login')`（AC-1.6），不另加確認對話框（規格未要求）。MainLayout 測試新增 1 項，全專案 201 項；無頭 Chrome 驗證登出後按上一頁、直接輸入網址、重新整理都停在 /login | — |
| 2026-11-02 | **task 5.5**：對照清單，登入成功 / 失敗、登出、攔截重定向已在 5.1～5.4 補齊；新增 `boot/__tests__/pocketbase.test.ts` 6 項（模擬重開 App：有效 token 仍登入並換新、過期 / 被拒變未登入、連不上伺服器保持登入、啟動後持續同步）。全專案 207 項；3 種故意改壞皆被抓到 | `docs/setup-frontend.md` v1.4 |
| 2026-11-02 | **task 6.1**：`useCategoryStore` 的 fetch / create / update / delete；驗證集中在 store（去前後空白、空白 ERR-002、向伺服器查重複 ERR-003、有商品 ERR-004，資料庫 UNIQUE / Restrict 擋下也轉成相同訊息）。新增 `lib/errors.ts`（ValidationError、apiErrorMessage）與 `test-utils/fakePocketBase.ts`（記憶體假 PocketBase，模擬 UNIQUE / Restrict / 連線錯誤）。`category.test.ts` 20 項，全專案 225 項；4 種故意改壞皆被抓到 | — |
| 2026-11-02 | **分類管理設計稿**：ui-ux-pro-max 查 UX 規則，設計稿新增「分類列表 / 編輯分類 / 編輯自訂欄位」3 張；使用者確認並同意 3 項提案。規格更新 design.md v3.0、tasks.md v1.4，messages.ts 新增 CONFIRM-003 / 004 | 設計稿 Cat-List / Cat-Edit / Cat-Field |
| 2026-11-02 | **task 6.2**：`pages/Categories.vue` 分類列表（圖塊配色、商品數 / 自訂欄位數、載入中 / 失敗重試 / 空清單）；`category.fetchStats`；`lib/categoryTone.ts`；`lib/feedback.ts`（Notify / Dialog 包裝）並啟用 Quasar Notify、Dialog；`test-utils/mountPage.ts`。`Categories.test.ts` 8 項，全專案 236 項 | — |
| 2026-11-02 | **task 6.3**：分類列表頁上方的新增表單；空白 ERR-002、重複 ERR-003、連線錯誤顯示在欄位下方（role=alert、aria-invalid）；成功顯示 MSG-001 並清空、聚焦輸入框。新增 5 項測試（BDD AC-2.2～2.4），全專案 241 項 | — |
| 2026-11-02 | **task 6.4**：`pages/CategoryEdit.vue` 框架與「刪除這個分類」區塊（有商品時停用並寫出原因；CONFIRM-003 確認；成功 MSG-002 並回到列表；資料庫擋下顯示 ERR-004）。返回列放在內容區（K-14）。`CategoryEdit.test.ts` 6 項，全專案 247 項 | — |
| 2026-11-02 | **task 6.5**：`stores/customField.ts`（fetch / create / update / move / delete，ERR-009 / 017 / 018 / 019，使用狀況每次重查）；`components/CustomFieldSheet.vue` 下方面板（已使用欄位提前鎖定並說明、CONFIRM-004）；編輯分類頁加入名稱編輯（MSG-008、ERR-002 / 003）與欄位清單（上下箭頭排序、MSG-009 / 010）。新增 store 測試 19 項、頁面測試 16 項；5 種故意改壞皆被抓到。**e2e 發現並修正**：SDK 預設自動取消同 collection 的並行查詢，編輯分類頁誤報 ERR-014 → `pb.autoCancellation(false)`，先寫回歸測試（失敗）再修正（通過）。另修正底部提示左側空白、確認對話框圓角。全專案 283 項；e2e 8 步驟全數符合 | — |
| 2026-11-02 | **task 6.6**：對照清單逐項確認已涵蓋（store + 頁面）；補上 `lib/__tests__/feedback.test.ts`（真正的 Quasar 確認對話框與底部提示，連跑 5 次穩定）。「刪除有商品分類（MSW 回傳 400）」改用 fakePocketBase 模擬 Restrict 400（K-15）。全專案 287 項 | `docs/setup-frontend.md` v1.5 |
| 2026-11-02 | **修正（使用者回報）**：自訂欄位面板一點就關閉。原因：面板最外層用 `<section>`，Quasar 只讓 `.q-dialog__inner` 底下直接的 `<div>` 可點，點擊穿透到背景而關閉。改為 `<div>`；先寫回歸測試（失敗）再修正。**測試沒抓到的根本原因**：vitest 沒載入 Quasar 元件（`<q-dialog>` 在測試裡只是普通標籤）→ 加入 `@quasar/vite-plugin`、`mountPage` 包 QLayout、`setup.ts` 補 ResizeObserver；e2e 改用真實滑鼠鍵盤事件，手機與桌機寬度各 9 步驟通過。全專案 288 項 | `docs/setup-frontend.md` v1.6 |
| 2026-11-02 | **商品管理設計稿**：設計稿新增「商品列表 / 新增商品 / 商品詳情 / 更新消耗設定」4 張，使用者確認並同意 3 項（急迫程度排序、即時預估、修改基本資料列未來版本）；design.md v3.2 | 設計稿 Prod-* |
| 2026-11-02 | **task 7.1**：`stores/product.ts`（fetchProducts / createProduct / updateProduct；ERR-005 / 006 / 007 / 009 / 015 / 016；剩餘數量更新日自動為當天、清空時一併清空）；`lib/productView.ts`（讀取轉換、耗盡日期與狀態、久未更新 > 30 天、急迫程度排序、AC-3.6 NFKC 正規化）。fakePocketBase 的 failNext 可指定欄位錯誤。新增 36 項測試（含屬性測試），全專案 324 項；6 種故意改壞皆被抓到 | — |
| 2026-11-02 | **task 7.2**：`components/DepletionBadge.vue`（依 DepletionStatus 顯示 STATUS-002 / 003 / 004 / 007，normal 不顯示；樣式依設計稿 13px 膠囊、CSS 變數配色）。`DepletionBadge.test.ts` 10 項（含與 getDepletionStatus 串接的 0 / 7 / 8 天與昨天邊界），全專案 334 項；3 種故意改壞皆被抓到。STATUS-008 久未更新留給 task 7.8 | — |
| 2026-11-02 | **task 7.3**：`pages/Products.vue` 商品列表（依急迫程度排序、分類圖塊、第二行剩餘數量與預計用完日、DepletionBadge、依分類篩選且放不下換行、載入中 / 失敗重試 / 空清單）；`lib/productView.ts` 新增 `productSummary`、`formatQuantity`、`formatMonthDay`。新增 25 項測試（頁面 11、第二行文字 14），全專案 359 項；4 種故意改壞皆被抓到。e2e `products.mjs`（自建測試資料、真實滑鼠事件）8 步驟通過。**e2e 發現**：已耗盡第二行加上「已過 N 天」在手機寬斷成三行 → 改回設計稿寫法「剩 0.5 包 · 10/25 已用完」 | — |

## 待辦（依順序）

1. **[Claude Code]** task 7.4～7.8：新增、詳情、編輯、測試、久未更新提醒。
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
| 日期計算 | 使用者決定：composables 一律用 'YYYY-MM-DD' 字串計算（不受時區影響），`getDepletionStatus` 的 today 可傳入（預設裝置本地日期）；耗盡天數四捨五入到整天 | task 3 |
| 正式環境 PocketBase 網址 | 使用者決定用相對路徑 `/`（前端放在 pb_public，與 API 同網址），不把 Tailscale 主機名稱寫進 repo | task 2.2 |
| 路由 | 使用者決定：功能頁**嵌套在 MainLayout 下**、**history 模式**（不帶 #）、刪除範例頁。頁面檔名維持 design.md 的單字名稱，ESLint 只對 `src/pages/` 關閉 multi-word 規則 | task 2.4 |
| 剩餘數量更新日 | 使用者同意：只要儲存時剩餘數量有值（即使數字沒變），更新日就設為當天——按儲存即代表確認目前數量，「久未更新」提醒跟著消失 | task 7.1 |
| 商品管理設計 | 使用者同意：列表依急迫程度排序、更新消耗設定時即時顯示預估用完日、修改商品基本資料列為未來版本 | 商品設計稿 |
| 分類管理設計 | 使用者同意 3 項：刪除分類 / 欄位前先確認（新增 CONFIRM-003 / 004）、刪除分類放在編輯分類頁最下方、已使用欄位提前鎖定型別與計算方式 | 分類設計稿 |
| 設計定案 | **B 資訊卡片 + A 的 Huninn 粉圓體**（只有 400 一種粗細，層級靠字級與顏色）；狀態標籤文字用訊息表 STATUS-003/004，天數放第二行 | 設計稿 |
| 設計方向 | 使用者希望設計稿涵蓋：**溫暖居家**（米色、圓角、柔和）、**資訊清楚的卡片式**（明確標示即將用完 / 已用完），第三種由設計 skills 建議 | 設計稿 |
| 前端工具 | Linter 用 **ESLint + Prettier**；App 圖示**先用 Quasar 預設**；刪除自動產生的 `.vscode/mcp.json`（未鎖版本的 MCP server）。以上皆為使用者選擇 | task 2.1 |
| 欄位值唯一 | 沿用前兩次的決定：加上 `(purchase_record, custom_field)` 複合 UNIQUE INDEX | task 1.6 |
| 商品唯一 | 使用者決定**加上** `(category, brand, name)` 複合 UNIQUE INDEX（只擋完全相同）；AC-3.6 的正規化比對由前端負責 | task 1.4 |
| Kiro 不能 push | Kiro 改完的文件由 Claude Code 審查後 commit / push | — |

## 未來版本（本版不做，使用者決定）

| 項目 | 說明 | 提出時間 |
|---|---|---|
| 修改商品基本資料 | 商品建立後修改品牌、品名、計價單位（打錯字只能重建）；目前規格也沒有刪除商品 | 2026-11-02 商品設計稿 |

## 待回寫規格的變更（暫停使用 Kiro 期間，經使用者同意後由 Claude Code 直接改）

> **K-1～K-9 已於 2026-11-01 回寫**至 design.md v2.4、tasks.md v1.3（使用者同意）。以下保留作為紀錄；新的落差請從 K-10 開始編號。


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
| K-10 | task 2.3 | **（已回寫 v2.5）** design.md 的 import 路徑 `lib/…`、`stores/…`、`composables/…` 改為 `@/lib/…`、`@/stores/…`、`@/composables/…`（Quasar 3 只內建 `@/` 別名） |
| K-11 | task 2.3 | **（已回寫 v2.5）** design.md boot 範例：恢復登入的邏輯抽到 `src/lib/restoreAuth.ts`（client 由參數傳入，方便測試），並加上 `authRefresh`（換新 token、確認帳號存在；連不上伺服器時保留登入）；`pb.authStore.onChange` 同步 Pinia 的部分移到 task 2.5 |
| K-12 | task 2.4 | **（已回寫 v2.6）** design.md 路由範例：11 條功能頁改為 MainLayout 的子路由（`meta.requiresAuth` 寫在父路由）；守衛改為純函數 `authGuard(to, isAuthenticated)`，登入狀態取自 `pb.authStore.isValid`（不依賴 auth store）；路由模式由 quasar.config.ts 的 `vueRouterMode: 'history'` 設定；保留 Quasar 的 404 頁（ErrorNotFound） |
| K-13 | task 2.5 | **（已回寫 v2.7）** design.md 的 useAuthStore：state 初始值改為空（user: null、token: ''），由 `syncFromPb()` 從 SDK 複製（token 過期視為未登入）；boot 呼叫 `syncFromPb()` 並註冊 `pb.authStore.onChange`；新增 `src/types/models.ts` 存放 6 張表的型別（資料庫原始值） |
| K-14 | task 6.4 | **（已回寫 design.md v3.1）** design.md「UI 設計規範 › 元件 › 頂欄」寫「子頁的頂欄改成返回箭頭 + 頁面標題」，會拿掉右上角使用者名稱與登出，與 AC-1.5「已登入時右上角顯示使用者名稱與登出」衝突。實作改為：頂欄維持不變，子頁在內容區上方放「返回箭頭 + 頁面標題（20px h1）」 |
| K-15 | task 6.6 | **（已回寫 design.md v3.1、tasks.md v1.5）** tasks.md 6.6（及後續整合測試）寫「MSW 回傳 400」；實作改用自製的 `test-utils/fakePocketBase.ts`（記憶體假資料庫，模擬 UNIQUE / Restrict / 連線錯誤），不另裝 MSW。重要流程另以無頭 Chrome 對正式 build 做 e2e |
| K-7 | task 1.6 | purchase_record_field_values 同 K-3，改為 `(purchase_record, custom_field)` UNIQUE INDEX + 前端保證 |

## 下次接手時

```bash
cd ~/Projects/WenDao   # 另一台電腦第一次使用時先 git clone https://github.com/shaun-tsai826/WenDao.git
git pull
```

然後跟 Claude Code 說：「讀 docs/progress.md，接著做」。

> 新電腦的 `backend/pocketbase` 與 `pb_data/` 不在 git 裡：執行檔請照 `docs/setup-pocketbase.md` 重新下載；資料庫要另外搬移或備份還原。前端套件：`cd frontend && npm install && (cd src-pwa && npm install)`。

### 目前位置（2026-11-02）

- 已完成：task 1～6、7.1～7.3。**下一步：task 7.4 ProductNew 新增商品頁**（設計稿 Prod-New；新頁面要加 e2e 腳本），接著 7.5～7.8（詳情、編輯、測試、久未更新提醒）。
- 商品頁設計稿已確認：設計稿最下面一排 Prod-List / Prod-New / Prod-Detail / Prod-Edit（https://claude.ai/artifact/NFoy16EUs8ZDTwa2uMQDSf ；本機原始檔在 `.design-canvas/`，不進 git）。
- 待使用者決定：`npm run lint:check` 的 prettier 少了 `--check`（只印出結果、永遠成功），是否修正（見 task 7.3 回報）。

### 工作慣例（Claude Code 接手時照做）

1. **一次一個 task**：做完 → `tasks.md` 勾選 → 更新本檔 → commit（訊息帶 task 編號）→ push → 回報（繁體中文）。
2. **新畫面先做設計稿**：先呼叫設計 skills（ui-ux-pro-max、taste-skill），依 design.md「UI 設計規範」做稿放到設計稿，使用者確認後才實作。
3. **規格有落差**：先停下來列「問題＋建議（含推薦選項）」問使用者（選擇題），同意後才改 design.md / tasks.md，並升版號、寫變更摘要。暫停使用 Kiro。
4. **驗證三層**：
   - `cd frontend && npm test`（Vitest，目前 359 項）、`npm run lint:check`、`npm run typecheck`
   - 故意改壞關鍵程式確認測試抓得到（**先備份檔案**，不要用 `git checkout` 還原未 commit 的修改）
   - `./e2e/run.sh`（正式 build + 臨時 PocketBase + 無頭 Chrome，**真實滑鼠鍵盤事件**；手機寬 390）。新頁面要在 `frontend/e2e/` 加腳本
5. **修 bug**：先寫會失敗的回歸測試，再修正。
6. 測試工具：`src/test-utils/fakePocketBase.ts`（記憶體假資料庫）、`mountPage.ts`（頁面掛載，含 QLayout）、`setup.ts`。
7. Repo 是 public：真實 email、密碼、token 不可寫進任何檔案。
