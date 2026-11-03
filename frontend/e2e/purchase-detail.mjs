// 購買記錄詳情（task 8.5）：從列表用真正的滑鼠點進詳情，檢查設計稿 Pur-Detail 的內容與價格比較（高 / 低 / 無法比較），
// 再點商品名稱、編輯入口，並打開不存在的記錄。
// 測試資料由本腳本用 API 建立在自己的分類「e2e詳情」下，不受其他腳本影響。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [,, base, outDir, w = '390', h = '844'] = process.argv;

// ---- 1. 測試資料（設計稿的數字：0.4992、0.4575、0.5242 → 歷史均價 0.4936） ----
const api = async (path, body, token) => {
  const r = await fetch(`${base}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
};
const auth = await api('/collections/users/auth-with-password', { identity: 'alice@family.home', password: 'correct-password1' });
const token = auth.token;
const cat = await api('/collections/categories/records', { name: 'e2e詳情' }, token);
const fSheets = await api('/collections/custom_fields/records', { category: cat.id, field_name: '抽數', field_type: 'number', is_quantity_component: true, display_order: 1 }, token);
const fPacks = await api('/collections/custom_fields/records', { category: cat.id, field_name: '包數', field_type: 'number', is_quantity_component: true, display_order: 2 }, token);
const prod = await api('/collections/products/records', { category: cat.id, brand: '春風', name: '詳情測試紙', unit: '抽' }, token);
const add = (date, extra) =>
  api('/collections/purchase_records/records', { product: prod.id, purchase_date: `${date} 00:00:00.000Z`, store: '全聯', user: auth.record.id, total_price: 599, ...extra }, token);
await add('2026-07-12', { store: '家樂福', total_price: 629, quantity: 1200, unit_price: 0.5242 });
const low = await add('2026-09-05', { store: '蝦皮', total_price: 549, quantity: 1200, unit_price: 0.4575 });
const high = await add('2026-10-31', { quantity: 1200, unit_price: 0.4992 });
const noQty = await add('2026-10-20', { store: '市場', total_price: 90 });
for (const [f, v] of [[fSheets, '100'], [fPacks, '12']]) {
  await api('/collections/purchase_record_field_values/records', { purchase_record: high.id, custom_field: f.id, field_value: v }, token);
}

// ---- 2. 無頭 Chrome（繁體中文語系：日期欄位是「年/月/日」） ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--lang=zh-TW', '--remote-debugging-port=9361', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9361/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
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
const detail = () => js(`({
  網址: location.pathname,
  商品: document.querySelector('.record__product')?.textContent.trim(),
  總價: document.querySelector('.record__total')?.textContent.trim(),
  資訊: [...document.querySelectorAll('.facts dd')].map(d => d.textContent.trim().replace(/\\s+/g, ' ')),
  規格: [...document.querySelectorAll('.field')].map(f => f.querySelector('.field__label').textContent.trim() + '=' + f.querySelector('.field__value').textContent.trim()),
  數量與均價: [...document.querySelectorAll('.summary__value')].map(v => v.textContent.trim()),
  比較: [...document.querySelectorAll('.compare__text > span')].map(s => s.textContent.trim()),
  比較樣式: document.querySelector('.compare')?.className,
  比較底色: document.querySelector('.compare') && getComputedStyle(document.querySelector('.compare')).backgroundColor,
})`);
const layout = () => js(`({ 沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth, 編輯按鈕高度: Math.round(document.querySelector('a.edit-link').getBoundingClientRect().height) })`);

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}`);

await click('a[href="/purchases"]'); await sleep(1500);
await clickText('[role=radio]', 'e2e詳情'); await sleep(1000);
await click(`a[href="/purchases/${high.id}"]`); await sleep(1500);
console.log('1 列表點 10/31 那筆 → 詳情（比歷史均價高）:', JSON.stringify(await detail(), null, 1));
console.log('  版面:', JSON.stringify(await layout()));
await shot('pur-detail-1-higher');

await click('a[aria-label="返回購買記錄"]'); await sleep(1200);
console.log('2 返回箭頭 → 列表、篩選保留:', await js('decodeURIComponent(location.pathname + location.search)'));

await click(`a[href="/purchases/${low.id}"]`); await sleep(1500);
const d2 = await detail();
console.log('3 9/05 那筆（比歷史均價低）:', JSON.stringify({ 比較: d2.比較, 樣式: d2.比較樣式, 底色: d2.比較底色 }));
await shot('pur-detail-2-lower');

await send('Page.navigate', { url: `${base}/purchases/${noQty.id}` }); await sleep(2500);
const d3 = await detail();
console.log('4 沒有數量那筆（直接打網址）:', JSON.stringify({ 數量與均價: d3.數量與均價, 比較: d3.比較, 規格數: d3.規格.length, 返回: await js(`document.querySelector('a[aria-label="返回購買記錄"]').getAttribute('href')`) }));
await shot('pur-detail-3-na');

await click('.record__product a'); await sleep(1500);
console.log('5 點商品名稱 → 商品詳情:', await js('location.pathname') === `/products/${prod.id}`, '|', await js(`document.querySelector('.product__name')?.textContent.trim()`));

await send('Page.navigate', { url: `${base}/purchases/${high.id}` }); await sleep(2500);
await click('a.edit-link'); await sleep(1200);
console.log('6 編輯這筆記錄 →', await js('location.pathname') === `/purchases/${high.id}/edit`);

await send('Page.navigate', { url: `${base}/purchases/doesnotexist123` }); await sleep(2500);
console.log('7 不存在的記錄:', await js(`document.querySelector('.state')?.textContent.trim().replace(/\\s+/g, ' ')`));
sock.close(); chrome.kill();
