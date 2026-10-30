# backend — PocketBase 工作目錄

PocketBase 是一個單一執行檔，啟動時會以「執行檔所在的資料夾」作為工作目錄：

| 項目 | 是否進 git | 說明 |
|---|---|---|
| `pocketbase` | 否 | 執行檔。每台電腦自行下載（Apple Silicon 用 `darwin_arm64`，Intel Mac 用 `darwin_amd64`） |
| `pb_migrations/` | **是** | 資料表結構的變更紀錄（JS 檔）。另一台電腦啟動時會自動套用，不用再到 Admin UI 手動建表 |
| `pb_hooks/` | **是** | 伺服器端 hooks（MVP 不使用，先保留資料夾） |
| `pb_data/` | 否 | SQLite 資料庫與上傳檔案，含使用者資料，**要另外備份** |
| `pb_public/` | 否 | 前端 build 產出，由 `deploy/` 的部署腳本複製進來 |

下載、啟動與建立 superuser 的步驟會在 task 1.1 寫成 `docs/` 裡的環境建置教學。
