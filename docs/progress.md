# 專案進度紀錄（progress.md）

> 版本：v8.1（2026-11-04）
> 變更摘要：v8.1 task 10.2（趨勢圖放進商品詳情）完成；新增 e2e product-trend；design.md v4.5。
> v8.0 價格趨勢圖設計稿確認並寫入 design.md v4.4；task 10.1（PriceTrendChart）完成。
> v7.9 task 9.2（儀表板測試對照）完成，task 9 全部完成；新增「task 9.2 測試對照」一節。
> v7.8 首頁設計稿確認（選 A）並寫入 design.md v4.3；task 9.1（儀表板）完成；新增 e2e dashboard。
> v7.7 task 9 首頁設計稿 4 張放上設計稿（Dash、Dash-Grouped、Dash-Clear、Dash-First），待使用者確認。
> v7.6 K-17～K-20 已回寫 design.md v4.2（使用者同意）。
> v7.5 task 8.8（購買記錄測試對照）完成，task 8 全部完成；新增「task 8.8 測試對照」一節。
> v7.4 task 8.7（刪除確認對話框）完成；新增 e2e purchase-delete；K-20 待同意回寫。
> v7.3 task 8.6（編輯購買記錄）完成；新增 e2e purchase-edit；設計稿更名為「溫叨@Pantry」；K-19 待同意回寫。
> v7.2 App 更名「溫叨Pantry」→「溫叨@Pantry」（程式、PWA、規格、文件）；requirements v1.5、design v4.1。
> v7.1 task 8.5（購買記錄詳情）完成；新增 e2e purchase-detail；K-18 待同意回寫。
> v7.0 交接整理：「目前位置」更新到 task 8.4；工作慣例補上驗證順序、回報格式、e2e 與 Quasar 對話框的注意事項。
> v6.9 task 8.4（新增購買記錄）完成；新增 e2e purchase-new；K-17 待同意回寫。
> v6.8 setup-frontend.md v1.9 新增「在手機上測試（家裡 Wi-Fi）」；待使用者回家後在手機上測試。
> v6.7 task 8.3（購買記錄列表）完成；新增 e2e purchases。
> v6.6 task 8.2（CustomFieldInput）完成。
> v6.5 購買記錄設計寫入 design.md v4.0。
> v6.4 Logo A（台北市門牌 5888）定稿：BrandLogo 元件、App / 分頁圖示產生器；design.md v3.9。
> v6.3 App 更名「家庭ERP」→「溫叨Pantry」（程式、PWA、規格、文件）；requirements v1.4、design v3.8、tasks v1.7。
> v6.2 購買記錄設計稿確認（8 張），使用者同意 4 項提案；尚未寫入 design.md。
> v6.1 K-16 已回寫 design.md v3.7；刪除未使用的 stores/notImplemented.ts（使用者同意）。
> v6.0 task 8.1（usePurchaseStore）完成；fakePocketBase 擴充；新增契約測試 e2e purchase-contract；新增 K-16（待使用者同意回寫）。
> v5.9 task 7.8（久未更新提醒）完成，task 7（商品管理）全部完成；design.md v3.6；新增 e2e stale。
> v5.8 task 7.7（商品管理測試）完成：對照清單、補 9 項邊界測試、vitest 固定時區 Asia/Taipei。
> v5.7 新增商品頁分類改為預設留空（使用者決定，design.md v3.5）。
> v5.6 task 7.6（更新消耗設定頁）完成；新增 e2e product-edit。
> v5.5 task 7.5（商品詳情頁）完成；購買記錄讀取提前實作（design.md v3.4、tasks.md v1.6）；新增 e2e product-detail。
> v5.4 task 7.4（新增商品頁）完成；新增 e2e product-new。
> v5.3 商品列表篩選記在網址（design.md v3.3）；`lint:check` 補上 prettier `--check`。
> v5.2 task 7.3（商品列表頁）完成；新增 e2e products。
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

**實作中。** task 1（環境建置）全部完成；**task 1～9、10.1～10.2 完成**，下一步是 task 10.3（趨勢圖測試對照）。commit 前執行 `npm test`（目前 738 項）。

> **2026-11-01 起短期內不使用 Kiro**：規格需要修改時，由 Claude Code 先問使用者、同意後直接改（含版本號與變更摘要）。
> **task 2.6 之前**：先用已安裝的設計 skills（ui-ux-pro-max、taste-skill）做 2～3 種風格的手機畫面稿（儀表板、新增購買記錄），使用者選定後整理成 UI 設計規範寫進規格。

```
規格撰寫 ──► 規格審查 ──► Kiro 修正 + BDD ──► 第二輪審查 ──► 實作（10.2 完成，下一步 10.3）
  (完成)       (完成)          (完成)            (完成)        ◄ 目前在這裡
```

## 規格文件（正本在 `.kiro/specs/home-erp/`，`docs/specs/` 是指向它的捷徑）

| 文件 | 版本 |
|---|---|
| requirements.md | v1.5 |
| design.md | v4.5 |
| tasks.md | v1.7（勾選狀態持續更新） |
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
| 2026-11-02 | **task 7.3 追加（使用者同意）**：篩選記在網址 `?category=<id>`（`router.replace`，上一頁 / 重新整理保留，不存在的分類當成全部）；新增 4 項測試，全專案 363 項，2 種故意改壞皆被抓到；e2e products 10 步驟通過。`npm run lint:check` 的 prettier 補上 `--check`（原本只印出結果、永遠成功），已確認排版錯誤會讓它失敗。方向鍵切換篩選：使用者決定不做 | design.md v3.3 |
| 2026-11-02 | **task 7.4**：`pages/ProductNew.vue`（依設計稿 Prod-New：分類、品牌＋品名並排、計價單位與常用單位按鈕、消耗單位選填與白話說明；錯誤顯示在送出按鈕上方並標紅框、焦點移到第一個有問題的欄位、修改後拿掉紅框；成功 MSG-003 並 `replace` 到商品詳情；從篩選過的列表進來預先選好分類，返回時回到同一篩選；沒有分類時引導到分類管理）。`lib/errors.ts` 新增 `DuplicateProductError`（帶出已存在的商品，畫面顯示「已有『Kleenex 舒潔衛生紙』」）。新增 21 項測試，全專案 384 項；4 種故意改壞皆被抓到。e2e `product-new.mjs` 10 步驟通過（BDD 5 個情境） | — |
| 2026-11-02 | **task 7.5**：`pages/ProductDetail.vue`（依設計稿 Prod-Detail：商品卡與狀態標籤、剩餘數量 / 預計用完（依狀態上色）/ 歷史均價（N 筆）三個資訊塊、備註、「更新剩餘數量與消耗設定」入口、購買記錄新到舊附新增者頭像；返回箭頭回到原本的列表篩選；找不到商品、載入失敗重試）。**使用者同意**在 7.5 先做購買記錄讀取：`usePurchaseStore.fetchByProduct`、`fetchUsers`；新增 `lib/purchaseView.ts`、`lib/personTone.ts`。新增 36 項測試，全專案 420 項；4 種故意改壞皆被抓到。e2e `product-detail.mjs` 9 步驟通過；**e2e 發現**購買記錄標題被 Quasar 預設 h2 行高撐開 → 已修正 | design.md v3.4、tasks.md v1.6 |
| 2026-11-02 | **task 7.6**：`pages/ProductEdit.vue`（依設計稿 Prod-Edit：剩餘數量框內附消耗單位、每月 / 每週、用掉多少、消耗單位、備註；表單下方即時預估用完日與算式（`lib/productView.ts` 的 `depletionPreview`，以今天為起點）；ERR-015 / 016 標紅框並聚焦；MSG-007 後從詳情進來的回上一頁、否則 replace 到詳情；取消、找不到商品、載入失敗重試）。新增 `lib/numberInput.ts`：數字欄位輸入時整理（去文字、全形轉半形、剩餘數量保留開頭負號讓 ERR-015 可觸發），不需新增「格式錯誤」訊息。新增 47 項測試，全專案 467 項；5 種故意改壞皆被抓到。e2e `product-edit.mjs` 10 步驟通過。**e2e 發現並修正**：正式 build 的 ESLint 擋下多餘型別斷言；負數時預估區與錯誤框文字重複；聚焦時紅框被藍色外框蓋掉 | — |
| 2026-11-03 | **task 7.4 追加（使用者決定）**：新增商品頁分類預設留空「請選擇分類」（灰色提示字），沒選送出顯示 ERR-009 並加一行「請在上方選擇分類」、標紅框並聚焦分類選單；從篩選過的列表進來仍預先選好；建立後進入詳情頁維持不變。另修正：連線錯誤時焦點不再跳到分類選單。全專案 468 項；e2e product-new 12 步驟通過。發現 `lint:check` 的檔案範圍不含 `.mjs`（e2e 腳本不受排版檢查，維持原狀） | design.md v3.5 |
| 2026-11-03 | **task 7.7**：對照清單逐項確認（見下方「task 7.7 測試對照」），7 個情境在 store 與頁面兩層都已涵蓋；STATUS-008 的判斷（30 / 31 / 32 天）已在 `productView.test.ts`，畫面顯示的測試隨 task 7.8 撰寫。補 9 項邊界測試：數字沒變也更新日期（store + 頁面）、清晨 00:30 / 深夜 23:59 儲存記成本地當天、剩餘數量 -0.01 / NaN / 無限大 → ERR-015、品牌只有全形空白 → ERR-005。`vitest.config.ts` 固定 `TZ=Asia/Taipei`（外部設 TZ=UTC 也得到相同結果）。全專案 476 項；4 種故意改壞皆被抓到 | — |
| 2026-11-03 | **task 7.8**：久未更新提醒（AC-7.14，使用者選擇顯示方式）。`DepletionBadge` 新增 `stale`：每列只放一個標籤，已耗盡 / 即將耗盡優先，否則 STATUS-008（灰色 12px）；`productSummary` 在急迫＋久未更新時開頭加「M/D 更新 · 」；商品詳情剩餘數量寫「上次更新 M/D」並在更新按鈕上方加提示列。新增 14 項測試（含 BDD 32 天、30 / 31 天邊界），3 項舊測試因資料本身距今 31～32 天而更新預期；全專案 490 項；4 種故意改壞皆被抓到。e2e `stale.mjs` 8 步驟（含「數字不改直接儲存 → 提醒消失」）。**e2e 發現**：一般 CSS 的 `<style>` 裡用了 `//` 註解，Vitest 不處理樣式所以沒抓到，正式 build 才失敗 → 改 `/* */`。**task 7（商品管理）全部完成** | design.md v3.6 |
| 2026-11-03 | **task 8.1**：`usePurchaseStore` 的 fetchRecords（分類 `product.category`、日期區間含結束日當天、結束早於開始 ERR-012、新到舊、同日後建立在前；getter `views`）、createRecord（前端算 quantity / unit_price，缺失寫 0；新增者 = 登入者；EAV 寫到一半失敗會刪掉剛建立的記錄；資料庫擋下總價 → ERR-010）、updateRecord（重算、新增者不變、EAV 同步：改了更新 / 清空刪除 / 新填新增 / 換商品刪除舊值）、deleteRecord（cascade）。新增 `lib/purchaseForm.ts`（validatePurchase、computePurchase、fieldValuesToSave，8.4 / 8.6 頁面共用）與 `FieldsValidationError`（每個欄位各自的訊息，AC-5.3）。`fakePocketBase` 擴充：比較運算子 >= <= > <、關聯欄位 `product.category`、cascade 刪除（附 5 項自身測試）。移除 task 2.5 的「尚未實作」骨架測試 2 項。新增 54 項測試，全專案 539 項；6 種故意改壞皆被抓到。**新增契約測試** `e2e/purchase-contract.mjs`：用同樣的 SDK 查詢對真正的 PocketBase 驗證 fake 的假設，7 項全部符合；**發現** PocketBase 的 created 只到毫秒，連續建立可能同一毫秒而排序不定（實際使用不影響，腳本已間隔 20ms） | — |
| 2026-11-03 | **購買記錄設計稿**：ui-ux-pro-max 查表單 / 篩選 / 對話框 UX 規則後，設計稿新增「購買記錄（task 8）」一排 8 張：Pur-List（分類＋日期篩選）、Pur-List-Range（ERR-012）、Pur-New（有包裝規格，即 8.2 CustomFieldInput）、Pur-New-Error（欄位下方錯誤＋上方錯誤摘要）、Pur-New-Qty（沒有包裝規格，直接輸入數量、文字欄位）、Pur-Remain（CONFIRM-002 對話框）、Pur-Detail（價格比較，圖示＋文字＋顏色）、Pur-Delete（CONFIRM-001）。使用者確認並同意 4 項提案（見重要決定紀錄）。已寫入 design.md v4.0「購買記錄」段落 | 設計稿 Pur-*、design.md v4.0 |
| 2026-11-03 | **task 8.2**：`components/CustomFieldInput.vue`（依 display_order 三欄並排；數字欄位 inputmode=decimal、輸入時整理成數字且不收負號；文字欄位原樣；每欄標示「算數量 / 只記錄」；數量組成欄位離開時檢查，有填但不大於 0 → ERR-008 顯示在欄位下方（aria-invalid、aria-describedby），沒填不算錯；頁面送出的錯誤由 errors 傳入；leading 插槽給沒有包裝規格的分類放「數量」；v-model 為「欄位 id → 文字」，與 lib/purchaseForm.ts 的 fieldValues 相同）。新增 17 項測試，全專案 565 項；5 種故意改壞皆被抓到。元件還沒有頁面使用，**e2e（真實滑鼠鍵盤）與截圖比對留到 task 8.4** | — |
| 2026-11-03 | **task 8.3**：`pages/Purchases.vue`（依設計稿 Pur-List / Pur-List-Range：新到舊；每列新增者頭像、商品、「日期 · 地點 · 分類」、「數量 · 單位均價」、總價；分類按鈕＋開始 / 結束日期（含當天）；結束早於開始 → ERR-012 在結束日期下方、清單維持上一次結果；篩選記在網址 ?category=&start=&end=（replace，沿用商品列表的做法），網址上不合法的值當作沒有篩選；沒有記錄 / 篩選後沒有記錄＋清除篩選；載入失敗重試）。`lib/purchaseView.ts` 新增 `purchaseAmountLine`，商品詳情改用它（共用）。新增 24 項測試，全專案 589 項；5 種故意改壞皆被抓到。e2e `purchases.mjs`（真實滑鼠＋鍵盤輸入日期，Chrome 繁中語系）10 步驟通過。**e2e 發現並修正**：用鍵盤打日期時年份可打成 5～6 位數（如 202610-03-01）並寫進網址 → 日期欄位加 min 2000-01-01 / max 9999-12-31（Chrome 依 max 限制年份 4 位），頁面忽略格式不對的值（先寫回歸測試）。另外：這次 e2e 前沒先跑 typecheck / lint，正式 build 才抓到 exactOptionalPropertyTypes 與多餘型別斷言 → 已修正，之後依「單元測試 → lint → typecheck → e2e」順序 | — |
| 2026-11-03 | **在手機上測試的方法**：PocketBase 用 `--http=0.0.0.0:8090 --publicDir=../frontend/dist/pwa` 同時提供建置好的前端與 API，iPhone 連家裡 Wi-Fi 開 `http://<Mac IP>:8090`；已在 Mac 上用區域網路 IP 驗證首頁、history 路由、API 皆 200（尚未用實機測試）。整理進 setup-frontend.md 第 9 節＋疑難排解 5 項 | `docs/setup-frontend.md` v1.9 |
| 2026-11-03 | **task 8.4**：`pages/PurchaseNew.vue`＋共用表單 `components/PurchaseForm.vue`（8.6 編輯頁共用）：商品依分類分組、預設「請選擇商品」（沿用 7.4 決定）、左側分類圖塊；購入日期預設今天、不能選未來；購買地點＋常去的地點按鈕（`purchaseStore.fetchRecentStores`，最近用過、最多 6 個）；總價；自訂欄位用 CustomFieldInput（`customFieldStore.listFields` 只取欄位、不查使用狀況），沒有數量組成欄位時數量欄位放在同一張卡片最前面＋說明（CustomFieldInput 新增 footer 插槽）；「自動計算結果」即時顯示總數量與單位均價及算式，算不出來時灰底寫原因；送出前 validatePurchase：欄位下方錯誤＋上方錯誤摘要（連到欄位、取得焦點），改了欄位就拿掉；存檔 → MSG-004 → 回購買記錄列表 → `RemainingDialog`（CONFIRM-002，全域 Quasar Dialog，預先帶入目前剩餘數量、未設定留空；`productStore.updateRemaining` 只改剩餘數量；成功 MSG-007）。新增 41 項測試，全專案 629 項；5 種故意改壞皆被抓到。e2e `purchase-new.mjs`（真實滑鼠鍵盤，含 CustomFieldInput 的全形輸入整理、離開欄位 ERR-008）17 步驟通過。**e2e 發現並修正**：對話框打開時焦點沒在剩餘數量欄位（元件掛上時 Quasar 開啟動畫還沒結束）→ 改在 `@show` 聚焦（先寫回歸測試） | — |
| 2026-11-03 | **task 8.5**：`pages/PurchaseDetail.vue`（設計稿 Pur-Detail）：商品卡（分類圖塊、商品名稱連到商品詳情、分類、總價）；購入日期含星期、購買地點、新增者頭像＋名稱＋新增時間（本地時間，AC-5.6）；包裝規格（依欄位順序、只列有填的、數字加千分位）；總數量與單位均價（缺失「未填」/「無法計算」）；**價格比較**（AC-8.9、8.10）：↑ 琥珀 / ↓ 綠 / ＝ 灰 / 無法比較灰＋原因，另寫每單位差額與百分比（減號用 −，太小寫「不到 0.1%」）、歷史均價用了幾筆（含這一筆）；返回時保留列表篩選；記錄不存在、載入失敗（含第二段載入）各有畫面。新增 `lib/purchaseView.ts` 的 `priceComparisonOf`、`formatLongDate`、`formatCreatedAt`；`purchaseStore.fetchRecord`（404 → null）、`fetchFieldValues`（8.6 編輯頁也會用）；`fakePocketBase` 加 `getOne`（找不到 → 404，契約測試已對真正的 PocketBase 驗證）；AppIcon 加 4 個比較圖示；色彩變數 `--price-lower-*`（綠）。「刪除這筆記錄」按鈕留到 task 8.7 與對話框一起做（避免放一個按了沒反應的按鈕）。新增 32 項測試，全專案 661 項；3 種故意改壞皆被抓到。e2e `purchase-detail.mjs` 7 步驟通過（高 / 低 / 無法比較、返回保留篩選、商品連結、編輯入口、不存在的記錄） | — |
| 2026-11-03 | **App 再次更名（使用者決定）**：「溫叨Pantry」→「溫叨@Pantry」。程式：`constants/app.ts` 的 APP_NAME（頂欄、登入頁、Logo 的 aria-label 都用它）、`package.json` productName（瀏覽器分頁標題）、PWA manifest name / short_name；先改 `constants/__tests__/app.test.ts` 確認失敗再改。規格：requirements.md 76 處「溫叨Pantry系統」→「溫叨@Pantry系統」（順便修正 v1.4 摘要被上次更名誤改的文字）、design.md manifest 範例與頂欄說明；README、frontend/README、brand/README、setup-frontend、setup-pocketbase 同步並升版。**不改**：過去的變更摘要與進度紀錄（歷史）、英文識別名 WenDaoPantry、設計稿（claude.ai 上的 artifact 標題與畫板仍是舊名稱） | requirements v1.5、design v4.1 |
| 2026-11-03 | **設計稿更名**：claude.ai 設計稿（第 24 版）標題、16 張採用畫板、Logo 提案 3 張與列標題改為「溫叨@Pantry」；A、C 風格提案的「家庭ERP」保留作紀錄。本機 `.design-canvas/` 同步 | 設計稿 |
| 2026-11-03 | **task 8.6**：`pages/PurchaseEdit.vue`：沿用 `PurchaseForm`（標題「編輯購買記錄」、按鈕「儲存變更」），載入記錄（`fetchRecord`，404 → 找不到）與欄位值（`fetchFieldValues`）後預先帶入：商品、日期、地點、總價、包裝規格；沒有包裝規格的分類帶入數量（資料庫 0 = 沒填 → 欄位留空）。存檔 `updateRecord`（重算數量與單位均價、同步欄位值、新增者不變）→ MSG-005 → **回到這筆記錄的詳情**；返回與取消也回詳情；編輯不問更新剩餘數量。`PurchaseFormInitial` 型別從 PurchaseForm.vue 移到 `lib/purchaseForm.ts`（ESLint 讀不到 .vue 匯出的型別）。新增 12 項測試，全專案 673 項；4 種故意改壞皆被抓到。e2e `purchase-edit.mjs` 8 步驟通過（BDD 599 → 549 單位均價重算、包數改 10 → 1,000 抽、總價 0 只顯示 ERR-010 且不寫入、取消、不存在的記錄） | — |
| 2026-11-03 | **task 8.7**：詳情頁底部「刪除這筆記錄」（紅字）→ 新元件 `components/DeleteRecordDialog.vue`（`lib/feedback.confirmDeleteRecord` 開啟；`role="alertdialog"`、標題 CONFIRM-001、說明寫出是哪一筆（`lib/purchaseView.purchaseSummary`：「10/31 全聯 · 春風 抽取式衛生紙 · 599 元」）＋「刪除後無法復原，商品的歷史均價會重新計算」；焦點預設在「取消」；取消 / 點背景 / Esc 都不刪）→ `deleteRecord`（欄位值 cascade）→ MSG-006 → 回到購買記錄列表（**保留原本的篩選**）；失敗時 `notifyError`（例如 ERR-014）、留在詳情。對話框開著時按鈕停用（快速連點也只開一個），按下刪除後才顯示「刪除中…」（**e2e 截圖發現**對話框還開著時背後就寫「刪除中…」，先寫回歸測試再修）。新增色彩變數 `--danger #c41c29`（同 Quasar `$negative`）。分類刪除用的 `confirmDelete` 不變。新增 14 項測試，全專案 687 項；6 種故意改壞皆被抓到（其中「重複開對話框」一開始沒抓到：測試的第二下點在已停用的按鈕上，改成畫面更新前連點兩下）。e2e `purchase-delete.mjs` 7 步驟通過（Esc、取消、刪除、回到同一個篩選、資料庫記錄與欄位值刪除、商品歷史均價 0.4936 → 0.4784、再開被刪的記錄顯示找不到） | — |
| 2026-11-03 | **task 8.8**：測試對照（見「task 8.8 測試對照」）：tasks.md 8.8 的 6 項都已有函式、頁面與 e2e 測試；補上 6 項：頁面輸入負數總價（-5、-0.01）、午夜邊界（本地 00:30 選今天可以、23:59 選明天被拒）、存檔後真正的 QDialog 彈出（不用 spy）、編輯頁清空必填欄位。全部一寫就通過，另做 4 種故意改壞確認測試有效。全專案 693 項。只改測試檔，e2e 沿用 task 8.7 的全部通過結果。**task 8（購買記錄）全部完成** | — |
| 2026-11-03 | **首頁設計稿確認（使用者決定）**：設計稿 Dash（A 照規格：兩格摘要＋提醒清單＋庫存正常）、Dash-Grouped（B 提案：依狀態分組、不放摘要格）、Dash-Clear、Dash-First。使用者選 **A**；「沒有需要補貨」時加「另有 N 項商品還沒設定消耗速率」提示（只在有未設定時顯示）；「庫存正常」最多 5 項。寫入 design.md v4.3 | design.md v4.3 |
| 2026-11-03 | **task 9.1**：`pages/Dashboard.vue`＋`lib/dashboardView.ts`（`dashboardOf`：提醒清單＝已耗盡＋即將耗盡、追蹤數、庫存正常最多 `NORMAL_MAX` 5 項、下一個預計用完、未設定速率數；`formatDayWithWeekday`）。清單列、排序、第二行、狀態標籤與商品列表共用（`productStore.views`、`productSummary`、`DepletionBadge`）。摘要 0 項改淡灰底不用狀態色；沒有需要補貨寫說明與下一個預計用完；還沒有商品時引導新增商品（不顯示「記一筆」與摘要）；載入失敗可重新載入。新增 20 項測試，全專案 713 項；5 種故意改壞皆被抓到。e2e `dashboard.mjs` 8 步驟通過（e2e 共用資料庫，只核對本腳本的商品，摘要數字與清單列數互相核對）；**寫 e2e 時腳本自己寫錯兩處**（預期日期算錯、正規表示式多跳脫），畫面本身正確，已修正腳本 | — |
| 2026-11-03 | **task 9.2**：測試對照（見「task 9.2 測試對照」）：tasks.md 9.2 與首頁規格的各項都已在 9.1 的函式、頁面與 e2e 測試中；補上 1 項：久未更新的急迫商品在首頁的第二行與標籤。全專案 714 項。只改測試檔，e2e 沿用 9.1 的結果。**task 9（儀表板）全部完成** | — |
| 2026-11-04 | **價格趨勢圖設計稿確認（使用者決定）**：設計稿 Prod-Trend、Prod-Trend-Empty；放在商品詳情的商品卡與購買記錄之間、歷史均價參考線、點選資料點看那次的價格；**少於 2 筆**可計算單位均價的記錄就顯示 STATUS-005（原本只在 0 筆時）；橫軸依實際日期遠近。寫入 design.md v4.4（STATUS-005 的觸發條件同步修改） | design.md v4.4 |
| 2026-11-04 | **task 10.1**：分三層，方便測試：`lib/trendView.ts`（純函數 `trendOf`：只取算得出單位均價的記錄、舊到新、x = 距第一筆天數、提示框文字、無障礙說明、`TREND_MIN_POINTS` 2；`comparisonShort`）、`lib/trendChart.ts`（**Chart.js 只在這裡出現**：只註冊用到的元件、顏色取自 CSS 變數、歷史均價參考線用小外掛畫）、`components/PriceTrendChart.vue`（卡片、空狀態、資料變了清掉重畫、離開時 destroy）。Chart.js 4.6.1 早已在 package.json（之前裝的，從官方 npm）。元件測試把 `lib/trendChart` 換成假的（jsdom 沒有 canvas），**真正畫圖由 10.2 的 e2e 在無頭 Chrome 驗證**。`purchaseView.formatPercent` 改為 export（價格比較與提示框共用）。新增 17 項測試，全專案 731 項；4 種故意改壞皆被抓到 | — |
| 2026-11-04 | **task 10.2**：`ProductDetail.vue` 在商品卡與購買記錄之間放 `PriceTrendChart`（傳入 fetchByProduct 的結果、計價單位、今天）；頁面測試 3 項（位置與資料、1 筆、0 筆；畫圖層換成假的）。e2e `product-trend.mjs` 在無頭 Chrome 用 canvas 像素驗證：Chart.js 有畫出線、**用真正的滑鼠點最右邊的資料點後出現深色提示框**、1 筆時 STATUS-005。**e2e 截圖發現兩個問題並修正**：(1) 頭尾的資料點被圖的邊界切掉一半、中間刻度 8/31 不是購買日 → 先寫 4 項 `trendView` 測試（`xMin`/`xMax` 留邊、`xTicks` 放在購買日、最多 4 個）再修；(2)「歷史均價」標示被價格線穿過 → 改在價格線之後畫並描白邊（canvas 畫法，只能用截圖確認）。design.md v4.5。全專案 738 項。完整 e2e 在修正 (2) 之前跑過全部通過；修正 (2) 只改 `trendChart.ts` 的畫法，之後只重跑 product-trend | design.md v4.5 |
| 2026-11-03 | **App 更名（使用者決定）**：「家庭ERP」→「溫叨Pantry」；不能用中文的地方用「WenDaoPantry」（全小寫時 wendaopantry）。新增 `src/constants/app.ts`（APP_NAME、APP_NAME_ASCII），頂欄與登入頁改用常數；`package.json` productName、PWA manifest name / short_name 改名，並以 `constants/__tests__/app.test.ts` 檢查設定檔與常數一致。規格：requirements.md 76 處「家庭ERP系統」→「溫叨Pantry系統」、design.md、tasks.md；launchd 設定改為 `com.wendaopantry.pocketbase`（尚未安裝）；README、frontend/README、setup-frontend、setup-pocketbase 同步。依使用者同意**不改**：規格資料夾 `.kiro/specs/home-erp/`、`package.json` name `wendao-frontend`、說明文字「家庭用品管理系統」、過去進度紀錄裡的舊名稱。新增 5 項測試，全專案 544 項；e2e 全部通過，正式 build 的分頁標題與 manifest 已是新名稱。Logo（選 A 經典門牌）與設計稿更新另外進行 | requirements v1.4、design v3.8、tasks v1.7 |
| 2026-11-03 | **Logo A 定稿**：數字用 Barlow Condensed SemiBold（SIL OFL 1.1，從 Google Fonts 官方 GitHub 下載）的外框；`brand/extract-digits.py`（fontTools，暫時 venv 安裝）取出路徑 → `brand/digits.json`；`brand/build-icons.mjs` 產生 SVG 原始檔、`src/components/brandPaths.ts`、PWA / iOS / maskable（縮 0.78 倍在安全範圍）/ monochrome / 分頁 PNG 與 favicon.ico（無頭 Chrome 繪製），並自動跑 prettier。新增 `BrandLogo.vue`（plate / header、裝飾用 aria-hidden 或 label 時 role=img），頂欄與登入頁換掉「家」字標記。新增 5 項測試，全專案 548 項；e2e 全部通過。16px 分頁圖示仍難辨認數字（尺寸限制） | design.md v3.9、`frontend/brand/README.md` v1.0 |
| 2026-11-03 | **設計稿更名與換 Logo**：設計稿標題改為「溫叨Pantry 設計稿」；採用的 16 張畫板（B-Home、登入 2 張、Cat-List、商品 4 張、購買記錄 8 張）頂欄與登入頁換上門牌 Logo（上傳 brand/svg/logo-header.svg、logo.svg 為素材）與新名稱。A、C 風格提案（Main、C-Home 等）保留舊樣子作為紀錄 | 設計稿 |

## task 7.7 測試對照

| tasks.md 7.7 項目 | store（`stores/__tests__/product.test.ts`） | 頁面 | e2e |
|---|---|---|---|
| 建立商品成功（AC-3.1） | BDD 春風 平版衛生紙 | `ProductNew.test.ts` BDD 建立 → MSG-003 → 詳情 | `product-new` 步驟 8 |
| 空品牌品名被拒（AC-3.3） | 品牌空白 / 品名空白 / 全形空白 | ERR-005 三種組合、標示欄位 | 步驟 2 |
| 未設定單位被拒（AC-3.4） | 空白單位 | ERR-006 | 步驟 6 |
| 重複品牌品名被拒（AC-3.6） | 前後空白 / 全形大寫 / 小寫 / 全形空白、資料庫 UNIQUE | ERR-007 + 已存在商品名稱 | 步驟 4、5 |
| 剩餘數量負數被拒（AC-7.10） | -5 / -0.01 / NaN / 無限大 | ERR-015、標示並聚焦 | `product-edit` 步驟 2 |
| 有速率沒消耗單位被拒（AC-7.11） | 空白單位 | ERR-016、標示並聚焦 | 步驟 5 |
| 儲存自動填入當天（AC-7.9） | BDD 11/1、數字沒變也更新、00:30 / 23:59 | BDD 11/2、久未更新直接儲存 | 步驟 6（查資料庫） |
| 超過 30 天顯示 STATUS-008（AC-7.14） | — | `productView.test.ts`：32 天提醒、30 天不提醒、31 天提醒（畫面於 7.8） | 7.8 |

## task 9.2 測試對照

| tasks.md 9.2 / 規格項目 | 函式（`dashboardView.test.ts`） | 頁面（`Dashboard.test.ts`，fakePocketBase） | e2e（`dashboard`） |
|---|---|---|---|
| 首頁顯示所有即將耗盡與已耗盡（AC-7.6） | 清單＝已耗盡＋即將耗盡、已耗盡在前再依日期 | BDD 3 列的名稱、第二行、標籤、連結、分類圖塊 | 步驟 2、3（摘要與清單列數互相核對） |
| 即將耗盡邊界（AC-7.4：今天、第 7 天算；第 8 天不算） | BDD 邊界 4 種 | — | 步驟 3（明天、第 7 天在清單，第 8 天不在） |
| 已耗盡（AC-7.5） | 昨天 = 已耗盡 | 10/25 已用完 | 步驟 3（15 天前用完） |
| 摘要數字 | 已耗盡數、即將耗盡數 | 1 項 / 2 項；0 項改淡灰底 | 步驟 2 |
| 庫存正常最多 5 項（使用者決定） | 7 項只取 5、依日期 | 6 項只列 5 | 步驟 4 |
| 沒有需要補貨（Dash-Clear） | 下一個預計用完、未設定數 | 0 項、說明、下一個、未設定提示只在沒有提醒時 | —（e2e 共用資料庫，由單元測試涵蓋） |
| 還沒有商品（Dash-First） | 空資料全為 0 | 引導新增商品、不顯示記一筆與摘要 | —（同上） |
| ★ 久未更新的急迫商品（AC-7.14） | — | 第二行開頭「10/2 更新 · 」、只放「已耗盡」標籤 | — |
| 載入失敗 | — | ERR-014、重新載入 | — |

★ 為 9.2 補上的 1 項（故意改壞「首頁不加久未更新前綴」會被抓到）。

## task 8.8 測試對照

tasks.md 8.8 的每一項都對到自動化測試；「8.8 補」是這次補上的（標 ★）。e2e 步驟以 `e2e/run.sh` 的輸出編號為準。

| tasks.md 8.8 項目 | 函式 / store | 頁面 | e2e |
|---|---|---|---|
| 總價 <= 0 被拒（AC-5.4、5.11） | `purchaseForm.test.ts`：0 / -1 / -0.01 只有 ERR-010、0.01 可以；`purchase.test.ts`：資料庫擋下 0.004 → ERR-010 | `PurchaseNew.test.ts`：總價 0；★ 負數 -5 / -0.01 不寫入；`PurchaseEdit.test.ts`：改成 0 不寫入 | `purchase-new` 步驟 8；`purchase-edit` 步驟 3 |
| 未來日期被拒（AC-5.5） | `purchaseForm.test.ts`：明天 ERR-011、今天可以 | `PurchaseNew.test.ts`：11/15；★ 午夜邊界（本地 00:30 選今天可以、23:59 選明天被拒）；`PurchaseEdit.test.ts`：改成未來 | —（日期欄位設了 `max`，鍵盤打不出未來日期） |
| 必填缺失被拒（AC-5.3） | `purchaseForm.test.ts`：每個欄位各自 ERR-009、日期格式錯、總價 NaN；`purchase.test.ts`：不通過不寫入 | `PurchaseNew.test.ts`：沒填地點（含錯誤摘要與焦點）、全部沒填；★ `PurchaseEdit.test.ts`：清空地點與總價不寫入 | `purchase-new` 步驟 2、3 |
| 結束日期早於開始被拒（AC-8.7） | `purchase.test.ts`：ERR-012 標在 endDate、不查詢；同一天可以 | `Purchases.test.ts`：ERR-012 在結束日期下方、清單維持上一次結果；修正後消失 | `purchases` 步驟 4、5 |
| 前端計算寫入（AC-6.1、4.3） | `purchaseForm.test.ts`：100 × 12、直接輸入、缺失、小數、屬性測試；`purchase.test.ts`：建立寫入 1200 / 0.4992、蔬菜直接數量、缺失寫 0 / 0、編輯重算 | `PurchaseNew.test.ts`：BDD 建立後查 fakePocketBase 的 quantity / unit_price；`PurchaseEdit.test.ts`：599 → 549 → 0.4575、包數 10 → 1000 | `purchase-new` 步驟 12（查資料庫）；`purchase-edit` 步驟 6 |
| 存檔後提示更新剩餘數量（AC-7.13） | `remainingDialog.test.ts`：真正的 QDialog，帶入 3、未設定留空、更新 / 先不用 / 負數被拒 | `PurchaseNew.test.ts`：帶入 3、未設定 null、按更新只改剩餘數量；★ 整合：不用假的，驗證真正的 QDialog 彈出並帶入 3；`PurchaseEdit.test.ts`：編輯不問 | `purchase-new` 步驟 10、11、15、16 |

★ 補上的 6 項（負數 2 項、午夜邊界 2 項、對話框真的彈出 1 項、編輯頁必填 1 項）一寫就通過，代表程式本來就正確；為了確認測試真的有用，各做一次「故意改壞」：只擋 0 不擋負數、用 UTC 日期當今天、存檔後不開對話框、只有空白的地點算有填，4 種都被抓到。

## 待辦（依順序）

1. **[Claude Code]** task 9（儀表板與補貨提醒）：先做設計稿確認（儀表板只有 task 2.6 的風格提案 B-Home），再依序實作。
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
| App 名稱 | 使用者決定：中文「溫叨@Pantry」、英文識別名「WenDaoPantry」（全小寫 wendaopantry）；Logo 採 A 經典門牌（藍底白框、5888 橫排）；規格資料夾 home-erp 不改名 | 2026-11-03 |
| 購買記錄設計 | 使用者同意 4 項：(1) 購買地點附「常去的地點」按鈕（以前用過的地點）；(2) 存檔後回到購買記錄列表、顯示 MSG-004，再跳出 CONFIRM-002；(3) 價格比較另外顯示差額與百分比、歷史均價用了幾筆；(4) 送出失敗時表單上方加錯誤摘要（連到各欄位），欄位下方錯誤保留。編輯頁沿用新增頁表單 | 購買記錄設計稿 |
| 購買記錄讀取提前 | 使用者決定：7.5 需要依商品讀取購買記錄，`fetchByProduct`、`fetchUsers` 在 7.5 先做，8.1 只剩其餘 actions | task 7.5 |
| 久未更新顯示 | 使用者決定：列表每列一個標籤（急迫狀態優先，兩者都有時第二行加更新日）；詳情頁在資訊塊下方放提示列，緊鄰更新按鈕 | task 7.8 |
| 新增商品的預設 | 使用者決定：建立成功後進入新商品詳情頁（1A）；分類預設留空、沒選顯示 ERR-009（2B，自己選比較不會建錯），從篩選過的列表進來時仍預先選好 | task 7.4 追加 |
| 數字欄位 | 輸入時整理成數字（去文字、全形轉半形），不新增「格式錯誤」訊息；剩餘數量保留開頭負號以觸發 ERR-015；消耗速率不收負號 | task 7.6 |
| 商品列表篩選 | 使用者決定：篩選記在網址 `?category=<id>`，從詳情按上一頁要回到原本的篩選；方向鍵切換不做 | task 7.3 |
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
| K-16 | task 8.1 | **（已回寫 design.md v3.7）** design.md 的 usePurchaseStore 範例：不用 `expand: 'product,product.category,user'`，商品、分類、新增者由頁面對照已載入的清單（沿用 7.5）；檢查與計算拆到 `lib/purchaseForm.ts`（頁面共用），不通過丟出 `FieldsValidationError`（欄位 → 訊息）；`PurchaseFormData` 加上 `customFields`（商品所屬分類的欄位定義）、`totalPrice` 可為 null、`fieldValues` 為文字；日期篩選改為 `purchase_date >= 'YYYY-MM-DD 00:00:00.000Z'`、`<= 'YYYY-MM-DD 23:59:59.999Z'`（用 `pb.filter()`）；排序 `-purchase_date,-created`；新增時欄位值寫入失敗會刪除剛建立的記錄 |
| K-17 | task 8.4 | **（已回寫 design.md v4.2）** design.md 補上 task 8.4 新增的 store 方法：`productStore.updateRemaining(id, remaining)`（只更新剩餘數量與更新日，給 CONFIRM-002 對話框用）、`purchaseStore.fetchRecentStores()` / `recentStores`（常去的地點）、`customFieldStore.listFields(categoryId)`（表單用，不查使用狀況）；元件 `PurchaseForm.vue`（新增 / 編輯共用）、`RemainingDialog.vue`（`lib/feedback.askUpdateRemaining` 開啟） |
| K-18 | task 8.5 | **（已回寫 design.md v4.2）** design.md 補上 task 8.5 新增的：`purchaseStore.fetchRecord(id)`（用 getOne，404 回傳 null 顯示「找不到這筆記錄」）、`purchaseStore.fetchFieldValues(recordId)`；`lib/purchaseView.ts` 的 `priceComparisonOf`（價格比較的畫面文字）；UI 設計規範的色彩加上 `--price-lower-bg #e3f4dc` / `--price-lower-ink #24501a`（比歷史均價低的綠色）；詳情頁的包裝規格只列有填值的欄位 |
| K-19 | task 8.6 | **（已回寫 design.md v4.2）** design.md「編輯購買記錄」補上：按鈕文字「儲存變更」；存檔後 MSG-005 → 回到這筆記錄的詳情（返回、取消也回詳情）；編輯不詢問更新剩餘數量（CONFIRM-002 只在新增）；`PurchaseFormInitial` 放在 `lib/purchaseForm.ts` |
| K-20 | task 8.7 | **（已回寫 design.md v4.2）** design.md「刪除確認」補上：元件 `DeleteRecordDialog.vue`（`feedback.confirmDeleteRecord(summary)` 開啟，焦點預設在「取消」）；刪除後 MSG-006 → 回購買記錄列表並保留篩選；失敗時提示錯誤留在詳情；UI 設計規範色彩加上 `--danger #c41c29` |
| K-7 | task 1.6 | purchase_record_field_values 同 K-3，改為 `(purchase_record, custom_field)` UNIQUE INDEX + 前端保證 |

## 下次接手時

```bash
cd ~/Projects/WenDao   # 另一台電腦第一次使用時先 git clone https://github.com/shaun-tsai826/WenDao.git
git pull
```

然後跟 Claude Code 說：「讀 docs/progress.md，接著做」。

> 新電腦的 `backend/pocketbase` 與 `pb_data/` 不在 git 裡：執行檔請照 `docs/setup-pocketbase.md` 重新下載；資料庫要另外搬移或備份還原。前端套件：`cd frontend && npm install && (cd src-pwa && npm install)`。

### 目前位置（2026-11-03）

- **已完成**：task 1～7（環境、認證、分類、商品）、task 8（購買記錄：store、CustomFieldInput、列表、新增、詳情、編輯、刪除、測試對照）。
- **下一步：task 10.3 撰寫價格趨勢圖測試**：照 8.8 / 9.2 的做法做測試對照（有資料時渲染、無資料時 STATUS-005），大部分已在 10.1、10.2 完成。接著 task 11 Checkpoint（確認所有功能頁面測試通過）。
- **待使用者回報**：回家後用 iPhone 測試（步驟見 `docs/setup-frontend.md` 第 9 節）：購買記錄的日期選擇器與 ERR-012 換行、新增購買記錄（商品選單、數字鍵盤、更新剩餘數量對話框）、商品頁操作、門牌 Logo。結果回報後再決定要不要調整。
- **待回寫規格**：目前沒有（K-17～K-20 已於 2026-11-03 回寫 design.md v4.2）。
- App 名稱「溫叨@Pantry」（`src/constants/app.ts`），Logo A 門牌 5888（`frontend/brand/`）。
- 設計稿：https://claude.ai/artifact/NFoy16EUs8ZDTwa2uMQDSf （標題「溫叨@Pantry 設計稿」；購買記錄在 Pur-* 那排，Logo 在最下排；本機原始檔在 `.design-canvas/`，不進 git）。

### 工作慣例（Claude Code 接手時照做）

1. **一次一個 task**：做完 → `tasks.md` 勾選 → 更新本檔 → commit（訊息帶 task 編號）→ push → 回報（繁體中文）。
2. **新畫面先做設計稿**：先呼叫設計 skills（ui-ux-pro-max、taste-skill），依 design.md「UI 設計規範」做稿放到設計稿，使用者確認後才實作。
3. **規格有落差**：先停下來列「問題＋建議（含推薦選項）」問使用者（選擇題），同意後才改 design.md / tasks.md，並升版號、寫變更摘要。暫停使用 Kiro。
4. **驗證三層**：
   - `cd frontend && npm test`（Vitest，目前 738 項）、`npm run lint:check`、`npm run typecheck`
   - 故意改壞關鍵程式確認測試抓得到（**先備份檔案**，不要用 `git checkout` 還原未 commit 的修改）
   - `./e2e/run.sh`（正式 build + 臨時 PocketBase + 無頭 Chrome，**真實滑鼠鍵盤事件**；手機寬 390）。新頁面要在 `frontend/e2e/` 加腳本
5. **修 bug**：先寫會失敗的回歸測試，再修正。
6. 測試工具：`src/test-utils/fakePocketBase.ts`（記憶體假資料庫）、`mountPage.ts`（頁面掛載，含 QLayout）、`setup.ts`。
7. Repo 是 public：真實 email、密碼、token 不可寫進任何檔案。
8. **驗證順序固定**：單元測試 → `lint:check` → `typecheck` → e2e，用 `&&` 串起來，任何一步失敗就停下、不 commit（task 8.3 曾因 e2e 前沒跑 typecheck，正式 build 才抓到型別錯誤；Logo 那次用 `;` 串，lint 失敗仍 commit 了）。
9. **回報格式**：「自己重做一遍的步驟」要寫成可照著重新實作的順序（要寫哪些檔案、先寫哪個測試、為什麼），測試指令放最後當驗收（使用者 2026-11-03 指定）。
10. **e2e 注意事項**：
    - 用 CDP 送鍵盤事件時 `keyDown` 要帶 `text`，數字才會真的輸入（日期欄位、下拉選單快速跳選）。
    - 日期欄位用 Chrome 繁中語系（`--lang=zh-TW`），格式是年 / 月 / 日；欄位要加 `min` / `max`，否則鍵盤可打出 5～6 位數年份。
    - 下拉選單用 `focus()` 後打英文字母快速跳選（測試資料的品牌用英文開頭）。
    - 測試資料由每支腳本自己用 API 建立在自己的分類下，不依賴其他腳本改過的種子資料。
    - `e2e/purchase-contract.mjs` 對真正的 PocketBase 驗證 fakePocketBase 的假設（關聯篩選、日期比較、cascade、錯誤格式）；改 fake 時要一起看。
11. **Quasar 的坑**：對話框最外層要用 `<div>`（否則點一下就關閉）；對話框裡的欄位要在 `@show` 時聚焦（掛上時開啟動畫還沒結束，focus 會失效）；`h2` 預設行高很大，要自己設 `line-height`；一般 CSS 的 `<style>` 不能用 `//` 註解（SCSS 才可以），Vitest 不會抓到，只有正式 build 會失敗。
12. **e2e 腳本與 `lint:check`**：`lint:check` 不檢查 `.mjs`，e2e 腳本不要跑 prettier（會整支重排）。產生的檔案（`brand/build-icons.mjs` 產出）已在產生器裡自動跑 prettier。
