# PocketBase 環境建置教學（setup-pocketbase.md）

> 版本：v1.0（2026-11-01）
> 變更摘要：初次建立（task 1.1）。涵蓋下載、checksum 驗證、第一次啟動、建立 superuser 與疑難排解。

## 這是什麼？

**PocketBase** 是一個「單一執行檔」的後端：資料庫（SQLite）、REST API、登入驗證、管理後台都包在同一個檔案裡。

可以把它想成一個「已經裝潢好的小店面」：只要開門（`serve`），就有櫃台（API）、倉庫（資料庫）和監視器（管理後台），不需要自己蓋。

本專案使用的版本：

| 項目 | 版本 |
|---|---|
| PocketBase | **0.40.6** |
| JS SDK（前端用，task 2.2 安裝） | **0.28.1** |

## 1. 確認電腦的晶片

```bash
uname -m
```

| 結果 | 電腦 | 要下載的檔案 |
|---|---|---|
| `arm64` | M4 Mac mini（Apple Silicon） | `pocketbase_0.40.6_darwin_arm64.zip` |
| `x86_64` | MBP（Intel） | `pocketbase_0.40.6_darwin_amd64.zip` |

## 2. 下載並驗證 checksum

**checksum** 是檔案的「指紋」。官方公布每個檔案的指紋，我們下載後自己算一次，兩者一樣才代表檔案沒有損壞或被竄改。

以下以 M4（arm64）為例；Intel MBP 請把 `arm64` 換成 `amd64`。

```bash
mkdir -p ~/Downloads/pb-dl && cd ~/Downloads/pb-dl
curl -fsSLO https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/pocketbase_0.40.6_darwin_arm64.zip
curl -fsSLO https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/checksums.txt
grep darwin_arm64 checksums.txt | shasum -a 256 -c -
```

看到 `pocketbase_0.40.6_darwin_arm64.zip: OK` 才繼續。

## 3. 解壓縮並放進 backend/

```bash
mkdir -p extract && unzip -q -o pocketbase_0.40.6_darwin_arm64.zip -d extract
cp extract/pocketbase extract/CHANGELOG.md extract/LICENSE.md ~/Projects/WenDao/backend/
cd ~/Projects/WenDao/backend
./pocketbase --version
```

應顯示 `pocketbase version 0.40.6`。

> 這三個檔案都列在 `.gitignore` 裡，**不會進 git**，所以每台電腦都要各自下載一次。

## 4. 第一次啟動

```bash
cd ~/Projects/WenDao/backend
./pocketbase serve --http=127.0.0.1:8090
```

- `127.0.0.1` 代表「只有這台電腦自己連得到」。外部的連線之後由 `tailscale serve` 轉進來（task 13.1）。
- 第一次啟動時，會自動建立 `pb_data/`（資料庫，**不進 git**）。
- 想停止服務時，在這個終端機視窗按 `Ctrl + C`。

另開一個終端機視窗確認服務狀態：

```bash
curl http://127.0.0.1:8090/api/health
```

應回傳 `"API is healthy."`。

## 5. 建立 superuser（管理員）帳號

**superuser** 是管理後台的最高權限帳號，**只用來管理，不用來登入家庭 ERP 系統**。夫妻兩人的帳號之後在 task 1.8 另外建立。

**做法 A（推薦）：用瀏覽器**

1. 第一次啟動時，終端機會印出一行很長的網址：`http://127.0.0.1:8090/_/#/pbinstall/...`
2. 用瀏覽器打開這個網址，輸入 email 和密碼（至少 10 個字元）。
3. 建立完成後，之後一律從 `http://127.0.0.1:8090/_/` 登入。

> 這個網址裡帶有一次性的 token，只在建立第一個 superuser 前有效，**不要貼到公開的地方**。

**做法 B：用指令**

```bash
./pocketbase superuser upsert 你的email 你的密碼
```

> 用這個做法時，密碼會留在 shell 的歷史紀錄裡，所以比較推薦做法 A。

## 6. 確認 superuser 已建立

```bash
cd ~/Projects/WenDao/backend
sqlite3 pb_data/data.db "select email from _superusers;"
```

能看到你的 email 就完成了。

> 如果只看到 `__pbinstaller@example.com`，代表**還沒建立**。這是 PocketBase 為了安裝連結自動產生的暫時帳號，建立真正的 superuser 之後就會消失。

## 疑難排解

| 狀況 | 原因 | 處理方式 |
|---|---|---|
| `bind: address already in use` | 8090 port 已被占用（通常是 PocketBase 已經在跑） | 執行 `lsof -i :8090` 找出程式，關掉它，或沿用正在跑的那一個 |
| macOS 跳出「無法打開，因為無法驗證開發者」 | 檔案是用瀏覽器下載的，被加上隔離標記 | `xattr -d com.apple.quarantine pocketbase`（用上面的 curl 下載不會有這個問題） |
| `zsh: permission denied: ./pocketbase` | 執行檔失去執行權限 | `chmod +x pocketbase` |
| pbinstall 網址失效或忘記複製 | 網址只在第一次啟動時印出 | 改用做法 B 的指令建立 |
| 忘記 superuser 密碼 | — | 用同一個 email 再執行一次 `./pocketbase superuser upsert`，就會覆蓋密碼 |
| 想從頭來過 | — | 停止服務後，刪除 `backend/pb_data/` 再重新啟動。**資料會全部消失**，正式使用後請勿這樣做 |
