// 編輯購買記錄（task 8.6）：從詳情頁用真正的滑鼠點「編輯這筆記錄」，檢查預先帶入的值，
// 用鍵盤改總價與包數後存檔（BDD AC-5.7：599 → 549，單位均價重算），再試「取消」與總價 0 的錯誤。
// 測試資料由本腳本用 API 建立在自己的分類「e2e編輯」下，不受其他腳本影響。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [,, base, outDir, w = '390', h = '844'] = process.argv;

// ---- 1. 測試資料 ----
const api = async (path, body, token, method) => {
  const r = await fetch(`${base}/api${path}`, {
    method: method ?? (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
};
const auth = await api('/collections/users/auth-with-password', { identity: 'alice@family.home', password: 'correct-password1' });
const token = auth.token;
const cat = await api('/collections/categories/records', { name: 'e2e編輯' }, token);
const fSheets = await api('/collections/custom_fields/records', { category: cat.id, field_name: '抽數', field_type: 'number', is_quantity_component: true, display_order: 1 }, token);
const fPacks = await api('/collections/custom_fields/records', { category: cat.id, field_name: '包數', field_type: 'number', is_quantity_component: true, display_order: 2 }, token);
const prod = await api('/collections/products/records', { category: cat.id, brand: '春風', name: '編輯測試紙', unit: '抽' }, token);
const rec = await api('/collections/purchase_records/records', { product: prod.id, purchase_date: '2026-10-31 00:00:00.000Z', store: '全聯', user: auth.record.id, total_price: 599, quantity: 1200, unit_price: 0.4992 }, token);
for (const [f, v] of [[fSheets, '100'], [fPacks, '12']]) {
  await api('/collections/purchase_record_field_values/records', { purchase_record: rec.id, custom_field: f.id, field_value: v }, token);
}
const dbRecord = async () => {
  const r = await api(`/collections/purchase_records/records/${rec.id}`, null, token);
  const v = await api(`/collections/purchase_record_field_values/records?filter=${encodeURIComponent(`purchase_record="${rec.id}"`)}&sort=created`, null, token);
  return { 總價: r.total_price, 數量: r.quantity, 單位均價: r.unit_price, 新增者不變: r.user === auth.record.id, 欄位值: v.items.map((x) => x.field_value) };
};

// ---- 2. 無頭 Chrome（繁體中文語系：日期欄位是「年/月/日」） ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--lang=zh-TW', '--remote-debugging-port=9362', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9362/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
let id = 0; const pending = new Map();
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { await js('document.fonts.ready.then(()=>1)'); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
async function clickAt(x, y) { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(500); }
async function click(sel) { await js(`document.querySelector('${sel}')?.scrollIntoView({ block: 'center' })`); const p = await js(`(() => { const r = document.querySelector('${sel}')?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function clickText(sel, text) { const p = await js(`(() => { const el = [...document.querySelectorAll('${sel}')].find(e => e.textContent.trim() === ${JSON.stringify(text)} || e.textContent.includes(${JSON.stringify(text)})); el?.scrollIntoView({ block: 'center' }); const r = el?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function typeText(t) { await send('Input.insertText', { text: t }); await sleep(200); }
// keyDown 要帶 text（實際輸入的字），Chrome 才會把數字填進欄位
async function key(k, code, vk) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, text: k, unmodifiedText: k, windowsVirtualKeyCode: vk }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); await sleep(60); }
/** 在日期欄位用鍵盤打「年月日」：點欄位最左邊（年）再逐字輸入數字 */
async function typeDate(sel, yyyymmdd) {
  const p = await js(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return [r.x + 18, r.y + r.height / 2]; })()`);
  await clickAt(p[0], p[1]);
  for (const ch of yyyymmdd) await key(ch, `Digit${ch}`, 48 + Number(ch));
  await sleep(800);
}
const toast = () => js(`[...document.querySelectorAll('.q-notification')].map(n => n.textContent.trim()).join(' | ')`);
const form = () => js(`({
  標題: document.querySelector('h1')?.textContent.trim(),
  商品: document.querySelector('#p-product')?.selectedOptions[0]?.textContent.trim(),
  日期: document.querySelector('#p-date')?.value,
  地點: document.querySelector('#p-store')?.value,
  總價: document.querySelector('#p-price')?.value,
  抽數: document.querySelector('#cf-${fSheets.id}')?.value,
  包數: document.querySelector('#cf-${fPacks.id}')?.value,
  計算: document.querySelector('.preview__qty-value')?.textContent.trim() + ' / ' + document.querySelector('.preview__price-value')?.textContent.trim(),
})`);
/** 點一下欄位、全選後用鍵盤打字（insertText 會取代選取的文字） */
async function retype(sel, text) { await click(sel); await js(`document.querySelector('${sel}').select()`); await typeText(text); }

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}`);

await send('Page.navigate', { url: `${base}/purchases/${rec.id}` }); await sleep(2500);
await click('a.edit-link'); await sleep(1500);
console.log('1 詳情點「編輯這筆記錄」→', await js('location.pathname'), JSON.stringify(await form()));
await shot('pur-edit-1-prefilled');

await click('a.cancel'); await sleep(1200);
console.log('2 按取消 → 回詳情:', await js('location.pathname') === `/purchases/${rec.id}`);

await send('Page.navigate', { url: `${base}/purchases/${rec.id}/edit` }); await sleep(2500);
await retype('#p-price', '0'); await click('button[type=submit]'); await sleep(800);
console.log('3 總價改 0 送出 →', await js(`document.querySelector('#p-price-error')?.textContent.trim()`), '| 有「此欄位為必填」:', await js(`document.body.textContent.includes('此欄位為必填')`), '| 資料庫:', JSON.stringify(await dbRecord()));

await retype('#p-price', '549');
console.log('4 BDD 總價改 549 → 計算:', JSON.stringify((await form()).計算));
await retype(`#cf-${fPacks.id}`, '10');
console.log('5 包數改 10 → 計算:', JSON.stringify((await form()).計算));
await shot('pur-edit-2-changed');
await click('button[type=submit]'); await sleep(1500);
console.log('6 儲存變更 →', await js('location.pathname') === `/purchases/${rec.id}` ? '回到詳情' : await js('location.pathname'), '| 提示:', await toast());
console.log('  資料庫:', JSON.stringify(await dbRecord()));
console.log('  詳情畫面:', JSON.stringify(await js(`({ 總價: document.querySelector('.record__total')?.textContent.trim(), 規格: [...document.querySelectorAll('.field__value')].map(v => v.textContent.trim()), 數量與均價: [...document.querySelectorAll('.summary__value')].map(v => v.textContent.trim()), 比較: document.querySelector('.compare__title')?.textContent.trim() })`)));
await shot('pur-edit-3-saved');

await send('Page.navigate', { url: `${base}/purchases/doesnotexist123/edit` }); await sleep(2500);
console.log('7 不存在的記錄:', await js(`document.querySelector('.state')?.textContent.trim().replace(/\\s+/g, ' ')`), '| 有表單:', await js(`!!document.querySelector('form')`));
console.log('8 版面:', JSON.stringify(await js(`({ 沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth })`)));
sock.close(); chrome.kill();
