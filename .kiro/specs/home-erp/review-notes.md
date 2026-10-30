# 規格審查回饋（review-notes.md）

> 版本：v1.1（2026-10-31）
> 變更摘要：v1.1 新增 R-6「repo 資料夾結構」（使用者已確認採用結構 A）。
> v1.0（2026-10-30）初次建立。Claude Code 審查 requirements.md v1.1、design.md v2.0、tasks.md v1.0 後的回饋，所有修改方向均已經使用者確認。
> 審查者：Claude Code（實作端）　確認者：使用者

---

## 0. 給 Kiro 的使用說明

請依照以下順序處理本文件：

1. **先讀完整份文件**，再開始修改。
2. 依第 1、2 節修正 `requirements.md`、`design.md`、`tasks.md`。每份文件都要**提升版本號並寫入變更摘要**，例如 requirements v1.2、design v2.1、tasks v1.1。
3. **需求編號不要重新編號**：修改既有的 AC 時保留原本的編號；新增的 AC 接在該需求最後面，例如 AC-7.9。
4. 第 3 節是「**待使用者確認**」的問題，請**先問使用者**，得到答案後再寫進規格，不要自行假設。
5. 修完之後依第 5 節產出 `BDD.md`。
6. 第 4 節由 Claude Code 在實作時處理，**Kiro 不需要修改**，只是讓你知道有這些項目。
7. 最後用第 6 節的檢查清單自我檢查。

---

## 1. 必須修正（已確認，依建議修改）

### R-1　users 的 API Rule 有安全漏洞

- **問題**：design.md「users」段落與 tasks 1.7 都寫 Create/Update/Delete「留空」。在 PocketBase 中，規則填**空字串 `""` 代表任何人（含未登入者）都能操作**；只有 **Locked（null）** 才代表僅 superuser 可操作。照現在的寫法，任何人都能自行註冊帳號。
- **修改**：
  - design.md「users（Auth Collection）」API Rule 改為：`Create / Update / Delete：Locked（null，僅 superuser 可透過 Admin UI 操作）`
  - tasks.md 1.7 同步修改，並加註「注意：空字串代表公開，必須設為 Locked」。
  - 其他 Collection 的規則 `@request.auth.id != ""` 是正確的，不需要修改。

### R-2　REQ-9.1 要求 HTTPS，但 design 使用 HTTP；PWA 需要 HTTPS

- **問題**：design 以 `http://mac-mini:8090` 存取。瀏覽器的 **service worker 只在 HTTPS 或 localhost 下運作**，所以用 HTTP 時 PWA（AC-9.2、task 13.2）在手機上無法運作，也不符合 AC-9.1。
- **修改**：改用 **`tailscale serve`**，由 Tailscale 自動簽發 HTTPS 憑證。
  - 外網網址改為 `https://<mac-mini 名稱>.<tailnet 名稱>.ts.net`，例如 `https://mac-mini.tail1234.ts.net`。
  - PocketBase 仍然監聽本機 `127.0.0.1:8090`，由 `tailscale serve` 反向代理到 HTTPS 443。
  - design.md 要更新的段落：關鍵設計決策表、「外網存取：為何選 Tailscale」比較表的 HTTPS 列、系統架構圖、說明文字、「Tailscale 設定」步驟（新增：在 Tailscale 管理後台啟用 MagicDNS 與 HTTPS Certificates，並執行 `tailscale serve`）、SDK 初始化註解中的 URL 範例。
  - 內網存取方式：統一使用 Tailscale HTTPS 網址（家中電腦也安裝 Tailscale），避免內外網兩套網址造成 PWA 與登入狀態分裂。若要保留區網 HTTP 存取，請註明「區網 HTTP 下 PWA 功能不可用」。
  - tasks.md 13.1 新增子項：`tailscale serve` 設定步驟寫入部署文件（實際操作仍由使用者手動完成）。

### R-3　登入後的導向頁面互相矛盾

- **問題**：AC-1.1 寫「導向購買記錄列表頁面」；design 的路由守衛與 task 5.2 寫導向 `/`（儀表板）。
- **修改**：統一為**導向首頁 `/`（儀表板）**，理由是 AC-7.6 的補貨提醒放在首頁。
  - requirements.md AC-1.1 改為：「…驗證成功並導向系統首頁（儀表板）」。

### R-4　PocketBase 版本與 API 寫法不一致

- **問題**：design 寫 `0.22+`，但範例使用 `pb.authStore.record`（0.23 起才有，0.22 為 `.model`）；hooks 名稱 `onRecordBeforeCreateRequest` 是 0.22 以前的舊寫法。
- **修改**：
  - 外部依賴表的 PocketBase 改為**鎖定一個 0.23 以後的明確版本**，例如 `0.23.x` 或撰寫時最新的穩定版，並寫上確切的版本號。pocketbase JS SDK 也要寫出對應的版本。
  - 「需要 PocketBase Hooks 的地方」表格的 hook 名稱改為新版寫法（例如 `onRecordCreateRequest`、`onRecordDeleteRequest`）。
  - 「限制 4：JSVM 僅支援 ES5」請依鎖定的版本重新確認描述是否正確。
  - Admin UI 用語統一為「superuser」（0.23 起的名稱）。

### R-5　Chart.js 的引入方式前後矛盾

- **問題**：design 寫「CDN 引入」，task 2.2 卻是 `npm install chart.js`。用 CDN 的話，PWA 離線時圖表無法載入。
- **修改**：統一為 **npm 安裝並由 Vite 打包**。
  - design.md：關鍵設計決策表、外部依賴表的 Chart.js 列，移除「CDN」字樣。
  - STATUS-005「圖表載入失敗」改為空狀態訊息，例如 `STATUS-005：尚無足夠資料顯示趨勢圖`，觸發條件為「該商品沒有可計算單位均價的購買記錄」。
  - tasks.md 10.1、10.3 同步修改，移除「CDN 失敗」相關描述，改為測試空狀態。

### R-6　repo 資料夾結構（v1.1 新增）

- **問題**：design.md 把 PocketBase 放在 repo 外面的 `/Users/cooqle/home-erp/`，前端叫 `home-erp-frontend/`。這樣資料表結構沒有版本管理，使用者在 MBP 與 M4 mini 之間切換時，必須到 Admin UI 重新建表。
- **使用者決定**：採用「結構 A：全部放進 repo」。骨架已由 Claude Code 建立（見根目錄 `README.md`）：
  ```
  WenDao/
  ├── .kiro/
  ├── frontend/            Quasar 前端（task 2.1 建立）
  ├── backend/             PocketBase 工作目錄
  │   ├── pb_migrations/   資料表結構（進 git）
  │   ├── pb_hooks/        hooks（進 git）
  │   ├── pocketbase       執行檔（.gitignore 排除）
  │   ├── pb_data/         資料庫（.gitignore 排除）
  │   └── pb_public/       前端 build 產出（.gitignore 排除）
  ├── deploy/              launchd plist、部署腳本
  └── docs/                進度紀錄、環境建置教學
  ```
- **修改**：
  - design.md：「前端架構 → 專案結構」的 `home-erp-frontend/` 改為 `frontend/`；部署流程、launchd plist 範例（`ProgramArguments`、`WorkingDirectory`、log 路徑）、`cp -r dist/* ../home-erp/pb_public/` 等路徑改為 repo 內的 `backend/`（例如 `/Users/cooqle/Projects/WenDao/backend`）。
  - design.md：「關鍵設計決策」新增一列「**資料表建立方式：PocketBase migrations（`pb_migrations/` JS 檔）**」，取代「透過 Admin UI 點擊建立」，理由是可以版本管理、換電腦時自動套用。Admin UI 仍用來建立 superuser 與檢視資料。
  - tasks.md：1.1 的下載位置改為 `backend/`；1.2～1.8 改為「撰寫 migration 檔建立 Collection／種子資料，並在 Admin UI 確認」；Notes 中「Collection 建立透過 Admin UI 完成」一段同步修改。
  - 種子使用者的**密碼不可寫進 migration 檔**（repo 是 public）。請在設計中註明改從環境變數讀取，例如 `SEED_USER1_PASSWORD`，或改由使用者在 Admin UI 手動建立 2 位使用者。

---

## 2. 需要釐清 → 已由使用者決定

### C-6　剩餘數量改為「手動輸入」（不用公式計算）

- **使用者決定**：剩餘數量由使用者**手動輸入**。理由是用公式推算會與實際庫存有落差。
- **修改**：
  - **products 新增欄位**：
    | 欄位 | 型別 | 限制 | 說明 |
    |---|---|---|---|
    | `remaining_quantity` | number | optional, min 0 | 目前剩餘數量（手動輸入，單位 = `consumption_unit`，見 C-8） |
    | `remaining_updated_at` | date | optional | 剩餘數量最後一次更新的日期（儲存時由前端自動填入當天日期） |
  - **預計耗盡日期公式改為**：
    `耗盡日期 = remaining_updated_at + (remaining_quantity ÷ consumption_rate) × 週期天數`（monthly = 30、weekly = 7）
  - requirements.md：
    - AC-7.2 改為：「根據使用者輸入的剩餘數量與消耗速率，計算預計耗盡日期」
    - AC-7.3 的「剩餘數量」改為顯示使用者輸入的值。
    - 新增 AC：「WHEN 使用者在商品編輯頁輸入剩餘數量並儲存，THE 系統 SHALL 儲存剩餘數量與當天日期」
    - 新增 AC：剩餘數量輸入負數時的錯誤訊息（建議 `ERR-015：剩餘數量不可為負數`）
  - design.md：`calculateDepletionDate` 的參數改為 `(remainingQty, remainingUpdatedAt, consumptionRate, period)`；Property 5 的描述同步修改；Glossary 新增「剩餘數量」，修改「預計耗盡日期」的定義。
  - tasks.md：1.4（products 欄位）、3.7、3.8、7.3、7.6 同步修改。
  - **衍生問題請見第 3 節 Q-1～Q-3**。

### C-7　「耗盡日期是今天」的狀態分類

- **使用者決定**：依建議修改。
- **修改**：設 `diffDays = 耗盡日期 − 今天`（以「天」為單位，只比較日期、不比較時間）：
  | 條件 | 狀態 | 顯示 |
  |---|---|---|
  | 未設定消耗速率 | `unset` | STATUS-002 未設定消耗速率 |
  | `diffDays < 0` | `depleted` | STATUS-004 已耗盡 |
  | `0 ≤ diffDays ≤ 7` | `soon` | STATUS-003 即將耗盡 |
  | `diffDays > 7` | `normal` | 不顯示提醒 |
- 要同步修改的地方：design.md 的 `getDepletionStatus` 註解與程式、Property 6、Property 6 測試範例（`soon` 改為涵蓋 0～7）；tasks.md 3.9、3.10。
- requirements.md AC-7.4 可加註「含今天」，例如「距今 0～7 天（含今天）」，讓邊界更明確。

### C-8　消耗速率的單位與計價單位分開

- **使用者決定**：以衛生紙為例，**消耗速率的單位是「包」**；「抽」只用來計算成本和平均單價。
- **修改**：商品要有**兩種單位**：
  | 欄位 | 用途 | 衛生紙範例 |
  |---|---|---|
  | `unit`（既有） | **計價單位**：用來算單位均價、歷史均價 | 抽 |
  | `consumption_unit`（新增，text, max 20, optional） | **消耗單位**：消耗速率與剩餘數量使用的單位 | 包 |
  - requirements.md：
    - Glossary 的「計量單位」改名或拆成「計價單位」與「消耗單位」兩個詞條，並附衛生紙範例。
    - REQ-7 新增 AC：「WHEN 使用者設定消耗速率，THE 系統 SHALL 要求同時設定消耗單位」，並新增對應的錯誤訊息（建議 `ERR-016：請設定消耗單位`）。
    - AC-7.8 的範例「每週消耗量約0.5包」與此一致，保留。
  - design.md：products 欄位表、ER 圖、衛生紙範例表都要補上 `consumption_unit`。
  - 與 C-6 搭配：`remaining_quantity` 與 `consumption_rate` **都使用 `consumption_unit`**，所以耗盡日期的計算不需要做單位換算。
  - tasks.md：1.4、1.8（種子資料：春風衛生紙 `unit=抽`、`consumption_unit=包`）、7.4 或 7.6 同步修改。

### C-9　購買記錄列表缺少「新增者」欄位

- **使用者決定**：同意修正。
- **修改**：AC-8.3 的欄位清單補上「新增者」，以符合 AC-1.4；tasks.md 8.3 同步修改。PurchaseDetail（task 8.5）也要顯示新增者與新增時間（AC-5.6）。

### C-10　分類編輯缺少驗收條件

- **使用者決定**：同意修正，採用「已有值的欄位禁止刪除」。
- **修改**：在 REQ-2 或 REQ-4 新增以下 AC（訊息文字可微調，但要集中列進訊息表）：
  1. 編輯分類名稱並儲存 → 更新成功，顯示「分類更新成功」（建議 `MSG-008`）
  2. 編輯後的名稱為空 → 「分類名稱不可為空」（沿用 ERR-002）
  3. 編輯後的名稱與其他分類重複 → 沿用 ERR-003
  4. 同一分類內自訂欄位名稱重複 → 「此欄位名稱已存在於此分類」（建議 `ERR-017`）
  5. 刪除**已有購買記錄填寫值**的自訂欄位 → 禁止刪除，顯示「此欄位已有購買記錄使用，無法刪除」（建議 `ERR-018`）
  6. 刪除**尚未被使用**的自訂欄位 → 刪除成功（建議 `MSG-009：欄位刪除成功`）
- design.md：`custom_fields → purchase_record_field_values` 的關聯從 **Cascade 改為 Restrict**，避免誤刪歷史資料。
- 是否允許修改既有欄位的 `is_quantity_component` 與 `field_type`，請見第 3 節 Q-4。
- tasks.md 6.5、6.6 同步補上。

### C-11　日期與時區規則

- **使用者決定**：同意修正。
- **修改**：在 design.md 新增「日期處理規則」段落：
  - 台灣是 UTC+8，日期**一律以 `YYYY-MM-DD 00:00:00.000Z` 儲存，不做時區轉換**。例如使用者選 2026-10-30，就存 `2026-10-30 00:00:00.000Z`。
  - 「今天」以使用者裝置的**本地日期**為準（Asia/Taipei）。
  - 日期區間篩選使用 `purchase_date >= "開始 00:00:00" && purchase_date <= "結束 23:59:59"`，**包含結束日當天**。
  - 適用欄位：`purchase_date`、`remaining_updated_at`（C-6），以及 AC-5.5（不可為未來日期）、AC-8.6、AC-8.7 的判斷。

### C-12　歷史均價或當次單位均價為空時的比較

- **使用者決定**：同意修正。
- **修改**：requirements.md 新增 AC（接在 REQ-8 最後）：「IF 當次單位均價或歷史均價為『無法計算』，THEN 系統 SHALL 顯示『無法比較』」，並把訊息加入訊息表（建議 `STATUS-006：無法比較`）。
  - design.md：`compareWithHistoricalAverage` 的參數改為可接受 null，回傳值新增 `'na'`；Property 7 同步修改。
  - tasks.md 3.11、3.12、8.5 同步修改。
  - 補充說明：依 AC-8.4，歷史均價包含當次記錄，所以只有一筆記錄時，比較結果會是「等於」，屬於正常行為。

### C-13　測試子任務改為必做

- **使用者決定**：同意修正。
- **修改**：tasks.md 中所有標示 `*`（選用）的測試子任務，一律**移除 `*`、改為必做**；Notes 中「標示 * 的子任務為選用」一段改為「所有測試任務皆為必做，驗收條件需對應到自動化測試」。

---

## 3. 待使用者確認（請 Kiro 先問使用者，不要自行假設）

因為 C-6（手動剩餘數量）與 C-8（雙單位）而產生的新問題：

| 編號 | 問題 | 可提供使用者參考的選項 |
|---|---|---|
| Q-1 | **新增購買記錄後，剩餘數量要怎麼更新？** | (A) 不自動更新，由使用者自己去商品頁修改；(B) 存檔後跳出提示「要不要更新剩餘數量？」並帶入建議值（推薦：仍然是手動輸入，但不容易忘記）；(C) 自動加上購買數量（需要「抽→包」的換算，與 C-8 衝突，不推薦） |
| Q-2 | **有設定消耗速率、但沒填剩餘數量時，要顯示什麼狀態？** | 建議新增狀態 `STATUS-007：未設定剩餘數量`，不計算耗盡日期 |
| Q-3 | **剩餘數量很久沒更新時，要不要提醒？** | 例如超過 30 天沒更新就提示「剩餘數量已久未更新」。若使用者認為不需要，可以記錄到「未來規劃」 |
| Q-4 | **已經有購買記錄使用的自訂欄位，能不能修改「型別」或「是否為數量組成欄位」？** | 建議禁止修改，以免歷史的數量與均價前後不一致；欄位名稱和顯示順序可以修改 |

---

## 4. Claude Code 實作時自行處理（Kiro 不需修改，僅供知悉）

以下是 design.md 範例程式中的小問題，屬於實作細節，Claude Code 實作時會修正並用測試驗證：

- `usePurchaseStore.fetchRecords`：多個篩選條件串接時漏了 `&&`；只填開始或結束日期其中一個時，篩選不會生效。改為使用 `pb.filter()` 安全組字串。
- `usePurchaseStore` 從 `composables/useUnitPrice` import 了 `calculateQuantityFromComponents`，路徑錯誤。
- `createRecord`：分類只有「一般資訊欄位」時，`data.fieldValues` 有值，會導致使用者直接輸入的數量被覆蓋成 null。
- `calculateHistoricalAverage` 的註解寫「含 null 回傳 null」，與程式（過濾掉 null）不一致。
- SDK 初始化註解的開發環境 URL 寫成 `localhost:8080`，PocketBase 預設是 `8090`。
- Quasar CLI 專案的環境變數設定在 `quasar.config` 的 `build.env`，不是 `vite.config.ts`；Vitest 需搭配 Quasar 官方的 testing app extension。
- 編輯購買記錄時（AC-5.7、AC-6.1）要重新計算 quantity / unit_price，並同步更新 EAV 值。task 8.6 可以加註這一點，不加也可以，由 Claude Code 實作時處理。

## 5. 修正完成後：產出 BDD.md

請依 steering `collaboration.md` 第 3 節的 BDD 標準撰寫 `.kiro/specs/home-erp/BDD.md`：

- 使用 **Given / When / Then**，每個情境標上對應的 **AC 編號**，例如 `@AC-5.4`。
- 文件開頭設「**背景資料**」段落，集中定義：
  - 2 位種子使用者（名稱、email；密碼用代稱，**不要寫真實密碼**）
  - 種子分類：衛生紙（含 3 個自訂欄位）、蔬菜（無數量組成欄位，用來測試 AC-4.4）
  - 種子商品：春風抽取式衛生紙（`unit=抽`、`consumption_unit=包`）
  - 測試用的「今天」日期（固定日期，例如 2026-11-01，讓耗盡日期相關情境可以重現）
- 至少涵蓋：
  - 所有錯誤訊息（ERR-xxx）
  - 消耗狀態的 4 種狀態與邊界：今天、第 7 天、第 8 天、昨天
  - 有／無數量組成欄位的購買記錄
  - 本文件新增的 AC（C-6、C-8、C-10、C-12）
- BDD 是開發用的內部文件，不需要放進簡報。

## 6. Kiro 交付前自我檢查

- [ ] R-1～R-6、C-6～C-13 都已反映到對應的文件
- [ ] Q-1～Q-4 已經詢問使用者，並把答案寫進規格（或記錄到未來規劃）
- [ ] 新增的訊息（ERR-015～018、MSG-008～009、STATUS-006～007 等）都已加入 design.md 的訊息集中表，編號沒有重複
- [ ] 既有的 AC 編號沒有被重新編號
- [ ] requirements / design / tasks / BDD 四份文件之間沒有矛盾
- [ ] 每份修改過的文件都已更新版本號與變更摘要
