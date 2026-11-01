# 專案進度紀錄（progress.md）

> 版本：v1.1（2026-11-01）
> 變更摘要：v1.1 規格已由 Kiro 修正並產出 BDD，Claude Code 完成第二輪審查與修正（F-1～F-6）；docs/specs 改為指向 .kiro/specs/home-erp 的捷徑。
> v1.0（2026-10-31）初次建立。

## 目前階段

**規格已定稿，可以開始實作。** 下一步是 task 1.1。

```
規格撰寫 ──► 規格審查 ──► Kiro 修正 + BDD ──► 第二輪審查 ──► 實作 task 1.1 起
  (完成)       (完成)          (完成)            (完成)        ◄ 目前在這裡
```

## 規格文件（正本在 `.kiro/specs/home-erp/`，`docs/specs/` 是指向它的捷徑）

| 文件 | 版本 |
|---|---|
| requirements.md | v1.3 |
| design.md | v2.2 |
| tasks.md | v1.2 |
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

## 待辦（依順序）

1. **[Claude Code]** 回報 task 1.1 的做法，經使用者確認後開始：確認 PocketBase 最新穩定版與相容的 JS SDK 版本，寫回 design.md，下載到 `backend/` 並建立 superuser。
2. 之後依 `tasks.md` 順序，一次做一個 task → 勾選 `[x]` → commit（message 帶 task 編號）。

## 重要決定紀錄

| 決定 | 內容 | 出處 |
|---|---|---|
| 剩餘數量 | **手動輸入**，不用公式推算 | review-notes C-6 |
| 雙單位 | 計價單位 `unit`（抽）用來算均價；消耗單位 `consumption_unit`（包）用於消耗速率與剩餘數量 | review-notes C-8 |
| 新增購買後 | 跳出對話框，詢問是否更新剩餘數量，**預先帶入目前的剩餘數量**（未設定時留空） | review-notes Q-1、F-4 |
| 外網存取 | Tailscale + `tailscale serve` 提供 HTTPS（PWA 需要 HTTPS） | review-notes R-2 |
| 資料夾結構 | 前端、PocketBase、部署設定都放在 repo；資料表結構用 `pb_migrations` 做版本管理 | review-notes R-6 |
| 版本鎖定 | PocketBase 0.23 以上、JS SDK 0.22 以上，確切版本在 task 1.1 確認 | review-notes F-1 |
| 文件位置 | 正本留在 `.kiro/`（Kiro 只讀這裡），`docs/specs` 是捷徑 | — |
| Repo 公開 | GitHub public repo。**密碼與 `.env` 一律不進 git** | — |
| Kiro 不能 push | Kiro 改完的文件由 Claude Code 審查後 commit / push | — |

## 下次接手時

```bash
cd ~/Projects/WenDao   # 另一台電腦第一次使用時先 git clone https://github.com/shaun-tsai826/WenDao.git
git pull
```

然後跟 Claude Code 說：「讀 docs/progress.md，接著做」。
