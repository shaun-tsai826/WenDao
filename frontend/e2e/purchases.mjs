// 購買記錄列表（task 8.3）：用真正的滑鼠點分類、用鍵盤在日期欄位打字，走過 BDD 的篩選與 ERR-012
// 測試資料由本腳本用 API 建立在自己的分類「e2e購買」下（BDD AC-8.6 的 4 個日期），不受其他腳本影響。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [,, base, outDir, w = '390', h = '844'] = process.argv;

// ---- 1. 測試資料 ----
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
const cat = await api('/collections/categories/records', { name: 'e2e購買' }, token);
const egg = await api('/collections/products/records', { category: cat.id, brand: '大成', name: '雞蛋', unit: '顆' }, token);
const milk = await api('/collections/products/records', { category: cat.id, brand: '光泉', name: '鮮乳', unit: 'ml' }, token);
const add = (product, date, extra) =>
  api('/collections/purchase_records/records', { product, purchase_date: `${date} 00:00:00.000Z`, store: '全聯', user: auth.record.id, ...extra }, token);
await add(egg.id, '2026-09-30', { total_price: 85, quantity: 10, unit_price: 8.5 });
await add(milk.id, '2026-10-01', { total_price: 95, quantity: 1858, unit_price: 0.0511, store: '家樂福' });
await add(egg.id, '2026-10-31', { total_price: 90, store: '市場' }); // 數量未填
await add(milk.id, '2026-11-01', { total_price: 99, quantity: 1858, unit_price: 0.0533 });

// ---- 2. 無頭 Chrome（繁體中文語系：日期欄位是「年/月/日」） ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--lang=zh-TW', '--remote-debugging-port=9354', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9354/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
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
const rows = () => js(`[...document.querySelectorAll('.list__row')].map(r => r.querySelector('.row__name').textContent.trim() + '｜' + r.querySelector('.row__when').textContent.trim() + '｜' + r.querySelector('.row__amount').textContent.trim() + '｜' + r.querySelector('.row__total').textContent.trim() + '｜' + r.querySelector('.avatar').getAttribute('aria-label'))`);
const state = () => js(`({ 網址: decodeURIComponent(location.pathname + location.search), 開始: document.querySelector('#purchases-start').value, 結束: document.querySelector('#purchases-end').value, 筆數: document.querySelectorAll('.list__row').length })`);

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}`);

await click('a[href="/purchases"]'); await sleep(1500);
console.log('1 導覽列進入購買記錄:', await js('location.pathname'), '|', await js(`document.querySelector('.page__meta')?.textContent.trim()`));

await clickText('[role=radio]', 'e2e購買'); await sleep(1000);
console.log('2 BDD 選分類「e2e購買」→ 新到舊:', JSON.stringify(await state()));
for (const r of await rows()) console.log('   ', r);
await shot('pur-1-list');

await typeDate('#purchases-start', '20261001');
await typeDate('#purchases-end', '20261031');
console.log('3 BDD 開始 10/1、結束 10/31（鍵盤輸入）:', JSON.stringify(await state()));
for (const r of await rows()) console.log('   ', r);

await typeDate('#purchases-end', '20260930');
console.log('4 BDD 結束改成 9/30（早於開始）:', await js(`document.querySelector('#purchases-end-error')?.textContent.trim()`), '| 紅框:', await js(`document.querySelector('#purchases-end').getAttribute('aria-invalid')`), '| 說明:', await js(`document.querySelector('.list__note')?.textContent.trim()`), '|', JSON.stringify(await state()));
await shot('pur-2-range-error');

await typeDate('#purchases-end', '20261101');
console.log('5 結束改成 11/1 → 錯誤消失:', await js(`!document.querySelector('#purchases-end-error')`), '|', JSON.stringify(await state()));

await click('.list__row'); await sleep(1200);
console.log('6 點第一列 → 詳情:', await js('location.pathname'));
await send('Runtime.evaluate', { expression: 'history.back()' }); await sleep(1500);
console.log('7 上一頁 → 篩選保留:', JSON.stringify(await state()));
await send('Page.reload'); await sleep(2500);
console.log('8 重新整理 → 篩選保留:', JSON.stringify(await state()), '| 選中的分類:', await js(`document.querySelector('[role=radio][aria-checked=true]')?.textContent.trim()`));

console.log('9 版面:', JSON.stringify(await js(`({ 沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth, 日期欄位字級: getComputedStyle(document.querySelector('#purchases-start')).fontSize, 每列高度: Math.round(document.querySelector('.list__row').getBoundingClientRect().height) })`)));
await click('a.add-link'); await sleep(1000);
console.log('10 新增記錄按鈕:', await js('location.pathname'));
sock.close(); chrome.kill();
