// 新增購買記錄（task 8.4，含 8.2 CustomFieldInput）：用真正的滑鼠與鍵盤走完新增流程
// 測試資料由本腳本用 API 建立：分類「e2e採買」（片數、盒數算數量；香味只記錄）、商品目前剩 2 盒；
// 分類「e2e散裝」沒有自訂欄位（直接輸入數量）。不依賴其他腳本修改過的種子資料。
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
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const auth = await api('/collections/users/auth-with-password', { identity: 'alice@family.home', password: 'correct-password1' });
const token = auth.token;
const boxCat = await api('/collections/categories/records', { name: 'e2e採買' }, token);
for (const [i, f] of [['片數', 'number', true], ['盒數', 'number', true], ['香味', 'text', false]].entries()) {
  await api('/collections/custom_fields/records', { category: boxCat.id, field_name: f[0], field_type: f[1], is_quantity_component: f[2], display_order: i + 1 }, token);
}
const tissue = await api('/collections/products/records', { category: boxCat.id, brand: 'Zeta', name: '盒裝面紙', unit: '片', consumption_unit: '盒', consumption_rate: 2, consumption_period: 'monthly', remaining_quantity: 2, remaining_updated_at: `${ymd(new Date(Date.now() - 5 * 86400000))} 00:00:00.000Z` }, token);
const bulkCat = await api('/collections/categories/records', { name: 'e2e散裝' }, token);
const bean = await api('/collections/products/records', { category: bulkCat.id, brand: 'Yolo', name: '散裝綠豆', unit: 'g' }, token);

// ---- 2. 無頭 Chrome ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--lang=zh-TW', '--remote-debugging-port=9356', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9356/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
let id = 0; const pending = new Map();
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { await js('document.fonts.ready.then(()=>1)'); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
async function clickAt(x, y) { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(450); }
async function click(sel) { await js(`document.querySelector('${sel}')?.scrollIntoView({ block: 'center' })`); const p = await js(`(() => { const r = document.querySelector('${sel}')?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function clickText(sel, text) { const p = await js(`(() => { const el = [...document.querySelectorAll('${sel}')].find(e => e.textContent.trim() === ${JSON.stringify(text)}); el?.scrollIntoView({ block: 'center' }); const r = el?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function typeText(t) { await send('Input.insertText', { text: t }); await sleep(150); }
async function key(k, code, vk, extra = {}) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, ...extra }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); await sleep(80); }
async function setField(sel, value) { await click(sel); await key('a', 'KeyA', 65, { commands: ['selectAll'] }); if (value) await typeText(value); else await key('Backspace', 'Backspace', 8, { commands: ['deleteBackward'] }); }
/** 下拉選單：用 Tab 從前一個欄位移過去，再用鍵盤打字快速跳選（品牌用英文開頭） */
async function chooseProduct(letter) {
  await js(`document.querySelector('#p-product').focus()`);
  await key(letter, `Key${letter}`, letter.charCodeAt(0), { text: letter.toLowerCase(), unmodifiedText: letter.toLowerCase() });
  await sleep(800);
}
const val = (sel) => js(`document.querySelector('${sel}')?.value`);
const txt = (sel) => js(`document.querySelector('${sel}')?.textContent.trim().replace(/\\s+/g, ' ')`);
const preview = () => js(`[...document.querySelectorAll('.preview__value, .preview__formula, .preview__hint')].map(e => e.textContent.trim()).join(' / ')`);
const toast = () => js(`[...document.querySelectorAll('.q-notification')].map(n => n.textContent.trim()).join(' | ')`);

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}（今天 ${ymd(new Date())}）`);

await click('a[href="/purchases"]'); await sleep(1200);
await click('a.add-link'); await sleep(1500);
console.log('1 購買記錄 → 新增記錄:', await js('location.pathname'), '| 商品:', await js(`document.querySelector('#p-product').selectedOptions[0].textContent.trim()`), '| 日期預設:', await val('#p-date'), '| 計算區:', await preview());
console.log('  常去的地點:', JSON.stringify(await js(`[...document.querySelectorAll('.store-chip')].map(c => c.textContent.trim())`)));

await click('button[type=submit]'); await sleep(800);
console.log('2 什麼都沒填就送出 → 摘要:', await txt('.form-summary'), '| 焦點在摘要:', await js(`document.activeElement === document.querySelector('.form-summary')`));
await shot('pnewp-1-empty-error');
await clickText('.form-summary__link', '購買地點：此欄位為必填');
console.log('3 點摘要裡的「購買地點」→ 焦點:', await js('document.activeElement.id'));

await chooseProduct('Z');
console.log('4 鍵盤選商品「Zeta 盒裝面紙」:', await js(`document.querySelector('#p-product').selectedOptions[0].textContent.trim()`), '| 卡片標題:', await txt('.cf h2'), '| 欄位:', JSON.stringify(await js(`[...document.querySelectorAll('.cf label')].map(l => l.textContent.trim())`)), '| 摘要剩:', await txt('.form-summary__title'));

await click('#cf-' + (await js(`document.querySelector('.cf label').getAttribute('for').replace('cf-', '')`)));
await typeText('１００片'); // 全形＋文字 → 整理成 100
const [sheets, boxes, scent] = await js(`[...document.querySelectorAll('.cf input')].map(i => '#' + i.id)`);
await click(boxes); await typeText('0'); await click(scent); // 離開盒數 → 檢查
console.log('5 片數輸入「１００片」→', await val(sheets), '| 盒數填 0 離開 → ', await js(`document.querySelector('${boxes}').getAttribute('aria-invalid')`), await js(`document.getElementById(document.querySelector('${boxes}').getAttribute('aria-describedby'))?.textContent.trim()`));
await setField(boxes, '3'); await click(scent); await typeText('無香');
console.log('6 盒數改 3 → 錯誤拿掉:', await js(`document.querySelector('${boxes}').getAttribute('aria-invalid')`), '| 計算區:', await preview());

await clickText('.store-chip', '全聯');
console.log('7 點常去的地點「全聯」→', await val('#p-store'), '| 按鈕狀態:', await js(`[...document.querySelectorAll('.store-chip')].find(c => c.textContent.trim() === '全聯').getAttribute('aria-pressed')`));
await setField('#p-price', '0'); await click('button[type=submit]'); await sleep(700);
console.log('8 總價 0 送出 → 總價下方:', await txt('#p-price-error'), '| 畫面上有「此欄位為必填」:', await js(`document.body.textContent.includes('此欄位為必填')`));
await setField('#p-price', '189');
console.log('9 總價 189 → 計算區:', await preview());
await shot('pnewp-2-filled');

await click('button[type=submit]'); await sleep(1800);
console.log('10 儲存 → 網址:', await js('location.pathname'), '| 提示:', await toast());
console.log('   對話框:', await txt('.remain-dialog h2'), '|', await txt('.remain-dialog__desc'), '| 帶入:', await val('#remain-dialog-input'), await txt('.remain__unit'), '| 焦點:', await js('document.activeElement.id'));
await shot('pnewp-3-remaining-dialog');
await key('a', 'KeyA', 65, { commands: ['selectAll'] }); await typeText('5');
await clickText('.remain-dialog button', '更新剩餘數量'); await sleep(1200);
const updated = await api(`/collections/products/records/${tissue.id}`, null, token);
console.log('11 改成 5 按更新 → 對話框關閉:', await js(`!document.querySelector('.remain-dialog')`), '| 提示:', await toast(), '| 資料庫:', updated.remaining_quantity, updated.remaining_updated_at);
console.log('12 列表第一筆:', await js(`(() => { const r = document.querySelector('.list__row'); return r.querySelector('.row__name').textContent.trim() + '｜' + r.querySelector('.row__when').textContent.trim() + '｜' + r.querySelector('.row__amount').textContent.trim() + '｜' + r.querySelector('.row__total').textContent.trim(); })()`));
const saved = (await api(`/collections/purchase_records/records?filter=${encodeURIComponent(`product="${tissue.id}"`)}`, null, token)).items[0];
const values = (await api(`/collections/purchase_record_field_values/records?filter=${encodeURIComponent(`purchase_record="${saved.id}"`)}`, null, token)).items.map((v) => v.field_value).sort();
console.log('    資料庫記錄:', JSON.stringify({ quantity: saved.quantity, unit_price: saved.unit_price, store: saved.store, total_price: saved.total_price, 欄位值: values }));

// 沒有包裝規格的分類：直接輸入數量（選填）
await click('a.add-link'); await sleep(1500);
await chooseProduct('Y');
console.log('13 選「Yolo 散裝綠豆」（沒有自訂欄位）→ 卡片:', await txt('.cf h2'), '| 欄位:', JSON.stringify(await js(`[...document.querySelectorAll('.cf label')].map(l => l.textContent.trim())`)), '| 說明:', await txt('.qty-hint'));
await click('#p-store'); await typeText('市場'); await click('#p-price'); await typeText('120');
console.log('14 不填數量 → 計算區:', await preview());
await shot('pnewp-4-direct-qty');
await click('button[type=submit]'); await sleep(1800);
console.log('15 儲存 → 對話框帶入（未設定 → 空白）:', JSON.stringify(await val('#remain-dialog-input')), '| 說明:', await txt('#remain-dialog-hint'));
await clickText('.remain-dialog button', '先不用'); await sleep(900);
const beanAfter = await api(`/collections/products/records/${bean.id}`, null, token);
console.log('16 按「先不用」→ 對話框關閉:', await js(`!document.querySelector('.remain-dialog')`), '| 剩餘數量沒變（未設定）:', JSON.stringify(beanAfter.remaining_updated_at));

await send('Page.navigate', { url: base + '/purchases/new' }); await sleep(1800);
console.log('17 版面:', JSON.stringify(await js(`({ 沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth, 數字鍵盤: ['#p-price'].map(s => document.querySelector(s).inputMode).join(), 輸入框字級: getComputedStyle(document.querySelector('#p-store')).fontSize })`)));
sock.close(); chrome.kill();
