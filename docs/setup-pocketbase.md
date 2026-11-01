# PocketBase 環境建置教學（setup-pocketbase.md）

> 版本：v1.1（2026-11-01）
> 變更摘要：v1.1 新增第 7 節 migration 操作（task 1.2）、疑難排解補上 migration 相關項目。
> v1.0 初次建立（task 1.1）。涵蓋下載、checksum 驗證、第一次啟動、建立 superuser 與疑難排解。

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

## 7. 用 migration 建立資料表（task 1.2 起）

**migration** 是「資料表結構的施工圖」。把「要建哪些表、欄位有哪些限制」寫成 `pb_migrations/` 裡的 JS 檔並進 git，換電腦時照圖施工就能長出一模一樣的結構，不用手動在後台點來點去。

### 7.1 建立新的 migration 檔

```bash
cd ~/Projects/WenDao/backend
./pocketbase migrate create "users_categories"
```

會產生 `pb_migrations/<時間戳>_users_categories.js`，裡面有兩段：

- `migrate((app) => { ... }, ...)` 的第一段：**up**，套用時做的事。
- 第二段：**down**，還原時做的事（反過來做一次）。

### 7.2 套用

```bash
# 1. 先停掉正在跑的 serve（在 serve 視窗按 Ctrl + C）
# 2. 備份資料庫（養成習慣，正式使用後特別重要）
mkdir -p ~/Backups/WenDao
sqlite3 pb_data/data.db ".backup '$HOME/Backups/WenDao/data-$(date +%Y%m%d-%H%M).db'"
# 3. 套用
./pocketbase migrate up
# 4. 重新啟動
./pocketbase serve --http=127.0.0.1:8090
```

> `serve` 啟動時也會自動套用還沒跑過的 migration，所以第 3 步其實可以省略。分開執行比較容易看到錯誤訊息。

確認已套用：

```bash
sqlite3 pb_data/data.db "select file from _migrations order by applied desc limit 3;"
```

### 7.3 在臨時資料庫測試（不碰正式資料）

```bash
cd ~/Projects/WenDao/backend
T=~/Downloads/pbtest; rm -rf $T; mkdir -p $T
O=(--dir=$T/pb_data --migrationsDir=$PWD/pb_migrations --automigrate=false)
./pocketbase migrate up $O
./pocketbase superuser upsert test@test.local testpassword123 $O
./pocketbase serve --http=127.0.0.1:8099 $O
```

- 一定要加 `--migrationsDir`：只指定 `--dir` 時，PocketBase 會到 `$T/pb_migrations` 找檔案，結果什麼都沒套用。
- zsh 要用 `O=(...)` array 的寫法。寫成 `O="..."` 的話，三個參數會被當成一整串字。
- 測完按 `Ctrl + C`，再 `rm -rf ~/Downloads/pbtest`。

### 7.4 注意：在後台改結構會自動產生 migration 檔

PocketBase 預設開啟 **automigrate**：在 superuser UI 新增或修改 Collection 時，會自動在 `pb_migrations/` 產生一個檔案。

- 這是正常行為，代表你的修改也被記錄下來了。
- 本專案的結構以 task 寫的 migration 為準，**請不要在後台直接改 Collection 結構**。如果不小心改了，先跟 Claude Code 說，再決定要保留還是刪除那個自動產生的檔案。

## 疑難排解

| 狀況 | 原因 | 處理方式 |
|---|---|---|
| `bind: address already in use` | 8090 port 已被占用（通常是 PocketBase 已經在跑） | 執行 `lsof -i :8090` 找出程式，關掉它，或沿用正在跑的那一個 |
| macOS 跳出「無法打開，因為無法驗證開發者」 | 檔案是用瀏覽器下載的，被加上隔離標記 | `xattr -d com.apple.quarantine pocketbase`（用上面的 curl 下載不會有這個問題） |
| `zsh: permission denied: ./pocketbase` | 執行檔失去執行權限 | `chmod +x pocketbase` |
| pbinstall 網址失效或忘記複製 | 網址只在第一次啟動時印出 | 改用做法 B 的指令建立 |
| 忘記 superuser 密碼 | — | 用同一個 email 再執行一次 `./pocketbase superuser upsert`，就會覆蓋密碼 |
| `migrate up` 顯示 `No new migrations to apply.`，但表沒建出來 | 用了 `--dir` 卻沒有指定 `--migrationsDir` | 參考 7.3 節，補上 `--migrationsDir` |
| migration 套用失敗，想退回上一步 | — | 先停掉 serve，執行 `./pocketbase migrate down 1`。或者用 7.2 節的備份檔蓋回 `pb_data/data.db` |
| 想從頭來過 | — | 停止服務後，刪除 `backend/pb_data/` 再重新啟動。**資料會全部消失**，正式使用後請勿這樣做 |
