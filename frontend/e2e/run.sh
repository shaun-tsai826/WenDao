#!/usr/bin/env bash
# e2e 驗證：正式 build + 臨時 PocketBase（不碰正式資料）+ 無頭 Chrome
#
# 用法（在 frontend/ 底下）：
#   ./e2e/run.sh                    # 跑全部腳本（手機寬 390x844）
#   ./e2e/run.sh custom-field-sheet # 只跑一支
#
# 每支腳本會拿到：網址、截圖資料夾、寬、高。截圖存在 e2e/.shots/（不進 git）。
# 判定：每支腳本用 e2e/check.mjs 比對預期值，有一項不符該腳本就失敗；最後列出失敗的腳本，結束代碼 1。
# 臨時資料庫用 migrations 建立（含種子資料），再加一個測試帳號 alice@family.home、
# 一筆購買記錄（讓「抽數(單包)」欄位處於已被使用的狀態）。
set -euo pipefail

FRONTEND="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$FRONTEND/../backend"
SHOTS="$FRONTEND/e2e/.shots"
TMP="$(mktemp -d)"
PORT=8099
B="http://127.0.0.1:${PORT}/api"
J='Content-Type: application/json'

mkdir -p "$SHOTS"
cleanup() { [[ -n "${PB_PID:-}" ]] && kill "$PB_PID" 2>/dev/null || true; rm -rf "$TMP"; }
trap cleanup EXIT

echo "== 建置正式版"
(cd "$FRONTEND" && npx quasar build -m pwa >/dev/null)

echo "== 啟動臨時 PocketBase（port ${PORT}）"
O=(--dir="$TMP/pb_data" --migrationsDir="$BACKEND/pb_migrations" --automigrate=false --publicDir="$FRONTEND/dist/pwa")
"$BACKEND/pocketbase" migrate up "${O[@]}" >/dev/null
"$BACKEND/pocketbase" superuser upsert e2e@test.local e2e-password-123 "${O[@]}" >/dev/null
"$BACKEND/pocketbase" serve --http=127.0.0.1:${PORT} "${O[@]}" >"$TMP/pb.log" 2>&1 &
PB_PID=$!
sleep 2

json() { python3 -c "import sys,json;print(json.load(sys.stdin)$1)"; }
SU="Authorization: $(curl -s -X POST $B/collections/_superusers/auth-with-password -H "$J" \
  -d '{"identity":"e2e@test.local","password":"e2e-password-123"}' | json '["token"]')"
U=$(curl -s -X POST $B/collections/users/records -H "$SU" -H "$J" \
  -d '{"email":"alice@family.home","password":"correct-password1","passwordConfirm":"correct-password1","name":"Alice"}' | json '["id"]')
P=$(curl -s "$B/collections/products/records" -H "$SU" | json '["items"][0]["id"]')
F=$(curl -s -G "$B/collections/custom_fields/records" --data-urlencode "filter=field_name='抽數(單包)'" -H "$SU" | json '["items"][0]["id"]')
R=$(curl -s -X POST $B/collections/purchase_records/records -H "$SU" -H "$J" \
  -d "{\"product\":\"$P\",\"user\":\"$U\",\"purchase_date\":\"2026-11-01 00:00:00.000Z\",\"store\":\"全聯\",\"total_price\":599,\"quantity\":1200,\"unit_price\":0.4992}" | json '["id"]')
curl -s -o /dev/null -X POST $B/collections/purchase_record_field_values/records -H "$SU" -H "$J" \
  -d "{\"purchase_record\":\"$R\",\"custom_field\":\"$F\",\"field_value\":\"100\"}"

SCRIPTS=("$@")
[[ ${#SCRIPTS[@]} -eq 0 ]] && SCRIPTS=(purchase-contract login categories custom-field-sheet products product-new product-detail product-edit stale purchases purchase-new purchase-detail purchase-edit purchase-delete dashboard product-trend logout)
# 每支腳本用 e2e/check.mjs 判定，有不符時以失敗結束；全部跑完再列出失敗的腳本（task 12.1）
FAILED=()
for name in "${SCRIPTS[@]}"; do
  echo "== $name"
  # grep 沒有輸出時會回傳 1，所以包起來；pipefail 讓結束代碼取自 node
  if ! node "$FRONTEND/e2e/$name.mjs" "http://127.0.0.1:${PORT}" "$SHOTS" 390 844 2>&1 | { grep -v Warning || true; }; then
    FAILED+=("$name")
  fi
done

if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo "== ✗ 有 ${#FAILED[@]} 支腳本不符：${FAILED[*]}"
  exit 1
fi
echo "== ✓ ${#SCRIPTS[@]} 支腳本全部符合"
