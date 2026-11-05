// 更新消耗設定（task 7.6）：用真正的滑鼠與鍵盤操作，走過 BDD（負數、缺消耗單位、儲存記錄今天）與即時預估
// 測試資料由本腳本用 API 建立（舒潔 廚房紙巾：剩 2 包、9 天前更新、每月用 4 包）。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { check, ok, done, mdIn, shortIn, dbDateIn } from './check.mjs';
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
const { token } = await api('/collections/users/auth-with-password', { identity: 'alice@family.home', password: 'correct-password1' });
const tissue = (await api('/collections/categories/records?perPage=200', null, token)).items.find((c) => c.name === '衛生紙').id;
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const product = await api('/collections/products/records', { category: tissue, brand: '舒潔', name: '廚房紙巾', unit: '張', consumption_unit: '包', consumption_rate: 4, consumption_period: 'monthly', remaining_quantity: 2, remaining_updated_at: `${ymd(daysFromNow(-9))} 00:00:00.000Z`, consumption_note: '' }, token);

// ---- 2. 無頭 Chrome ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9346', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9346/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
let id = 0; const pending = new Map();
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { await js('document.fonts.ready.then(()=>1)'); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
async function clickAt(x, y) { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(500); }
async function click(sel) { await js(`document.querySelector('${sel}')?.scrollIntoView({ block: 'center' })`); const p = await js(`(() => { const r = document.querySelector('${sel}')?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function clickText(sel, text) { const p = await js(`(() => { const el = [...document.querySelectorAll('${sel}')].find(e => e.textContent.includes(${JSON.stringify(text)})); el?.scrollIntoView({ block: 'center' }); const r = el?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function typeText(t) { await send('Input.insertText', { text: t }); await sleep(200); }
async function key(k, code, vk, commands = []) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, commands }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code }); await sleep(100); }
async function setField(sel, value) { await click(sel); await key('a', 'KeyA', 65, ['selectAll']); if (value) await typeText(value); else await key('Backspace', 'Backspace', 8, ['deleteBackward']); }
const val = (sel) => js(`document.querySelector('${sel}').value`);
const preview = () => js(`[...document.querySelectorAll('.preview > span')].map(s => s.textContent.trim()).join(' / ')`);
const alert = () => js(`document.querySelector('form [role=alert]')?.textContent.trim()`);
const path = () => js('location.pathname');

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}（今天 ${md(new Date())}）`);

await click('a[href="/products"]'); await sleep(1500);
await clickText('.list__row', '廚房紙巾'); await sleep(1500);
await click('a.edit-link'); await sleep(1500);
check('1 詳情 → 更新消耗設定', [await path(), await js(`document.querySelector('.back-row__sub').textContent.trim()`)], [`/products/${product.id}/edit`, '舒潔 廚房紙巾']);
check('1 帶入目前的設定', { 剩餘: await val('#e-remain'), 單位: await js(`document.querySelector('.remain__unit')?.textContent.trim()`), 週期: await js(`document.querySelector('input[name=period]:checked').value`), 用掉: await val('#e-rate'), 消耗單位: await val('#e-cunit') }, { 剩餘: '2', 單位: '包', 週期: 'monthly', 用掉: '4', 消耗單位: '包' });
check('1 剩餘數量的說明', await js(`document.querySelector('#e-remain-hint').textContent.trim()`), `儲存時記為今天（${mdIn(0)}）更新；上次更新 ${mdIn(-9)}。清空代表不追蹤剩餘數量`);
check('1 即時預估（以今天為起點）', await preview(), `依這個設定 / 預計 ${mdIn(15)} 用完（剩 15 天） / 2 ÷ 4 × 30 天 = 15 天`);
await shot('pedit-1');

await setField('#e-remain', '-5'); await click('button[type=submit]'); await sleep(1000);
check('2 BDD 輸入 -5 並儲存 → ERR-015（AC-7.10）', [await alert(), await js('document.activeElement.id'), await js(`!!document.querySelector('.remain--invalid')`), await preview()], ['剩餘數量不可為負數', 'e-remain', true, '修正剩餘數量後，就能預估用完日']);
await shot('pedit-2-negative');

await setField('#e-remain', '３');
check('3 改成全形「３」→ 整理成 3、紅框拿掉', [await val('#e-remain'), await js(`!document.querySelector('.remain--invalid')`), await preview()], ['3', true, `依這個設定 / 預計 ${mdIn(23)} 用完（剩 23 天） / 3 ÷ 4 × 30 天 ≈ 23 天`]);

await clickText('.period__option', '每週');
check('4 點「每週」→ 預估改變', await preview(), `依這個設定 / 預計 ${mdIn(5)} 用完（剩 5 天） / 3 ÷ 4 × 7 天 ≈ 5 天`);

await setField('#e-cunit', ''); await click('button[type=submit]'); await sleep(1000);
check('5 BDD 清空消耗單位並儲存 → ERR-016（AC-7.11）', [await alert(), await js('document.activeElement.id'), await js(`document.querySelector('.remain__unit')?.textContent.trim() ?? '（無）'`)], ['請設定消耗單位', 'e-cunit', '（無）']);

await click('#e-cunit'); await typeText('包'); await click('#e-note'); await typeText('每週消耗量約0.5包');
await click('button[type=submit]'); await sleep(1800);
check('6 儲存 → MSG-007、回到詳情', [await js(`document.querySelector('.q-notification')?.textContent.trim()`), await path()], ['商品更新成功', `/products/${product.id}`]);
check('6 詳情資訊塊與備註', [await js(`[...document.querySelectorAll('.stat__value, .stat__sub')].map(e => e.textContent.trim().replace(/\\s+/g, ' '))`), await js(`document.querySelector('.product__note')?.textContent.trim()`)], [['3 包', `${shortIn(0)} 更新`, mdIn(5), '剩 5 天 · 每週用 4 包', '—'], '備註：每週消耗量約0.5包']);
const saved = await api(`/collections/products/records/${product.id}`, null, token);
check('6 資料庫：剩餘數量與今天的更新日（AC-7.9）', { remaining_quantity: saved.remaining_quantity, remaining_updated_at: saved.remaining_updated_at, consumption_rate: saved.consumption_rate, consumption_period: saved.consumption_period, consumption_unit: saved.consumption_unit }, { remaining_quantity: 3, remaining_updated_at: dbDateIn(0), consumption_rate: 4, consumption_period: 'weekly', consumption_unit: '包' });

await send('Runtime.evaluate', { expression: 'history.back()' }); await sleep(1500);
check('7 再按上一頁（儲存沒有多留紀錄）', await path(), '/products');

await send('Page.navigate', { url: `${base}/products/${product.id}/edit` }); await sleep(2000);
await setField('#e-remain', '');
check('8 直接開編輯頁、清空剩餘數量 → 預估提示', await preview(), '填入現在還剩多少，就能預估用完日');
await click('a.cancel'); await sleep(1200);
check('9 按取消 → 回詳情、剩餘數量沒變', [await path(), await js(`document.querySelector('.stat__value').textContent.trim().replace(/\\s+/g, ' ')`)], [`/products/${product.id}`, '3 包']);

await send('Page.navigate', { url: `${base}/products/${product.id}/edit` }); await sleep(2000);
check('10 版面', await js(`({ 沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth, 數字鍵盤: document.querySelector('#e-remain').inputMode + '/' + document.querySelector('#e-rate').inputMode, 輸入框字級: getComputedStyle(document.querySelector('#e-rate')).fontSize })`), { 沒有橫向捲動: true, 數字鍵盤: 'decimal/decimal', 輸入框字級: '16px' });
sock.close(); chrome.kill();
done();
