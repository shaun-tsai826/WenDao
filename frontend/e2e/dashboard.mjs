// 首頁 / 儀表板（task 9.1）：用 API 建立各種狀態的商品，檢查補貨提醒的摘要、清單順序與文字、庫存正常，
// 並用真正的滑鼠點清單列、「記一筆」、「全部商品」。
// e2e 共用同一個臨時資料庫（其他腳本也會建商品），所以只檢查本腳本在分類「e2e首頁」下建立的商品，
// 摘要數字則和畫面上的清單列數互相核對。沒有商品 / 沒有需要補貨的畫面由單元測試涵蓋。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [,, base, outDir, w = '390', h = '844'] = process.argv;

// ---- 1. 測試資料：每月用 30 → 一天 1 個（以裝置本地的今天計算） ----
const pad = (n) => String(n).padStart(2, '0');
const day = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const md = (offset) => { const [, m, d] = day(offset).split('-'); return `${Number(m)}/${Number(d)}`; };
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
const cat = await api('/collections/categories/records', { name: 'e2e首頁' }, token);
const add = (brand, name, remaining, updatedOffset, extra = {}) =>
  api('/collections/products/records', {
    category: cat.id, brand, name, unit: '個', consumption_unit: '包',
    consumption_rate: 30, consumption_period: 'monthly',
    remaining_quantity: remaining, remaining_updated_at: `${day(updatedOffset)} 00:00:00.000Z`, ...extra,
  }, token);
const dep = await add('首頁', '已耗盡品', 5, -20); // 15 天前用完
const soon1 = await add('首頁', '明天用完', 1, 0);
const soon7 = await add('首頁', '第七天', 7, 0);
const day8 = await add('首頁', '第八天', 8, 0); // 正常
await api('/collections/products/records', { category: cat.id, brand: '首頁', name: '未設定', unit: '個' }, token);

// ---- 2. 無頭 Chrome（繁體中文語系：日期欄位是「年/月/日」） ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--lang=zh-TW', '--remote-debugging-port=9364', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9364/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
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
const reminders = () => js(`[...document.querySelectorAll('.reminders .list__row')].map(r => ({ 名稱: r.querySelector('.list__name').textContent.trim(), 第二行: r.querySelector('.list__sub').textContent.trim(), 標籤: r.querySelector('.depletion-badge')?.textContent.trim(), 連結: r.getAttribute('href') }))`);
const summary = () => js(`[...document.querySelectorAll('.summary__item')].map(s => s.textContent.trim().replace(/\\s+/g, ' '))`);
const normal = () => js(`[...document.querySelectorAll('.normal__row')].map(r => r.textContent.trim().replace(/\\s+/g, ' '))`);

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2500);
console.log(`畫面 ${w}x${h}（今天 ${day(0)}）`);

console.log('1 登入後在首頁:', await js('location.pathname'), '|', await js(`document.querySelector('h1')?.textContent.trim()`), '|', await js(`document.querySelector('.page__meta')?.textContent.trim()`));
const s = await summary(); const rs = await reminders();
console.log('2 摘要:', JSON.stringify(s), '| 清單列數:', rs.length);
const n = (t) => Number((t.match(/(\d+) 項/) || [])[1]);
console.log('  摘要加總 = 清單列數:', n(s[0]) + n(s[1]) === rs.length, '| 已耗盡數 = 標籤「已耗盡」列數:', n(s[0]) === rs.filter(r => r.標籤 === '已耗盡').length);
const mine = rs.filter((r) => r.名稱.startsWith('首頁 '));
console.log('3 本腳本的提醒（依序）:');
for (const r of mine) console.log('   ', JSON.stringify(r));
console.log('  預期第二行:', JSON.stringify([`剩 5 包 · ${md(-15)} 已用完`, `剩 1 包 · 預計 ${md(1)}（剩 1 天）`, `剩 7 包 · 預計 ${md(7)}（剩 7 天）`]));
console.log('  「第八天」不在提醒、「未設定」不在提醒:', !rs.some(r => r.名稱.includes('第八天')), !rs.some(r => r.名稱.includes('未設定')));
const nm = await normal();
console.log('4 庫存正常（最多 5 項）:', nm.length, JSON.stringify(nm));
await shot('dash-1');

await click(`a[href="/products/${soon1.id}"]`); await sleep(1500);
console.log('5 點「首頁 明天用完」→ 商品詳情:', await js('location.pathname') === `/products/${soon1.id}`, '|', await js(`document.querySelector('.product__name')?.textContent.trim()`));
await send('Runtime.evaluate', { expression: 'history.back()' }); await sleep(1500);
await click('a.add-link'); await sleep(1500);
console.log('6 記一筆 →', await js('location.pathname'));
await click('a[href="/"]'); await sleep(1500);
await click('a.normal__all'); await sleep(1500);
console.log('7 底部導覽回首頁、按「全部商品」→', await js('location.pathname'));
await click('a[href="/"]'); await sleep(1500);
console.log('8 版面:', JSON.stringify(await js(`({ 沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth, 首頁導覽為目前頁: document.querySelector('a[href="/"][aria-current=page]') !== null })`)));
sock.close(); chrome.kill();
