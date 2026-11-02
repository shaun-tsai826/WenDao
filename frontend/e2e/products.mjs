// 商品列表（task 7.3）：用真正的滑鼠事件操作，檢查排序、狀態標籤、分類篩選、導頁與版面
// 測試資料由本腳本用 API 建立（以今天為基準推算日期），不依賴其他腳本的執行順序。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [,, base, outDir, w = '390', h = '844'] = process.argv;

// ---- 1. 用 API 建立測試資料 ----
const api = async (path, body, token) => {
  const r = await fetch(`${base}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
};
const { token } = await api('/collections/users/auth-with-password', { identity: 'alice@family.home', password: 'correct-password1' });
const cats = (await api('/collections/categories/records?perPage=200', null, token)).items;
const catId = async (name) => cats.find((c) => c.name === name)?.id ?? (await api('/collections/categories/records', { name }, token)).id;
const tissue = await catId('衛生紙');
const clean = await catId('清潔劑');
await catId('零食'); // 空分類，測「分類下沒有商品」
const pad = (n) => String(n).padStart(2, '0');
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00.000Z`; };
const add = (p) => api('/collections/products/records', { consumption_unit: '包', ...p }, token);
await add({ category: clean, brand: '白蘭', name: '洗衣精補充包', unit: 'ml', consumption_rate: 2, consumption_period: 'monthly', remaining_quantity: 0.5, remaining_updated_at: daysAgo(15) }); // 8 天前用完
await add({ category: tissue, brand: 'Kleenex', name: '舒潔衛生紙', unit: '抽', consumption_rate: 2, consumption_period: 'monthly' }); // 未設定剩餘數量
await add({ category: tissue, brand: '舒潔', name: '濕紙巾', unit: '片', consumption_rate: 1, consumption_period: 'weekly', remaining_quantity: 1, remaining_updated_at: daysAgo(3) }); // 4 天後
await add({ category: clean, brand: '泡舒', name: '洗碗精', unit: 'ml', consumption_unit: '瓶', consumption_rate: 1, consumption_period: 'monthly', remaining_quantity: 1, remaining_updated_at: daysAgo(4) }); // 26 天後
// 種子資料「春風 抽取式衛生紙」沒有消耗速率 → 未設定消耗速率

// ---- 2. 無頭 Chrome ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9340', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9340/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
let id = 0; const pending = new Map();
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { await js('document.fonts.ready.then(()=>1)'); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
async function clickAt(x, y) { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(600); }
async function click(sel) { const p = await js(`(() => { const r = document.querySelector('${sel}')?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function clickText(sel, text) { const p = await js(`(() => { const el = [...document.querySelectorAll('${sel}')].find(e => e.textContent.trim() === ${JSON.stringify(text)} || e.textContent.includes(${JSON.stringify(text)})); const r = el?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function typeText(t) { await send('Input.insertText', { text: t }); await sleep(200); }
const rows = () => js(`[...document.querySelectorAll('.list__row')].map(r => r.querySelector('.list__name').textContent.trim() + '｜' + r.querySelector('.list__sub').textContent.trim() + '｜' + (r.querySelector('.depletion-badge')?.textContent.trim() ?? '—'))`);
const meta = () => js(`document.querySelector('.page__meta')?.textContent.trim()`);
const checked = () => js(`document.querySelector('[role=radio][aria-checked=true]')?.textContent.trim()`);

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}`);

await click('a[href="/products"]'); await sleep(1500);
console.log('1 導覽列進入商品:', await js('location.pathname'), '|', await meta(), '| 篩選:', await checked());
for (const r of await rows()) console.log('   ', r);
await shot('prod-1-list');

await clickText('[role=radio]', '清潔劑');
console.log('2 篩選清潔劑:', await checked(), '|', await meta());
for (const r of await rows()) console.log('   ', r);
await shot('prod-2-filter');

await clickText('[role=radio]', '零食');
console.log('3 篩選零食（空）:', await js(`document.querySelector('.list__state')?.textContent.trim()`));

await clickText('[role=radio]', '全部');
console.log('4 回到全部:', await meta());

await clickText('.list__row', '春風');
console.log('5 點春風 → 商品詳情:', await js('location.pathname'));
await send('Runtime.evaluate', { expression: 'history.back()' }); await sleep(1200);
console.log('6 上一頁回到列表:', await js('location.pathname'), '|', (await rows()).length, '項');

const layout = await js(`(() => {
  const badges = [...document.querySelectorAll('.depletion-badge')];
  return {
    沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth,
    標籤單行: badges.every(b => b.getBoundingClientRect().height < 30),
    標籤在卡片內: badges.every(b => b.getBoundingClientRect().right <= document.querySelector('.list').getBoundingClientRect().right),
    字體: getComputedStyle(document.querySelector('.list__name')).fontFamily.split(',')[0],
    標籤配色: badges.map(b => getComputedStyle(b).backgroundColor).join(' / '),
  };
})()`);
console.log('7 版面:', JSON.stringify(layout));

await click('a.add-link');
console.log('8 新增商品按鈕:', await js('location.pathname'));
sock.close(); chrome.kill();
