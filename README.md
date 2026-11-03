# WenDao — 溫叨@Pantry 家庭用品管理

> 版本：v1.4（2026-11-03）
> 變更摘要：v1.4 App 更名「溫叨Pantry」→「溫叨@Pantry」（使用者決定）。
> v1.3 App 更名「家庭ERP」→「溫叨Pantry」（英文識別名 WenDaoPantry）；規格資料夾仍為 `.kiro/specs/home-erp/`。
> v1.2 frontend/ 已由 task 2.1 建立，新增前端文件連結。
> v1.1 新增 docs/specs 捷徑說明。
> v1.0（2026-10-31）初次建立，說明資料夾結構與協作流程。

供夫妻兩人管理家庭用品的購買記錄、價格分析與補貨提醒。部署在家中的 M4 Mac mini，透過 Tailscale 從外面存取。

- 技術：PocketBase（後端）＋ Vue 3 / Quasar（前端 SPA + PWA）
- 規劃：Kiro（`.kiro/`）　實作：Claude Code
- 目前進度：請看 [`docs/progress.md`](docs/progress.md)

## 資料夾結構

```
WenDao/
├── .kiro/
│   ├── steering/          協作規則
│   └── specs/home-erp/    requirements / design / tasks / BDD / review-notes
├── frontend/              Quasar 前端（TypeScript + PWA，建置方式見 docs/setup-frontend.md）
├── backend/               PocketBase 工作目錄
│   ├── pb_migrations/     資料表結構（進 git）
│   ├── pb_hooks/          伺服器端 hooks（進 git，MVP 不使用）
│   ├── pocketbase         執行檔（不進 git，各台電腦自行下載）
│   ├── pb_data/           SQLite 資料庫（不進 git，含使用者資料）
│   └── pb_public/         前端 build 產出（不進 git，由部署腳本複製）
├── deploy/                launchd plist、部署腳本
└── docs/
    ├── progress.md        進度紀錄
    ├── setup-pocketbase.md  後端建置教學
    ├── setup-frontend.md    前端建置教學
    └── specs/ →           捷徑，指向 .kiro/specs/home-erp（規格正本）
```

> 規格正本必須留在 `.kiro/`，因為 Kiro 只讀寫那裡。`docs/specs` 只是方便查看的捷徑，從兩邊打開都是同一份檔案，**請不要另外複製**。

## 協作流程

1. 開工前先 `git pull`（MBP 與 M4 mini 之間切換）。
2. Kiro 更新 `.kiro/specs/`（Kiro 無法 push）→ Claude Code 審查後 commit / push。
3. Claude Code 依照 `tasks.md` 一次實作一個 task → 勾選 `[x]` → commit（message 帶 task 編號）。
4. 實作中發現的規格問題寫進 `review-notes.md`，交由 Kiro 修正。
