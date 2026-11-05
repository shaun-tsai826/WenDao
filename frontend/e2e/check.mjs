// e2e 共用的判定工具（task 12.1）
// 每支腳本把關鍵結果交給 check(說明, 實際, 預期)；不符時印出 ✗ 與預期 / 實際，最後 done() 讓腳本以失敗結束，
// run.sh 就能自動判定（不必逐行看輸出）。
//
//   import { check, ok, done } from './check.mjs';
//   check('登入後的網址', await js('location.pathname'), '/');
//   ok('沒有橫向捲動', await js('document.documentElement.scrollWidth <= innerWidth'));
//   ...
//   done();
import { isDeepStrictEqual } from 'node:util';

let passed = 0;
let failed = 0;
const show = (v) => (typeof v === 'string' ? v : JSON.stringify(v));

/** 實際值與預期值相同（物件、陣列逐項比較） */
export function check(label, actual, expected) {
  const same = isDeepStrictEqual(actual, expected);
  if (same) passed++;
  else failed++;
  console.log(same ? `  ✓ ${label}` : `  ✗ ${label}\n      預期：${show(expected)}\n      實際：${show(actual)}`);
  return same;
}

/** 條件成立；detail 只在不符時印出，幫忙找原因 */
export function ok(label, condition, detail = '') {
  const same = Boolean(condition);
  if (same) passed++;
  else failed++;
  console.log(same ? `  ✓ ${label}` : `  ✗ ${label}${detail ? `\n      ${show(detail)}` : ''}`);
  return same;
}

/** 腳本最後呼叫：印出統計，有不符時結束代碼為 1 */
export function done() {
  console.log(failed ? `  ✗ ${passed + failed} 項中 ${failed} 項不符` : `  ✓ ${passed} 項全部符合`);
  process.exitCode = failed ? 1 : 0;
}
