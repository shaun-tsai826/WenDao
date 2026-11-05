# deploy — 溫叨@Pantry 部署說明

> 版本：v1.0（2026-11-05）
> 變更摘要：v1.0 task 13.1 建立：launchd 設定、前端部署腳本、Tailscale HTTPS 步驟、更新 / 停止 / 備份與疑難排解。

這份文件說明怎麼讓 Mac mini 常駐提供溫叨@Pantry，讓兩支手機在家裡或外面都能用 HTTPS 連線。
**標示「你親手執行」的步驟會改到這台 Mac 的系統設定**，Claude Code 不會代為執行。

```text
iPhone（Tailscale App）
   │  https://<Mac mini 名稱>.<tailnet>.ts.net   ← Tailscale 自動簽發 HTTPS 憑證
   ▼
Mac mini：tailscale serve（443）──► 127.0.0.1:8090 PocketBase（launchd 常駐）
                                      ├─ /api/*   資料（backend/pb_data/）
                                      └─ 其他網址  畫面（backend/pb_public/，由 deploy-frontend.sh 產生）
```

## 這個資料夾的檔案

| 檔案 | 用途 |
|---|---|
| `com.wendaopantry.pocketbase.plist` | launchd 設定：登入後自動啟動 PocketBase、當掉自動重開，只聽本機 `127.0.0.1:8090` |
| `deploy-frontend.sh` | 建置 PWA、檢查產出（manifest、service worker），同步到 `backend/pb_public/` |
| `README.md` | 這份說明 |

## 1. 事前準備（只要做一次）

- `backend/pocketbase` 執行檔、superuser、兩個家庭成員帳號：照 `docs/setup-pocketbase.md`。
- 前端套件已安裝：`cd frontend && npm install`。
- **8090 port 沒有被別的程式佔用**：如果你照 `docs/setup-frontend.md` 第 9 節在手機上測試時，手動開過 PocketBase，先在那個終端機按 `Ctrl + C` 關掉。

## 2. 部署前端畫面

```bash
cd ~/Projects/WenDao
./deploy/deploy-frontend.sh
```

最後一行出現「✓ 部署完成」就好了。之後程式有更新，也是重跑這一行。

## 3. 安裝 PocketBase 常駐服務（你親手執行）

```bash
mkdir -p ~/Library/LaunchAgents
cp ~/Projects/WenDao/deploy/com.wendaopantry.pocketbase.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.wendaopantry.pocketbase.plist
```

確認有在執行：

```bash
launchctl print gui/$(id -u)/com.wendaopantry.pocketbase | grep -E "state|pid"
curl -s http://127.0.0.1:8090/api/health
```

看到 `state = running` 與 `{"message":"API is healthy."...}` 就成功了。用 Mac mini 的瀏覽器打開 `http://127.0.0.1:8090`，應該看得到登入頁。

> **登入後才會啟動**：放在 `~/Library/LaunchAgents/` 的服務是「你登入 Mac 之後」才啟動，不是一開機就啟動。
> Mac mini 停電重開後若停在登入畫面，服務不會起來。想要重開機後自動恢復，到「系統設定 › 使用者與群組 › 自動登入」選你的帳號
> （開著 FileVault 時無法自動登入，要自己決定要不要關；不關的話，重開機後登入一次即可）。

> macOS 第一次可能會在右上角通知「已新增背景項目」，到「系統設定 › 一般 › 登入項目與延伸功能」確認 `pocketbase` 是允許的。

## 4. 設定 Tailscale HTTPS（你親手執行）

1. **安裝 Tailscale App**（只從官方來源）：Mac mini 從 <https://tailscale.com/download/mac> 或 Mac App Store；兩支 iPhone 從 App Store 安裝 Tailscale。三台都用**同一個帳號**登入。
2. 到 Tailscale 管理後台 <https://login.tailscale.com/admin/dns>：
   - 開啟 **MagicDNS**
   - 開啟 **HTTPS Certificates**
3. 在 Mac mini 的終端機執行（Tailscale 1.52 起的新寫法；`--bg` 讓它在背景執行，重開機後也會恢復）：

   ```bash
   tailscale serve --bg --https=443 http://127.0.0.1:8090
   tailscale serve status
   ```

   `status` 會顯示網址，例如 `https://cooqle-macmini.tail1234.ts.net`。
   找不到 `tailscale` 指令時：打開 Tailscale App 的設定，安裝命令列工具（CLI）；或改用 `/Applications/Tailscale.app/Contents/MacOS/Tailscale serve …`。
4. 第一次用 HTTPS 網址打開時，Tailscale 會去申請憑證，可能要等幾十秒。

## 5. 手機上使用

1. iPhone 打開 Tailscale App，確認是「已連線」。
2. 用 Safari 打開步驟 4 的 `https://….ts.net` 網址，登入。
3. 點分享按鈕 →「加入主畫面」，之後就像 App 一樣從主畫面打開。
4. 家裡的電腦也一樣裝 Tailscale、用同一個 HTTPS 網址（不要一台用 IP、一台用網址，登入狀態會分成兩份）。

## 6. 之後更新版本

```bash
cd ~/Projects/WenDao
git pull
./deploy/deploy-frontend.sh
launchctl kickstart -k gui/$(id -u)/com.wendaopantry.pocketbase
```

- `kickstart -k`：重新啟動 PocketBase。啟動時會自動套用 `backend/pb_migrations/` 裡新的資料表變更。
- 手機上的 PWA 可能還是舊畫面：把 App 從多工畫面滑掉再打開一次。

## 7. 暫停或移除

```bash
# 停止並移除常駐服務
launchctl bootout gui/$(id -u)/com.wendaopantry.pocketbase
rm ~/Library/LaunchAgents/com.wendaopantry.pocketbase.plist

# 關掉 Tailscale HTTPS（與開啟時同樣的參數，最後加 off）
tailscale serve --https=443 http://127.0.0.1:8090 off
```

資料（`backend/pb_data/`）不會因此刪除。

## 8. 備份資料

- **最簡單**：PocketBase 管理後台 `http://127.0.0.1:8090/_/` › Settings › Backups，按「Initialize new backup」；備份檔在 `backend/pb_data/backups/`，再複製到別的地方（例如外接硬碟或雲端硬碟）。
- 或停止服務後複製整個 `backend/pb_data/` 資料夾。

## 9. 疑難排解

| 狀況 | 原因與處理 |
|---|---|
| `launchctl bootstrap` 出現 `Bootstrap failed: 5` | 已經載入過了。先 `launchctl bootout gui/$(id -u)/com.wendaopantry.pocketbase` 再重新 bootstrap |
| `state = not running`，或一直重開 | 看 `backend/logs/pocketbase-error.log`。常見原因：8090 被佔用（`lsof -i :8090` 找出是誰）、`backend/pocketbase` 不存在或沒有執行權限（`chmod +x backend/pocketbase`） |
| log 檔沒有產生 | `backend/logs/` 資料夾要先存在：重跑 `./deploy/deploy-frontend.sh`（會建立），再 `launchctl kickstart -k …` |
| macOS 擋下 `pocketbase`（「無法打開，因為無法驗證開發者」） | 執行檔是從 GitHub 下載的：`xattr -d com.apple.quarantine ~/Projects/WenDao/backend/pocketbase` 後再啟動 |
| 打開網址是 404 或空白 | 還沒部署前端：執行 `./deploy/deploy-frontend.sh`；確認 `backend/pb_public/index.html` 存在 |
| 手機打不開 `….ts.net` | 手機的 Tailscale 沒連線、沒用同一個帳號登入，或管理後台沒開 MagicDNS / HTTPS Certificates |
| 登入畫面出現「無法連線至伺服器，請確認 Tailscale 連線狀態」（ERR-014） | 同上；或 Mac mini 睡著了：到「系統設定 › 能源」關掉自動睡眠 |
| 重開機後連不上 | 見第 3 節「登入後才會啟動」 |
