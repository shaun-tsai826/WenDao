// 購買記錄的「契約測試」（task 8.1）：store 的單元測試跑在 fakePocketBase 上，
// 這支腳本用同一套 SDK、同樣的查詢字串，對真正的 PocketBase 0.40.6 驗證 fake 的假設是否成立：
//   1. product.category 關聯篩選  2. 日期字串比較（含結束日當天）  3. 排序 -purchase_date,-created
//   4. 刪除購買記錄時 cascade 刪除欄位值  5. 總價低於 0.01 的錯誤格式  6. quantity 0 / unit_price 0 可寫入
// 不開瀏覽器；結果每一行 ✓ / ✗，有 ✗ 時結束代碼為 1。
import PocketBase from 'pocketbase';
import { ok, done } from './check.mjs';

const [,, base] = process.argv;
const pb = new PocketBase(base);
pb.autoCancellation(false);
await pb.collection('users').authWithPassword('alice@family.home', 'correct-password1');
const me = pb.authStore.record.id;

// 判定交給共用的 check.mjs（task 12.1）；這支的 check(說明, 條件, 不符時的細節)
const check = ok;

// ---- 測試資料（自己建立，名稱加上前綴，不影響其他腳本） ----
const tag = `契約${Date.now() % 100000}`;
const catA = await pb.collection('categories').create({ name: `${tag}A` });
const catB = await pb.collection('categories').create({ name: `${tag}B` });
const field = await pb.collection('custom_fields').create({ category: catA.id, field_name: '包數', field_type: 'number', is_quantity_component: true, display_order: 1 });
const prodA = await pb.collection('products').create({ category: catA.id, brand: tag, name: 'A 商品', unit: '抽' });
const prodB = await pb.collection('products').create({ category: catB.id, brand: tag, name: 'B 商品', unit: '顆' });
const add = (product, date, extra = {}) =>
  pb.collection('purchase_records').create({ product, purchase_date: `${date} 00:00:00.000Z`, store: '全聯', total_price: 100, quantity: 10, unit_price: 10, user: me, ...extra });
const r0930 = await add(prodA.id, '2026-09-30');
const r1001 = await add(prodB.id, '2026-10-01');
const r1031 = await add(prodA.id, '2026-10-31');
const r1101 = await add(prodB.id, '2026-11-01');
// PocketBase 的 created 精確到毫秒：連續建立可能落在同一毫秒而分不出先後（實際使用不會發生），所以先等一下
await new Promise((r) => setTimeout(r, 20));
const r1101b = await add(prodA.id, '2026-11-01'); // 同一天、後建立
const mine = pb.filter('product.brand = {:t}', { t: tag }); // 只看這支腳本建立的資料
const list = async (filter) =>
  (await pb.collection('purchase_records').getFullList({ filter: filter ? `${mine} && ${filter}` : mine, sort: '-purchase_date,-created' })).map((r) => r.id);
const name = (id) => ({ [r0930.id]: '9/30', [r1001.id]: '10/1', [r1031.id]: '10/31', [r1101.id]: '11/1', [r1101b.id]: '11/1(後)' })[id] ?? id;
const show = (ids) => ids.map(name).join(', ');

// 1. 關聯篩選（與 store.fetchRecords 相同的字串）
const byCat = await list(pb.filter('product.category = {:c}', { c: catA.id }));
check('product.category 篩選只有分類 A', show(byCat) === '11/1(後), 10/31, 9/30', show(byCat));

// 2. 日期區間（含結束日當天）
const range = await list(`${pb.filter('purchase_date >= {:s}', { s: '2026-10-01 00:00:00.000Z' })} && ${pb.filter('purchase_date <= {:e}', { e: '2026-10-31 23:59:59.999Z' })}`);
check('日期 10/1～10/31 含頭尾兩天', show(range) === '10/31, 10/1', show(range));
const onlyEnd = await list(pb.filter('purchase_date <= {:e}', { e: '2026-10-01 23:59:59.999Z' }));
check('只有結束日 10/1', show(onlyEnd) === '10/1, 9/30', show(onlyEnd));

// 3. 排序：新到舊，同一天後建立的在前
const all = await list('');
check('排序 -purchase_date,-created', show(all) === '11/1(後), 11/1, 10/31, 10/1, 9/30', show(all));

// 4. cascade：刪除購買記錄 → 欄位值一起刪除
await pb.collection('purchase_record_field_values').create({ purchase_record: r1031.id, custom_field: field.id, field_value: '12' });
await pb.collection('purchase_records').delete(r1031.id);
const left = await pb.collection('purchase_record_field_values').getFullList({ filter: pb.filter('purchase_record = {:id}', { id: r1031.id }) });
check('刪除記錄時欄位值一起刪除（cascade）', left.length === 0, `剩 ${left.length} 筆`);

// 5. 總價 0.004 → 400，錯誤在 data.total_price（store 轉成 ERR-010）
try {
  await add(prodA.id, '2026-10-02', { total_price: 0.004 });
  check('總價 0.004 被擋下', false, '居然寫入成功');
} catch (err) {
  check('總價 0.004 被擋下，錯誤在 data.total_price', err.status === 400 && Boolean(err.response?.data?.total_price), `${err.status} ${JSON.stringify(err.response?.data)}`);
}

// 6. 數量缺失：quantity 0、unit_price 0 可以寫入
const missing = await add(prodB.id, '2026-10-03', { quantity: 0, unit_price: 0 });
check('quantity 0 / unit_price 0 可以寫入', missing.quantity === 0 && missing.unit_price === 0);

// 7. getOne 找不到記錄 → 404（task 8.5：fakePocketBase 的 getOne 與 store.fetchRecord 依此判斷「已被刪除」）
try {
  await pb.collection('purchase_records').getOne('doesnotexist123');
  check('getOne 找不到 → 404', false, '居然找到了');
} catch (err) {
  check('getOne 找不到 → 404', err.status === 404, String(err.status));
}

// 收尾：刪掉這支腳本建立的資料
for (const r of await pb.collection('purchase_records').getFullList({ filter: mine })) await pb.collection('purchase_records').delete(r.id);
for (const p of [prodA, prodB]) await pb.collection('products').delete(p.id);
for (const c of [catA, catB]) await pb.collection('categories').delete(c.id); // custom_fields 會 cascade

done();
