# deploy — 部署設定

task 13.1 會在這裡建立：

- `com.wendaopantry.pocketbase.plist`：launchd 設定，讓 PocketBase 在 Mac mini 開機時自動啟動（安裝到 `~/Library/LaunchAgents/` 的動作由使用者手動執行）
- 前端部署腳本：`frontend` 執行 build 後，把產出複製到 `backend/pb_public/`
- `tailscale serve` 設定說明（HTTPS 存取，見 review-notes R-2）
