// 商品詳情（task 7.5）：用真正的滑鼠事件操作，檢查資訊塊、歷史均價、購買記錄（新到舊、新增者頭像）、返回與入口
// 測試資料由本腳本用 API 建立：第二位家人 Bob（需要 superuser，users 的新增已鎖定）、春風的消耗設定與購買記錄。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { check, ok, done, mdIn, shortIn, dbDateIn } from './check.mjs';
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
const su = (await api('/collections/_superusers/auth-with-password', { identity: 'e2e@test.local', password: 'e2e-password-123' })).token;
const alice = await api('/collections/users/auth-with-password', { identity: 'alice@family.home', password: 'correct-password1' });
const bobs = (await api(`/collections/users/records?filter=${encodeURIComponent('name="Bob"')}`, null, su)).items;
const bob = bobs[0] ?? (await api('/collections/users/records', { email: 'bob@family.home', password: 'bob-password-123', passwordConfirm: 'bob-password-123', name: 'Bob' }, su));
const spring = (await api(`/collections/products/records?filter=${encodeURIComponent('brand="春風" && name="抽取式衛生紙"')}`, null, alice.token)).items[0];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${ymd(d)} 00:00:00.000Z`; };
// 剩 2 包、9 天前更新、每月用 4 包 → 15 天用完 → 還剩 6 天（即將耗盡）
await api(`/collections/products/records/${spring.id}`, { consumption_rate: 4, consumption_period: 'monthly', consumption_unit: '包', remaining_quantity: 2, remaining_updated_at: daysAgo(9), consumption_note: '一年大約用 48 包，量販店特價時一次買一箱' }, alice.token, 'PATCH');
const add = (p) => api('/collections/purchase_records/records', { product: spring.id, ...p }, alice.token);
await add({ purchase_date: daysAgo(40), store: '蝦皮', total_price: 549, quantity: 1200, unit_price: 0.4575, user: bob.id });
await add({ purchase_date: daysAgo(90), store: '家樂福', total_price: 629, quantity: 1200, unit_price: 0.5242, user: alice.record.id });
await add({ purchase_date: daysAgo(120), store: '市場', total_price: 100, user: bob.id }); // 數量未填
// run.sh 已建立一筆 2026-11-01 全聯 599 元 / 1200 抽（Alice）

// ---- 2. 無頭 Chrome ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9344', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9344/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
let id = 0; const pending = new Map();
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name, full = false) => { await js('document.fonts.ready.then(()=>1)'); const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
async function clickAt(x, y) { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(600); }
async function click(sel) { await js(`document.querySelector('${sel}')?.scrollIntoView({ block: 'center' })`); const p = await js(`(() => { const r = document.querySelector('${sel}')?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function clickText(sel, text) { const p = await js(`(() => { const el = [...document.querySelectorAll('${sel}')].find(e => e.textContent.includes(${JSON.stringify(text)})); el?.scrollIntoView({ block: 'center' }); const r = el?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function typeText(t) { await send('Input.insertText', { text: t }); await sleep(200); }
const all = (sel) => js(`[...document.querySelectorAll('${sel}')].map(e => e.textContent.trim().replace(/\\s+/g, ' '))`);
const path = () => js('location.pathname + location.search');

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}`);

await click('a[href="/products"]'); await sleep(1500);
await clickText('[role=radio]', '衛生紙'); await sleep(500);
await clickText('.list__row', '春風'); await sleep(1500);
ok('1 從衛生紙篩選點春風 → 商品詳情', /^\/products\/\w+$/.test(await path()), await path());
check('1 商品卡', [await js(`document.querySelector('.product__name')?.textContent.trim()`), await js(`document.querySelector('.product__meta')?.textContent.trim()`), await js(`document.querySelector('.product .depletion-badge')?.textContent.trim()`)], ['春風 抽取式衛生紙', '衛生紙 · 以「抽」計價 · 以「包」計算消耗', '即將耗盡']);
// 9 天前剩 2 包、每月 4 包 → 15 天 → 6 天後用完
check('2 資訊塊（AC-7.3、6.4）', [await all('.stat__label'), await all('.stat__value'), await all('.stat__sub')], [['剩餘數量', '預計用完', '歷史均價（3 筆）'], ['2 包', mdIn(6), '0.4936 元/抽'], [`${shortIn(-9)} 更新`, '剩 6 天 · 每月用 4 包']]);
check('3 備註', await js(`document.querySelector('.product__note')?.textContent.trim()`), '備註：一年大約用 48 包，量販店特價時一次買一箱');
const purchaseRows = await js(`[...document.querySelectorAll('.purchase')].map(r => [r.querySelector('.avatar').textContent.trim() + '(' + r.querySelector('.avatar').title + ' ' + getComputedStyle(r.querySelector('.avatar')).backgroundColor + ')', r.querySelector('.purchase__when').textContent.trim().replace(/\\s+/g, ' '), r.querySelector('.purchase__detail').textContent.trim(), r.querySelector('.purchase__total').textContent.trim()].join('｜'))`);
// run.sh 的種子記錄固定在 2026-11-01，其他記錄以今天推算：依日期排成新到舊
const seedOffset = Math.round((new Date(2026, 10, 1) - new Date(new Date().toDateString())) / 864e5);
const ALICE = 'e(Alice rgb(220, 241, 255))', BOB = 'b(Bob rgb(253, 231, 238))';
const expectedRows = [
  [seedOffset, ALICE, '全聯', '1,200 抽 · 0.4992 元/抽', '599 元'],
  [-40, BOB, '蝦皮', '1,200 抽 · 0.4575 元/抽', '549 元'],
  [-90, ALICE, '家樂福', '1,200 抽 · 0.5242 元/抽', '629 元'],
  [-120, BOB, '市場', '數量未填 · 無法計算', '100 元'],
].sort((a, b) => b[0] - a[0]).map(([d, who, store, detail, total]) => `${who}｜${shortIn(d)} · ${store}｜${detail}｜${total}`);
check('4 購買記錄新到舊、新增者頭像依使用者配色（AC-8.2）', purchaseRows, expectedRows);

await shot('pdetail-1', true);

await click('a[aria-label="返回商品"]'); await sleep(1500);
const filtered = await path();
ok('5 按返回箭頭 → 回到同一篩選的網址', /^\/products\?category=\w+$/.test(filtered), filtered);
check('5 篩選仍是衛生紙', await js(`document.querySelector('[role=radio][aria-checked=true]')?.textContent.trim()`), '衛生紙');

await clickText('.list__row', '春風'); await sleep(1500);
await click('a.edit-link');
ok('6 按「更新剩餘數量與消耗設定」→ 編輯頁', /^\/products\/\w+\/edit$/.test(await path()), await path());
await send('Runtime.evaluate', { expression: 'history.back()' }); await sleep(1500);
await send('Page.reload'); await sleep(2500);
ok('7 上一頁回詳情並重新整理', /^\/products\/\w+$/.test(await path()), await path());
check('7 返回箭頭仍指向同一篩選、記錄 4 筆', [await js(`document.querySelector('a[aria-label="返回商品"]').getAttribute('href')`), (await all('.purchase')).length], [filtered, 4]);

await send('Page.navigate', { url: base + '/products/not-a-real-id' }); await sleep(2000);
check('8 不存在的商品', [await js(`document.querySelector('.state')?.textContent.trim().replace(/\\s+/g, ' ')`), await js(`document.querySelector('a[aria-label="返回商品"]').getAttribute('href')`)], ['找不到這個商品，可能已被刪除。 回到商品列表', '/products']);

await send('Page.navigate', { url: base + '/products/' + spring.id }); await sleep(2000);
check('9 版面', await js(`({ 沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth, 預計用完區塊底色: getComputedStyle(document.querySelectorAll('.stat')[1]).backgroundColor, 歷史均價區塊底色: getComputedStyle(document.querySelectorAll('.stat')[2]).backgroundColor, 數字等寬: getComputedStyle(document.querySelector('.stat__value')).fontVariantNumeric })`), { 沒有橫向捲動: true, 預計用完區塊底色: 'rgb(255, 244, 220)', 歷史均價區塊底色: 'rgb(220, 241, 255)', 數字等寬: 'tabular-nums' });
sock.close(); chrome.kill();
done();
