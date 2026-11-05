// 價格趨勢圖（task 10.2）：在真瀏覽器確認 Chart.js 畫出趨勢圖（canvas 像素）、用真正的滑鼠點資料點出現提示框，
// 以及只有 1 筆時顯示 STATUS-005。canvas 讀不到文字，所以用像素判斷，並看截圖。
// 測試資料由本腳本用 API 建立在自己的分類「e2e趨勢」下，不受其他腳本影響。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { check, ok, done, mdIn, shortIn, dbDateIn } from './check.mjs';
// 本腳本的購買日固定在 2026 年：今年只寫 M/D，其他年份寫 2026/M/D（App 的 formatShortDate）
const d26 = (m, d) => (new Date().getFullYear() === 2026 ? `${m}/${d}` : `2026/${m}/${d}`);
const [,, base, outDir, w = '390', h = '844'] = process.argv;

// ---- 1. 測試資料（設計稿 Prod-Trend：0.5242、0.4575、0.4992 → 歷史均價 0.4936） ----
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
const cat = await api('/collections/categories/records', { name: 'e2e趨勢' }, token);
const prod = await api('/collections/products/records', { category: cat.id, brand: '春風', name: '趨勢測試紙', unit: '抽' }, token);
const single = await api('/collections/products/records', { category: cat.id, brand: '春風', name: '只有一筆', unit: '抽' }, token);
const add = (product, date, extra) =>
  api('/collections/purchase_records/records', { product, purchase_date: `${date} 00:00:00.000Z`, store: '全聯', user: auth.record.id, total_price: 599, quantity: 1200, ...extra }, token);
await add(prod.id, '2026-07-12', { store: '家樂福', total_price: 629, unit_price: 0.5242 });
await add(prod.id, '2026-09-05', { store: '蝦皮', total_price: 549, unit_price: 0.4575 });
await add(prod.id, '2026-10-20', { unit_price: 0.4992 });
await add(prod.id, '2026-10-25', { total_price: 90, quantity: 0, unit_price: 0 }); // 數量沒填：不畫
await add(single.id, '2026-10-20', { unit_price: 0.4992 });

// ---- 2. 無頭 Chrome（繁體中文語系：日期欄位是「年/月/日」） ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--lang=zh-TW', '--remote-debugging-port=9365', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9365/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
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
/** canvas 上主色（#1d5fd6）與深色（提示框 #1b1d1f）的像素數，以及最右邊那個主色像素的位置（最後一個資料點） */
const pixels = () => js(`(() => {
  const c = document.querySelector('.trend canvas'); if (!c) return null;
  const ctx = c.getContext('2d'); const { width, height } = c; const d = ctx.getImageData(0, 0, width, height).data;
  let accent = 0, dark = 0, right = null;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a < 200) continue;
    if (Math.abs(r - 29) < 12 && Math.abs(g - 95) < 12 && Math.abs(b - 214) < 12) { accent++; if (!right || x > right.x) right = { x, y }; }
    if (r < 40 && g < 40 && b < 45) dark++;
  }
  const box = c.getBoundingClientRect(); const sx = box.width / width, sy = box.height / height;
  return { 主色像素: accent, 深色像素: dark, 最右點: right && { x: Math.round(box.left + right.x * sx), y: Math.round(box.top + right.y * sy) }, 圖大小: [Math.round(box.width), Math.round(box.height)] };
})()`);

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}`);

await send('Page.navigate', { url: `${base}/products/${prod.id}` }); await sleep(3000);
check('1 趨勢圖在商品卡與購買記錄之間', await js(`[...document.querySelectorAll('section.card h2')].map(h => h.textContent.trim())`), ['春風 趨勢測試紙', '單位均價趨勢', '購買記錄（新到舊）']);
check('1 標題列、無障礙說明（數量沒填的不畫）', await js(`({ 標題列: document.querySelector('.trend__meta')?.textContent.trim(), 說明: document.querySelector('.trend canvas')?.getAttribute('aria-label'), 角色: document.querySelector('.trend canvas')?.getAttribute('role') })`), { 標題列: '3 筆 · 元/抽', 說明: `單位均價趨勢：${d26(7, 12)} 0.5242、${d26(9, 5)} 0.4575、${d26(10, 20)} 0.4992 元/抽；歷史均價 0.4936 元/抽`, 角色: 'img' });
await js(`document.querySelector('.trend').scrollIntoView({ block: 'center' })`); await sleep(500);
const before = await pixels();
ok('2 Chart.js 有畫出線（canvas 有主色像素）', before?.主色像素 > 200, before);
check('2 圖的大小', before?.圖大小, [326, 180]);
await shot('trend-1-chart');
if (before?.最右點) { await clickAt(before.最右點.x, before.最右點.y); await sleep(600); }
const after = await pixels();
ok('3 用真正的滑鼠點最右邊的資料點 → 出現深色提示框', after?.深色像素 > (before?.深色像素 ?? 0) + 300, { 前: before?.深色像素, 後: after?.深色像素 });
await shot('trend-2-tooltip');

await send('Page.navigate', { url: `${base}/products/${single.id}` }); await sleep(2500);
check('4 只有 1 筆 → STATUS-005、不畫圖', await js(`({ 狀態: document.querySelector('.trend [role=status]')?.innerText.replace(/\\n+/g, '／'), 有畫圖: !!document.querySelector('.trend canvas') })`), { 狀態: '尚無足夠資料顯示趨勢圖／要有 2 筆以上算得出單位均價的購買記錄（目前 1 筆）', 有畫圖: false });
await js(`document.querySelector('.trend').scrollIntoView({ block: 'center' })`); await sleep(400);
await shot('trend-3-empty');
check('5 版面', await js(`({ 沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth })`), { 沒有橫向捲動: true });
sock.close(); chrome.kill();
done();
