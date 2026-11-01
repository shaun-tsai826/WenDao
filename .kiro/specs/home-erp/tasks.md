# Implementation Plan: home-erp 家庭用品管理 ERP

> 版本：v1.3（2026-11-01）
> 變更摘要：v1.3 依實作結果回寫 K-1、K-2、K-8、K-9（經使用者同意）：1.2 users 改為修改系統預設 Collection；1.8 使用者改為手動建立；2.1 的 `quasar.config.js` 改為 `quasar.config.ts` 與 `src-pwa/manifest.json`；2.2 的 `build.env` 改為 `build.defineEnv`，正式環境網址改為 `/`；1.3 的 required 依 PocketBase 語意調整（K-2）。
> v1.2 變更摘要：v1.2 依 review-notes v1.2 修正：PocketBase / JS SDK 版本改為開工時確認後鎖定，SDK 須 0.22 以上（F-1）；8.4 對話框預設值改為目前的剩餘數量（F-4）；7.7 補上 ERR-015、ERR-016、STATUS-008 測試（F-5）。
> v1.1 變更摘要：依 review-notes R-1~R-6、C-6~C-13、Q-1~Q-4 修正。主要變更：Collection 改由 migration 檔建立（R-6）、路徑改為 repo 內（R-6）、PocketBase 版本鎖定 0.23.4 + SDK 0.21.5（R-4）、Chart.js 改 npm（R-5）、users API Rule 改 Locked（R-1）、新增 tailscale serve 步驟（R-2）、新增剩餘數量與消耗單位欄位及計算（C-6/C-8）、消耗狀態邊界修正（C-7）、購買記錄列表補新増者（C-9）、自訂欄位編輯/刪除限制（C-10）、價格比較 null 處理（C-12）、所有測試任務改為必做（C-13）、新增 task 7.8 久未更新提醒（Q-3）、新增 task 8.4 剩餘數量更新對話框（Q-1）。

## Overview

本實作計畫將 home-erp 家庭用品管理 ERP 系統拆分為可獨立完成、獨立測試的任務。系統架構為 PocketBase（後端資料層，內建 SQLite + REST API + Auth）+ Vue 3 / Quasar Framework（前端 SPA + PWA），所有業務邏輯以純函數 composable 實作於前端，計算完成後寫入 PocketBase。

任務順序由底層到上層：
1. 環境建置（PocketBase 安裝 + migration 檔建立 Collection + 種子資料）
2. 前端專案初始化（Quasar + 路由 + Pinia + PocketBase SDK + 測試環境）
3. 核心業務邏輯 composables（純函數 + 屬性測試）
4. 功能頁面（認證 → 分類 → 商品 → 購買記錄 → 儀表板 → 價格趨勢）
5. 整合測試（MSW 模擬 PocketBase API）
6. 部署設定檔案（launchd plist + 部署腳本 + tailscale serve）

實作語言為 TypeScript（Vue 3 + Quasar），測試使用 Vitest + fast-check。

## Tasks

- [x] 1. 環境建置：PocketBase 安裝與 migration 檔設定
  - [x] 1.1 下載 PocketBase macOS ARM64 執行檔並初始化 superuser 帳號
    - 確認 PocketBase 最新穩定版（0.23 以上）與相容的 JS SDK 版本，將確切版本號寫回 design.md 外部依賴表
    - 下載該版本 PocketBase macOS ARM64 執行檔至 `WenDao/backend/`
    - 執行 `./pocketbase serve` 初次啟動
    - 透過 superuser UI（`http://localhost:8090/_/`）建立超級管理員帳號（非系統預設共用帳號）
    - _對應：REQ-1_

  - [x] 1.2 撰寫 migration 檔建立 users（Auth Collection）與 categories（Base Collection）及其欄位
    - 在 `backend/pb_migrations/` 撰寫 JS migration 檔
    - users：修改 PocketBase 自動建立的系統預設 users，`name`（text）改為 required；登入識別欄位只用 email（0.23+ 無 username）、關閉 OAuth2、不開啟 email verification
    - categories：設定 `name`（text, unique, required, max 100）
    - 執行 `./pocketbase migrate up` 套用，並在 superuser UI 確認
    - _對應：REQ-1, REQ-2, AC-2.1_

  - [x] 1.3 撰寫 migration 檔建立 custom_fields Collection（EAV 定義層）及其欄位
    - `category`（relation → categories, required, Cascade）
    - `field_name`（text, required, max 100）
    - `field_type`（select, required, 選項 `['number', 'text']`）
    - `is_quantity_component`（bool, optional，沒填存 false）
    - `display_order`（number, optional，沒填存 0, min 0）
    - _對應：REQ-4, AC-4.1, AC-4.2_

  - [x] 1.4 撰寫 migration 檔建立 products Collection 及其欄位
    - `category`（relation → categories, required, Restrict）
    - `brand`（text, required, max 100）
    - `name`（text, required, max 200）
    - `unit`（text, required, max 20）— 計價單位
    - `consumption_unit`（text, optional, max 20）— 消耗單位
    - `consumption_rate`（number, optional, min 0.01）
    - `consumption_period`（select, optional, 選項 `['monthly', 'weekly']`）
    - `remaining_quantity`（number, optional, min 0）— 手動輸入的剩餘數量
    - `remaining_updated_at`（date, optional）— 剩餘數量更新日期（前端自動填入當天）
    - `consumption_note`（text, optional, max 500）
    - _對應：REQ-3, AC-3.1, AC-3.2, REQ-7, AC-7.1, AC-7.9_

  - [x] 1.5 撰寫 migration 檔建立 purchase_records Collection 及其欄位
    - `product`（relation → products, required, Restrict）
    - `purchase_date`（date, required）
    - `store`（text, required, max 100）
    - `total_price`（number, required, min 0.01）
    - `quantity`（number, optional, min 0）
    - `unit_price`（number, optional）
    - `user`（relation → users, required）
    - _對應：REQ-5, AC-5.1, AC-5.6, REQ-6, AC-6.1_

  - [x] 1.6 撰寫 migration 檔建立 purchase_record_field_values Collection（EAV 值層）及其欄位
    - `purchase_record`（relation → purchase_records, required, Cascade）
    - `custom_field`（relation → custom_fields, required, **Restrict**）
    - `field_value`（text, required, max 255）
    - _對應：REQ-4, AC-4.1, AC-4.5, AC-4.8_

  - [x] 1.7 設定所有 Collection 的 API Rules
    - 所有 Collection List/View/Create/Update/Delete 設為 `@request.auth.id != ""`（已登入使用者可操作）
    - users 的 Create/Update/Delete 設為 **Locked（null，僅 superuser 可透過 superuser UI 操作）**
    - 注意：空字串 `""` 代表公開，必須設為 Locked
    - _對應：REQ-1, AC-1.3_

  - [x] 1.8 建立種子資料（透過 migration 或 superuser UI 手動建立）
    - 建立 2 位使用者（Auth Collection）：由使用者在 superuser UI 手動建立；密碼與真實 email **不寫進任何進 git 的檔案**（repo 為 public）
    - 建立 2 個範例分類（如「衛生紙」「蔬菜」）
    - 為「衛生紙」分類建立 3 個自訂欄位：抽數(單包)[數量組成]、包數[數量組成]、層數[一般資訊]
    - 建立 1 個範例商品：春風抽取式衛生紙（brand=春風、name=抽取式衛生紙、unit=抽、consumption_unit=包）
    - _對應：REQ-1, REQ-2, REQ-4, REQ-7_

- [ ] 2. 前端專案初始化：Quasar + Pinia + PocketBase SDK + 路由
  - [x] 2.1 建立 Quasar 專案（Vue 3 + Vite + PWA 模式）與基礎設定
    - 使用 `npm init quasar` 建立 SPA 專案於 `frontend/` 目錄，啟用 Pinia、Vue Router
    - 執行 `quasar mode add pwa`；`quasar.config.ts` 設定 Workbox `GenerateSW`，PWA manifest 寫在 `src-pwa/manifest.json`
    - _對應：REQ-9, AC-9.2_

  - [x] 2.2 安裝依賴並設定建置工具
    - 安裝 `pocketbase`（JS SDK，版本依 1.1 確認的相容版本，須 0.22 以上）、`chart.js`、`fast-check`
    - 設定 `quasar.config.ts` 的 `build.defineEnv` 變數 `VITE_POCKETBASE_URL`（正式環境：`/`，與 pb_public 同網址；開發環境：`http://localhost:8090`）
    - _對應：REQ-9_

  - [ ] 2.3 建立 PocketBase client 初始化（src/lib/pocketbase.ts）與 boot 檔
    - 初始化 PocketBase client，匯出 `pb` 實例
    - 建立 `src/boot/pocketbase.ts`：啟動時從 authStore 恢復登入狀態、監聽 token 變化
    - _對應：REQ-1, AC-1.7_

  - [ ] 2.4 建立 Vue Router 路由設定與路由守衛
    - 定義 12 條路由（login、dashboard、categories、products、purchases 等含 :id 參數路由）
    - 實作 `beforeEach` 守衛：未登入存取受保護路由導向 /login；已登入存取 /login 導向 /
    - _對應：REQ-1, AC-1.3, AC-1.1_

  - [ ] 2.5 建立 Pinia stores 骨架
    - 建立 `auth.ts`、`category.ts`、`product.ts`、`purchase.ts` 的 state/getters/actions 骨架
    - _對應：REQ-1, REQ-2, REQ-3, REQ-5_

  - [ ] 2.6 建立 MainLayout 導覽列與使用者資訊
    - 導覽列連結：首頁、購買記錄、商品列表、分類管理
    - 右上角顯示登入使用者名稱與登出按鈕（登出行為待 5.4 接上）
    - _對應：REQ-1, AC-1.5_

  - [ ] 2.7 建立訊息常數檔（src/constants/messages.ts）
    - 集中定義所有訊息常數（對照 design.md v2.1 訊息表）：
    - 成功訊息：MSG-001~010
    - 錯誤訊息：ERR-001~019
    - 確認對話框：CONFIRM-001~002
    - 系統狀態：STATUS-001~008
    - 供各頁面搭配 Quasar Notify plugin 統一使用
    - _對應：REQ-2, REQ-3, REQ-4, REQ-5, REQ-6, REQ-7, REQ-8_

  - [ ] 2.8 設定 Vitest 與 fast-check 測試環境
    - 設定 Vitest config、加入 fast-check、Vue Test Utils
    - 建立 `src/composables/__tests__/` 測試目錄
    - _對應：REQ-6, REQ-7, REQ-8_

- [ ] 3. 核心業務邏輯 composables 與屬性測試
  - [ ] 3.1 實作 calculateUnitPrice composable
    - `useUnitPrice.ts`：總價 ÷ 數量，保留 4 位小數；quantity 為 0 或 null 回傳 null
    - _對應：REQ-6, AC-6.1, AC-6.5_

  - [ ] 3.2 屬性測試 Property 1：單位均價計算正確性
    - **Property 1: Unit price calculation correctness**
    - **Validates: Requirements 6.1, 6.5**
    - 生成隨機 total_price > 0 與 quantity > 0，驗證 unit_price = total / qty（4 位小數）；生成 quantity = 0 / null，驗證回傳 null
    - _對應：REQ-6, AC-6.1, AC-6.5_

  - [ ] 3.3 實作 calculateQuantityFromComponents composable
    - `useQuantityFromComponents.ts`：將「數量組成欄位」值相乘為總數量；無數量組成欄位回傳 null；輸入 <= 0 時前端驗證回報錯誤
    - _對應：REQ-4, AC-4.3, AC-4.6_

  - [ ] 3.4 屬性測試 Property 2,3：數量組成計算與非正值驗證
    - **Property 2: Quantity from component fields**
    - **Property 3: Quantity component field validation**
    - **Validates: Requirements 4.3, 4.6**
    - 生成隨機正整數集合，驗證乘積正確；生成空集合，驗證回傳 null；生成非正值，驗證被拒並顯示 ERR-008
    - _對應：REQ-4, AC-4.3, AC-4.6_

  - [ ] 3.5 實作 calculateHistoricalAverage composable
    - `useHistoricalAverage.ts`：所有有效 unit_price 的算術平均，保留 4 位小數；全為 null 回傳 null
    - _對應：REQ-6, AC-6.3_

  - [ ] 3.6 屬性測試 Property 4：歷史均價計算
    - **Property 4: Historical average calculation**
    - **Validates: Requirements 6.3**
    - 生成隨機 unit_price 集合，驗證平均值 = mean 且 min <= avg <= max
    - _對應：REQ-6, AC-6.3_

  - [ ] 3.7 實作 calculateDepletionDate composable
    - `useDepletionEstimate.ts`：參數改為 `(remainingQty, remainingUpdatedAt, consumptionRate, period)`
    - 公式：耗盡日期 = remainingUpdatedAt + (remainingQty ÷ consumptionRate) × 週期天數（monthly=30, weekly=7）
    - 速率未設定或 <= 0 回傳 null；remainingQty 為 null 回傳 null
    - _對應：REQ-7, AC-7.2_

  - [ ] 3.8 屬性測試 Property 5：消耗日期計算
    - **Property 5: Depletion date calculation**
    - **Validates: Requirements 7.2**
    - 生成隨機 remainingQty、remainingUpdatedAt、rate、period，驗證耗盡日期 = remainingUpdatedAt + (remainingQty/rate) * period_days；生成 null remainingQty，驗證回傳 null
    - _對應：REQ-7, AC-7.2_

  - [ ] 3.9 實作 getDepletionStatus composable
    - `useDepletionStatus.ts`：依耗盡日期分類為 unset / no_remaining / normal / soon / depleted
    - 邊界：`diffDays < 0` → depleted；`0 ≤ diffDays ≤ 7` → soon（含今天）；`diffDays > 7` → normal
    - 未設定速率回傳 unset；已設定速率但 remainingQty 為 null 回傳 no_remaining
    - _對應：REQ-7, AC-7.4, AC-7.5, AC-7.7, AC-7.12_

  - [ ] 3.10 屬性測試 Property 6：消耗狀態分類
    - **Property 6: Depletion status classification**
    - **Validates: Requirements 7.4, 7.5, 7.7, 7.12**
    - 生成涵蓋未設定速率、未設定剩餘數量、正常、即將耗盡（0 ≤ diffDays ≤ 7，含 diffDays=0 今天）、已耗盡的隨機日期，驗證狀態分類正確
    - _對應：REQ-7, AC-7.4, AC-7.5, AC-7.7, AC-7.12_

  - [ ] 3.11 實作 compareWithHistoricalAverage composable
    - `usePriceComparison.ts`：比較當次單位均價與歷史均價，回傳 'higher' / 'lower' / 'equal' / 'na'
    - 參數改為可接受 null，任一方為 null 時回傳 'na'
    - _對應：REQ-8, AC-8.9, AC-8.10_

  - [ ] 3.12 屬性測試 Property 7：價格比較
    - **Property 7: Price comparison with historical average**
    - **Validates: Requirements 8.9, 8.10**
    - 生成隨機 unit_price 與 historical_average，驗證比較結果正確；生成 null 輸入，驗證回傳 'na'
    - _對應：REQ-8, AC-8.9, AC-8.10_

- [ ] 4. Checkpoint — 確認核心邏輯測試通過
  - 執行 `vitest --run` 確認所有 composables 單元測試與屬性測試通過，有問題時詢問使用者。

- [ ] 5. 認證功能：登入頁面與 auth store
  - [ ] 5.1 實作 useAuthStore
    - login(email, password) 呼叫 `pb.collection('users').authWithPassword`，儲存 user/token
    - logout() 清除 authStore；getters: isAuthenticated, displayName
    - _對應：REQ-1, AC-1.1, AC-1.6, AC-1.7_

  - [ ] 5.2 實作 Login 頁面
    - email/密碼輸入欄位；登入成功導向首頁 `/`（儀表板）；登入失敗顯示 ERR-001「帳號或密碼錯誤，請重新輸入」
    - _對應：REQ-1, AC-1.1, AC-1.2_

  - [ ] 5.3 實作路由守衛與登入狀態保持
    - 未登入存取功能頁面導向 /login；已登入保持登入狀態（PocketBase SDK 自動管理 token）
    - _對應：REQ-1, AC-1.3, AC-1.7_

  - [ ] 5.4 實作登出按鈕與右上角使用者名稱顯示
    - MainLayout 右上角顯示 displayName 與登出按鈕；點擊登出結束登入並導向 /login
    - _對應：REQ-1, AC-1.5, AC-1.6_

  - [ ] 5.5 撰寫認證單元與整合測試
    - 正確帳密登入成功（EXAMPLE）、錯誤密碼失敗（EXAMPLE）、登出清除 authStore（EXAMPLE）
    - 未登入存取被攔截重定向、session 持久性（mock PocketBase SDK）
    - _對應：REQ-1, AC-1.1, AC-1.2, AC-1.3, AC-1.6, AC-1.7_

- [ ] 6. 分類管理頁面
  - [ ] 6.1 實作 useCategoryStore
    - fetchCategories / createCategory / updateCategory / deleteCategory；建立前查詢重複名稱驗證
    - _對應：REQ-2, AC-2.1, AC-2.2, AC-2.7_

  - [ ] 6.2 實作 Categories 列表頁面
    - 顯示所有分類清單；內含新增分類表單
    - _對應：REQ-2, AC-2.1_

  - [ ] 6.3 實作分類新增與驗證
    - 空名稱顯示 ERR-002「分類名稱不可為空」；重複名稱顯示 ERR-003「此分類名稱已存在，請使用其他名稱」；成功顯示 MSG-001
    - _對應：REQ-2, AC-2.2, AC-2.3, AC-2.4_

  - [ ] 6.4 實作分類刪除與關聯檢查
    - 刪除有商品的分類顯示 ERR-004「此分類下仍有商品，無法刪除」；刪除空分類顯示 MSG-002「分類刪除成功」
    - _對應：REQ-2, AC-2.5, AC-2.6_

  - [ ] 6.5 實作 CategoryEdit 頁面（分類名稱編輯與自訂欄位管理）
    - 分類名稱編輯：修改後空名稱顯示 ERR-002、與其他分類重複顯示 ERR-003、成功顯示 MSG-008「分類更新成功」
    - 自訂欄位管理：新增/編輯分類的自訂欄位（欄位名稱、型別、標記數量組成欄位、顯示順序）
    - 自訂欄位名稱重複顯示 ERR-017「此欄位名稱已存在於此分類」
    - 刪除有購買記錄使用的自訂欄位顯示 ERR-018「此欄位已有購買記錄使用，無法刪除」；刪除未使用的顯示 MSG-009「欄位刪除成功」
    - 修改有記錄使用的欄位之型別或 is_quantity_component 顯示 ERR-019「此欄位已有購買記錄使用，無法修改型別或計算設定」
    - 修改欄位名稱或顯示順序允許儲存，顯示 MSG-010「欄位更新成功」
    - _對應：REQ-2, AC-2.7, AC-2.8, AC-2.9, REQ-4, AC-4.1, AC-4.2, AC-4.7, AC-4.8, AC-4.9, AC-4.10, AC-4.11_

  - [ ] 6.6 撰寫分類管理測試
    - 建立分類成功（EXAMPLE）、空名稱被拒（EDGE_CASE）、重複名稱被拒（EDGE_CASE）
    - 刪除空分類成功（EXAMPLE）、刪除有商品分類被拒（整合，MSW 回傳 400）
    - 分類名稱更新成功（EXAMPLE）、更新為空被拒（EDGE_CASE）、更新為重複被拒（EDGE_CASE）
    - 欄位名稱重複被拒（EDGE_CASE）、刪除有紀錄欄位被拒（EDGE_CASE）、修改有紀錄欄位型別被拒（EDGE_CASE）
    - _對應：REQ-2, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-2.7, AC-2.8, AC-2.9, REQ-4, AC-4.7, AC-4.8, AC-4.10_

- [ ] 7. 商品管理頁面
  - [ ] 7.1 實作 useProductStore
    - fetchProducts / createProduct / updateProduct；建立前查詢同分類 brand+name（忽略大小寫/前後空白/全半角）重複驗證
    - _對應：REQ-3, AC-3.1, AC-3.6_

  - [ ] 7.2 實作 DepletionBadge 元件
    - 依 getDepletionStatus 顯示狀態標籤：unset 顯示 STATUS-002「未設定消耗速率」、no_remaining 顯示 STATUS-007「未設定剩餘數量」、soon 顯示 STATUS-003「即將耗盡」、depleted 顯示 STATUS-004「已耗盡」
    - _對應：REQ-7, AC-7.4, AC-7.5, AC-7.7, AC-7.12_

  - [ ] 7.3 實作 Products 列表頁面
    - 商品清單含預計耗盡日期與使用者手動輸入的剩餘數量（以消耗單位計）；以 DepletionBadge 醒目標示即將耗盡/已耗盡/未設定剩餘數量；可依分類篩選
    - _對應：REQ-7, AC-7.3, AC-7.4, AC-7.5, AC-7.12_

  - [ ] 7.4 實作 ProductNew 頁面
    - 品牌、品名、計價單位、消耗單位輸入；空品牌/品名顯示 ERR-005、未設定計價單位顯示 ERR-006、重複品牌品名顯示 ERR-007；成功顯示 MSG-003
    - _對應：REQ-3, AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.6_

  - [ ] 7.5 實作 ProductDetail 頁面
    - 顯示歷史均價、購買歷史（按日期新→舊）、消耗速率設定入口、剩餘數量；價格趨勢圖於 10.2 整合
    - _對應：REQ-6, AC-6.4, REQ-8, AC-8.2, AC-8.4_

  - [ ] 7.6 實作 ProductEdit 頁面
    - 設定消耗速率、消耗週期（monthly/weekly）、消耗單位（consumption_unit）、剩餘數量（remaining_quantity，負數顯示 ERR-015）、消耗規劃備註
    - 儲存剩餘數量時自動填入 remaining_updated_at 為當天日期
    - 設定消耗速率但未填消耗單位顯示 ERR-016「請設定消耗單位」
    - 更新成功顯示 MSG-007
    - _對應：REQ-7, AC-7.1, AC-7.8, AC-7.9, AC-7.10, AC-7.11_

  - [ ] 7.7 撰寫商品管理測試
    - 建立商品成功（EXAMPLE）、空品牌品名被拒（EDGE_CASE）、未設定單位被拒（EDGE_CASE）、重複品牌品名被拒（EDGE_CASE）
    - 剩餘數量輸入負數被拒 ERR-015（EDGE_CASE）、設定消耗速率但未填消耗單位被拒 ERR-016（EDGE_CASE）、儲存剩餘數量自動填入當天日期（EXAMPLE）
    - remaining_updated_at 超過 30 天顯示 STATUS-008、剛好 30 天不顯示（EDGE_CASE，對應 7.8）
    - _對應：REQ-3, AC-3.1, AC-3.3, AC-3.4, AC-3.6, REQ-7, AC-7.9, AC-7.10, AC-7.11, AC-7.14_

  - [ ] 7.8 實作剩餘數量久未更新提醒
    - 在商品列表與商品詳情頁偵測 `remaining_updated_at` 距今超過 30 天
    - 顯示 STATUS-008「剩餘數量已久未更新」提示
    - _對應：REQ-7, AC-7.14_

- [ ] 8. 購買記錄頁面
  - [ ] 8.1 實作 usePurchaseStore
    - fetchRecords（支援分類/日期區間篩選、按日期降序）、createRecord（前端計算 quantity 與 unit_price 後寫入，含 EAV 值寫入）、updateRecord、deleteRecord
    - 日期區間篩選使用 `pb.filter()` 安全組字串，包含結束日當天
    - _對應：REQ-5, AC-5.1, AC-5.6, AC-5.7, REQ-6, AC-6.1, REQ-8, AC-8.1_

  - [ ] 8.2 實作 CustomFieldInput 動態自訂欄位元件
    - 依商品所屬分類的 custom_fields 動態渲染輸入欄位；數量組成欄位輸入 <= 0 顯示 ERR-008
    - _對應：REQ-4, AC-4.5, AC-4.6_

  - [ ] 8.3 實作 Purchases 列表頁面
    - 顯示所有購買記錄（日期、購買地點、商品名稱、分類、數量、總價、單位均價、新增者），按日期新→舊；分類篩選、日期區間篩選；結束日期早於開始日期顯示 ERR-012
    - _對應：REQ-8, AC-8.1, AC-8.3, AC-8.5, AC-8.6, AC-8.7_

  - [ ] 8.4 實作 PurchaseNew 頁面
    - 必填欄位（購入日期、購買地點、商品、總價）；動態自訂欄位（CustomFieldInput）；前端計算 quantity 與 unit_price 預覽；未填必填欄位顯示 ERR-009、總價 <= 0 顯示 ERR-010（且不顯示 ERR-009）、未來日期顯示 ERR-011；成功顯示 MSG-004
    - **存檔成功後，前端跳出 QDialog 詢問「是否更新此商品的剩餘數量？」（CONFIRM-002）**，預先帶入目前的剩餘數量（尚未設定時留空），使用者修改後手動儲存，更新 products 的 remaining_quantity 與 remaining_updated_at
    - _對應：REQ-4, AC-4.3, AC-4.4, AC-4.6, REQ-5, AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.10, AC-5.11, REQ-6, AC-6.1, REQ-7, AC-7.13_

  - [ ] 8.5 實作 PurchaseDetail 頁面
    - 顯示單筆記錄詳情（含新增者名稱 expand.user.name 與新增時間 created）、單位均價、自訂欄位值
    - 顯示當次單位均價與歷史均價比較結果（高於/低於/等於）；當次或歷史均價為 null 時顯示 STATUS-006「無法比較」
    - _對應：REQ-5, AC-5.6, REQ-6, AC-6.2, AC-6.5, REQ-8, AC-8.9, AC-8.10_

  - [ ] 8.6 實作 PurchaseEdit 頁面
    - 編輯表單（含自訂欄位）；更新成功顯示 MSG-005「記錄更新成功」
    - 編輯時重新計算 quantity / unit_price，並同步更新 EAV 值
    - _對應：REQ-5, AC-5.7, REQ-6, AC-6.1_

  - [ ] 8.7 實作刪除確認對話框
    - 點擊刪除顯示確認對話框 CONFIRM-001「確定要刪除此筆記錄嗎？」；確認後刪除並顯示 MSG-006「記錄刪除成功」
    - _對應：REQ-5, AC-5.8, AC-5.9_

  - [ ] 8.8 撰寫購買記錄測試
    - 總價 <= 0 被拒（EDGE_CASE）、未來日期被拒（EDGE_CASE）、必填缺失被拒（EDGE_CASE）、結束日期早於開始被拒（EDGE_CASE）
    - 前端計算寫入驗證（整合，MSW 驗證 API 請求含計算後 quantity/unit_price）
    - 存檔後提示更新剩餘數量（整合，驗證 QDialog 彈出）
    - _對應：REQ-5, AC-5.3, AC-5.4, AC-5.5, AC-5.11, REQ-7, AC-7.13, REQ-8, AC-8.7_

- [ ] 9. 儀表板與補貨提醒
  - [ ] 9.1 實作 Dashboard 頁面
    - 顯示所有「即將耗盡」與「已耗盡」商品提醒清單；以 DepletionBadge 標示狀態
    - _對應：REQ-7, AC-7.4, AC-7.5, AC-7.6_

  - [ ] 9.2 撰寫儀表板測試
    - MSW 回傳即將耗盡/已耗盡商品，驗證提醒清單正確顯示
    - _對應：REQ-7, AC-7.6_

- [ ] 10. 價格趨勢圖
  - [ ] 10.1 實作 PriceTrendChart 元件
    - 使用 Chart.js（npm 安裝）折線圖呈現單位均價歷史趨勢
    - 無購買記錄（unit_price 全為 null）時顯示空狀態 STATUS-005「尚無足夠資料顯示趨勢圖」
    - _對應：REQ-8, AC-8.8_

  - [ ] 10.2 整合 PriceTrendChart 至 ProductDetail 頁面
    - 在商品詳情頁顯示該商品單位均價的歷史趨勢圖
    - _對應：REQ-8, AC-8.8_

  - [ ] 10.3 撰寫價格趨勢圖測試
    - 驗證圖表元件在有資料時渲染、無資料時顯示空狀態 STATUS-005
    - _對應：REQ-8, AC-8.8_

- [ ] 11. Checkpoint — 確認所有功能頁面測試通過
  - 執行 `vitest --run` 確認各功能頁面單元測試與屬性測試通過，有問題時詢問使用者。

- [ ] 12. 整合測試
  - [ ] 12.1 設定 MSW 模擬 PocketBase API 回應
    - 建立 MSW handler 模擬各 Collection 的 CRUD 回應與認證流程
    - _對應：REQ-1 ~ REQ-8_

  - [ ] 12.2 撰寫認證流程整合測試
    - 未登入存取受保護路由被重定向至 /login、session 持久性（頁面刷新後 authStore 從 localStorage 恢復）
    - _對應：REQ-1, AC-1.3, AC-1.7_

  - [ ] 12.3 撰寫分類與商品 CRUD 整合測試
    - 刪除有商品的分類被拒（MSW 回傳 400，驗證顯示 ERR-004）、建立商品流程
    - _對應：REQ-2, AC-2.5, REQ-3, AC-3.1_

  - [ ] 12.4 撰寫購買記錄建立整合測試
    - 登入後建立記錄，驗證 user 欄位設為當前使用者 ID；填入總價與數量組成欄位值，驗證 API 請求包含計算後的 quantity 與 unit_price；動態自訂欄位正確顯示與寫入
    - 建立記錄後驗證 QDialog 彈出詢問是否更新剩餘數量
    - _對應：REQ-4, AC-4.5, REQ-5, AC-5.6, REQ-6, AC-6.1, REQ-7, AC-7.13_

  - [ ] 12.5 撰寫查詢篩選整合測試
    - 購買記錄按日期降序排列；分類篩選與日期區間篩選時驗證 API 請求 filter 參數正確（含結束日當天）
    - 購買記錄列表含新增者欄位
    - _對應：REQ-8, AC-8.1, AC-8.3, AC-8.5, AC-8.6_

  - [ ] 12.6 撰寫儀表板補貨提醒整合測試
    - MSW 回傳即將耗盡/已耗盡商品，渲染首頁驗證提醒清單正確
    - _對應：REQ-7, AC-7.6_

  - [ ] 12.7 撰寫響應式設計測試
    - 以手機 viewport 尺寸渲染頁面，驗證 Quasar RWD class 正確套用
    - _對應：REQ-9, AC-9.2_

- [ ] 13. 部署設定檔案建立
  - [ ] 13.1 建立 launchd plist 設定檔、前端部署腳本與 tailscale serve 設定步驟
    - 建立 `deploy/com.homeerp.pocketbase.plist`（PocketBase 常駐執行、開機自動啟動、RunAtLoad、KeepAlive）
    - PocketBase binary 路徑：`/Users/cooqle/Projects/WenDao/backend/pocketbase`，WorkingDirectory：`/Users/cooqle/Projects/WenDao/backend`
    - 建立前端 build 部署腳本：`npm run build` 後將 `dist/` 複製到 `backend/pb_public/`
    - 撰寫 `tailscale serve` 設定步驟至 `deploy/README.md`，包含：啟用 MagicDNS、啟用 HTTPS Certificates、執行 `tailscale serve https / http://localhost:8090`
    - _對應：REQ-9_

  - [ ] 13.2 啟用 Quasar PWA 模式與建置驗證
    - 確認 `src-pwa/manifest.json` 的 PWA manifest（名稱、圖示、display: standalone）與 `quasar.config.ts` 的 Workbox service worker 設定
    - 執行 `quasar build -m pwa` 驗證產出含 manifest 與 service worker
    - _對應：REQ-9, AC-9.1, AC-9.2_

## Notes

- 所有測試任務皆為必做，驗收條件需對應到自動化測試
- 每個子任務對應特定需求編號，方便測試對應與追蹤
- Checkpoint 任務用於階段性驗證，確保增量正確性
- 屬性測試驗證通用正確性質，單元測試驗證具體範例與邊界條件
- 資料表建立透過 `pb_migrations/` JS 檔，版本管理後換機時可自動套用；superuser 帳號仍在 superuser UI 手動建立
- 種子使用者密碼不可寫入 migration 檔（repo 可能公開），從環境變數讀取或由使用者在 superuser UI 手動建立
- Tailscale 設定為手動操作（Mac mini 與手機各安裝 App 並登入同帳號），不列入 coding task；部署時由使用者依 design.md「Tailscale 設定」段落手動完成
- 實際部署（執行 `launchctl load`、啟動服務、執行 `tailscale serve`）為使用者手動操作，不在 coding task 範圍
- 訊息文字（MSG/ERR/CONFIRM/STATUS）已於 2.7 集中定義，各頁面一律引用常數檔，不重複寫死字串

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "2.2", "2.8"] },
    { "id": 2, "tasks": ["1.7", "2.3", "2.4", "2.5", "2.6", "2.7"] },
    { "id": 3, "tasks": ["1.8", "3.1", "3.3", "3.5", "3.7", "3.9", "3.11"] },
    { "id": 4, "tasks": ["3.2", "3.4", "3.6", "3.8", "3.10", "3.12"] },
    { "id": 5, "tasks": ["5.1", "6.1", "7.1", "8.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4", "6.2", "7.2", "7.3", "8.2", "8.3"] },
    { "id": 7, "tasks": ["5.5", "6.3", "6.4", "6.5", "6.6", "7.4", "7.5", "7.6", "7.8", "8.4", "8.5", "8.6", "8.7"] },
    { "id": 8, "tasks": ["7.7", "8.8", "9.1", "10.1"] },
    { "id": 9, "tasks": ["9.2", "10.2"] },
    { "id": 10, "tasks": ["10.3", "12.1"] },
    { "id": 11, "tasks": ["12.2", "12.3", "12.4", "12.5", "12.6", "12.7"] },
    { "id": 12, "tasks": ["13.1", "13.2"] }
  ]
}
```
