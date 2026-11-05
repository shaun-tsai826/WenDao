#!/usr/bin/env bash
# 前端部署（task 13.1、13.2）：建置 PWA → 檢查產出 → 同步到 backend/pb_public/（PocketBase 會直接提供這些檔案）
#
# 用法（在 repo 任何位置都可以）：
#   ./deploy/deploy-frontend.sh
#
# 說明：
# - 用 `quasar build -m pwa`（`npm run build` 是一般網頁模式，不會產生 PWA 的 manifest 與 service worker）
# - 產出在 frontend/dist/pwa/，同步到 backend/pb_public/；pb_public 是產生的檔案（不在 git），舊檔案會被刪掉換成最新的
# - PocketBase 正在執行也可以部署，重新整理網頁就是新版（PWA 可能要關掉 App 再開一次才會換新）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
OUT="$FRONTEND/dist/pwa"
PUBLIC="$ROOT/backend/pb_public"
LOGS="$ROOT/backend/logs"

echo "== 1/3 建置 PWA（quasar build -m pwa）"
(cd "$FRONTEND" && npx quasar build -m pwa >/dev/null)

echo "== 2/3 檢查產出（task 13.2）"
for f in index.html manifest.json sw.js; do
  if [[ ! -f "$OUT/$f" ]]; then
    echo "✗ 找不到 $OUT/$f，請看上面的建置訊息"
    exit 1
  fi
done
# manifest：名稱、獨立視窗（加到主畫面後像 App）、圖示
python3 - "$OUT/manifest.json" <<'PY'
import json, sys
m = json.load(open(sys.argv[1], encoding='utf-8'))
problems = []
if not m.get('name'): problems.append('沒有 name')
if m.get('display') != 'standalone': problems.append(f"display 是 {m.get('display')!r}，應為 'standalone'")
if not m.get('icons'): problems.append('沒有 icons')
if problems:
    print('✗ manifest.json：' + '、'.join(problems))
    sys.exit(1)
print(f"  ✓ manifest：{m['name']}、display={m['display']}、{len(m['icons'])} 個圖示")
PY
echo "  ✓ index.html、manifest.json、sw.js（service worker）都在"

echo "== 3/3 同步到 backend/pb_public/"
mkdir -p "$PUBLIC" "$LOGS"
rsync -a --delete "$OUT/" "$PUBLIC/"
echo "  ✓ 已同步 $(find "$PUBLIC" -type f | wc -l | tr -d ' ') 個檔案；log 資料夾 backend/logs/ 已準備好"
echo "== ✓ 部署完成。PocketBase 在執行中的話，重新整理網頁即可看到新版"
