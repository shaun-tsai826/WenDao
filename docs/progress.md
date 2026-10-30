# 專案進度紀錄（progress.md）

> 版本：v1.0（2026-10-31）
> 變更摘要：初次建立，記錄規格審查與 repo 初始化的進度。

## 目前階段

**規格修正中，尚未開始實作。** 等 Kiro 額度在 2026-11-01 恢復後，由 Kiro 修正規格並產出 BDD.md。

```
規格撰寫 ──► 規格審查 ──► Kiro 修正 + BDD ──► 實作 task 1.1 起
  (完成)       (完成)        ◄ 目前在這裡
```

## 已完成

| 日期 | 項目 | 產出 |
|---|---|---|
| 2026-10-24 前 | Kiro 撰寫規格 | requirements v1.1、design v2.0、tasks v1.0 |
| 2026-10-30 | Claude Code 審查規格，使用者確認修正方向 | `.kiro/specs/home-erp/review-notes.md` v1.0 |
| 2026-10-31 | git init、首次 commit、建立 public repo | https://github.com/shaun-tsai826/WenDao |
| 2026-10-31 | 建立資料夾骨架（結構 A：全部放進 repo） | `backend/`、`deploy/`、`docs/`、`README.md`；review-notes v1.1 新增 R-6 |

## 待辦（依順序）

1. **[使用者 → Kiro]** 讓 Kiro 讀 review-notes.md 並修正規格，可直接貼上這段指令：
   ```text
   請先完整閱讀 .kiro/specs/home-erp/review-notes.md，依照第 0 節的順序修正 requirements.md、design.md、tasks.md（第 3 節的問題請先問我），修正完成後再產出 BDD.md。
   ```
2. **[使用者]** 回答 Kiro 提出的 Q-1～Q-4：
   - Q-1：新增購買記錄後，剩餘數量怎麼更新？（Claude 推薦：存檔後跳出提示，由使用者手動填寫）
   - Q-2：有設定消耗速率、但沒填剩餘數量時，顯示什麼狀態？
   - Q-3：剩餘數量很久沒更新時，要不要提醒？
   - Q-4：已被購買記錄使用的自訂欄位，能不能改型別或「是否為數量組成欄位」？
3. **[使用者]** Kiro 修完後 commit 並 push。
4. **[Claude Code]** `git pull` → 確認修正後的規格與 BDD 沒有矛盾 → 回報預計要做的 task → 你確認後從 **task 1.1** 開始實作。

## 重要決定紀錄

| 決定 | 內容 | 出處 |
|---|---|---|
| 剩餘數量 | 改為**手動輸入**，不用公式推算（推算會跟實際庫存有落差） | review-notes C-6 |
| 雙單位 | 計價單位 `unit`（抽）用來算均價；消耗單位 `consumption_unit`（包）用於消耗速率與剩餘數量 | review-notes C-8 |
| 外網存取 | Tailscale + `tailscale serve` 提供 HTTPS（PWA 需要 HTTPS） | review-notes R-2 |
| 資料夾結構 | 前端、PocketBase、部署設定都放在 repo；資料表結構用 `pb_migrations` 做版本管理 | review-notes R-6 |
| Repo 公開 | GitHub public repo。**密碼與 `.env` 一律不進 git** | — |

## 下次接手時

```bash
cd ~/Projects/WenDao   # 另一台電腦第一次使用時先 git clone https://github.com/shaun-tsai826/WenDao.git
git pull
```

然後跟 Claude Code 說：「讀 docs/progress.md，接著做」。
