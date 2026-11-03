// 刪除購買記錄（task 8.7）：從篩選過的列表點進詳情，用真正的滑鼠點「刪除這筆記錄」，
// 檢查 CONFIRM-001 對話框（alertdialog、寫出是哪一筆、焦點在「取消」），Esc 與「取消」都不刪，
// 按「刪除」後 MSG-006、回到同一個篩選的列表、資料庫的記錄與欄位值都刪掉、商品的歷史均價重算。
// 測試資料由本腳本用 API 建立在自己的分類「e2e刪除」下，不受其他腳本影響。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [,, base, outDir, w = '390', h = '844'] = process.argv;

// ---- 1. 測試資料（歷史均價：0.4992、0.4575、0.5242 → 0.4936；刪掉 0.5242 那筆 → 0.4784） ----
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
const cat = await api('/collections/categories/records', { name: 'e2e刪除' }, token);
const field = await api('/collections/custom_fields/records', { category: cat.id, field_name: '包數', field_type: 'number', is_quantity_component: false, display_order: 1 }, token);
const prod = await api('/collections/products/records', { category: cat.id, brand: '春風', name: '刪除測試紙', unit: '抽' }, token);
const add = (date, extra) =>
  api('/collections/purchase_records/records', { product: prod.id, purchase_date: `${date} 00:00:00.000Z`, store: '全聯', user: auth.record.id, quantity: 1200, ...extra }, token);
await add('2026-10-31', { total_price: 599, unit_price: 0.4992 });
await add('2026-09-05', { store: '蝦皮', total_price: 549, unit_price: 0.4575 });
const target = await add('2026-07-12', { store: '家樂福', total_price: 629, unit_price: 0.5242 });
await api('/collections/purchase_record_field_values/records', { purchase_record: target.id, custom_field: field.id, field_value: '12' }, token);
const inDb = async () => {
  const r = await fetch(`${base}/api/collections/purchase_records/records/${target.id}`, { headers: { Authorization: token } });
  const v = await api(`/collections/purchase_record_field_values/records?filter=${encodeURIComponent(`purchase_record="${target.id}"`)}`, null, token);
  return `記錄 ${r.status === 200 ? '還在' : `已刪除（${r.status}）`}、欄位值 ${v.items.length} 筆`;
};

// ---- 2. 無頭 Chrome（繁體中文語系：日期欄位是「年/月/日」） ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--lang=zh-TW', '--remote-debugging-port=9363', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9363/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
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
const dialogInfo = () => js(`(() => {
  const d = document.querySelector('[role=alertdialog]');
  if (!d) return null;
  return {
    標題: document.getElementById(d.getAttribute('aria-labelledby'))?.textContent.trim(),
    說明: document.getElementById(d.getAttribute('aria-describedby'))?.innerText.replace(/\\n+/g, '／'),
    焦點: document.activeElement?.textContent.trim(),
    刪除鈕底色: getComputedStyle([...d.querySelectorAll('button')].find(b => b.textContent.trim() === '刪除')).backgroundColor,
  };
})()`);
const rows = () => js(`document.querySelectorAll('.list__row').length`);

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}`);

await click('a[href="/purchases"]'); await sleep(1500);
await clickText('[role=radio]', 'e2e刪除'); await sleep(1000);
const listUrl = await js('decodeURIComponent(location.pathname + location.search)');
console.log('1 篩選「e2e刪除」→', listUrl, '| 筆數:', await rows());
await click(`a[href="/purchases/${target.id}"]`); await sleep(1500);
console.log('  詳情的刪除按鈕:', JSON.stringify(await js(`(() => { const b = document.querySelector('button.delete-button'); return { 文字: b?.textContent.trim(), 字色: b && getComputedStyle(b).color, 高度: b && Math.round(b.getBoundingClientRect().height) }; })()`)));

await click('button.delete-button'); await sleep(900);
console.log('2 點「刪除這筆記錄」→ 對話框:', JSON.stringify(await dialogInfo()));
await shot('pur-delete-1-dialog');

await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await sleep(900);
console.log('3 按 Esc → 對話框關閉:', (await dialogInfo()) === null, '|', await inDb(), '|', await js('location.pathname') === `/purchases/${target.id}` ? '留在詳情' : await js('location.pathname'));

await click('button.delete-button'); await sleep(900);
await clickText('[role=alertdialog] button', '取消'); await sleep(900);
console.log('4 按「取消」→ 對話框關閉:', (await dialogInfo()) === null, '|', await inDb());

await click('button.delete-button'); await sleep(900);
await clickText('[role=alertdialog] button', '刪除'); await sleep(1500);
console.log('5 按「刪除」→ 提示:', await toast(), '| 網址:', await js('decodeURIComponent(location.pathname + location.search)'), '| 回到同一個篩選:', (await js('decodeURIComponent(location.pathname + location.search)')) === listUrl, '| 筆數:', await rows());
console.log('  資料庫:', await inDb());
await shot('pur-delete-2-after');

await send('Page.navigate', { url: `${base}/products/${prod.id}` }); await sleep(2500);
console.log('6 商品詳情的歷史均價重算:', JSON.stringify(await js(`[...document.querySelectorAll('.stat--wide')].map(s => s.textContent.trim().replace(/\\s+/g, ' '))[0]`)));

await send('Page.navigate', { url: `${base}/purchases/${target.id}` }); await sleep(2500);
console.log('7 再打開被刪除的記錄:', await js(`document.querySelector('.state')?.textContent.trim().replace(/\\s+/g, ' ')`));
sock.close(); chrome.kill();
