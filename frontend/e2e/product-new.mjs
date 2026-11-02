// 新增商品（task 7.4）：用真正的滑鼠與鍵盤操作，走過 BDD 的成功與錯誤情境
// 測試資料由本腳本用 API 建立（Kleenex 舒潔衛生紙，用來測全形大寫重複）。
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
const { token } = await api('/collections/users/auth-with-password', { identity: 'alice@family.home', password: 'correct-password1' });
const cats = (await api('/collections/categories/records?perPage=200', null, token)).items;
const tissue = cats.find((c) => c.name === '衛生紙').id;
const existing = (await api(`/collections/products/records?perPage=200&filter=${encodeURIComponent(`category="${tissue}"`)}`, null, token)).items;
if (!existing.some((p) => p.brand === 'Kleenex' && p.name === '舒潔衛生紙')) {
  await api('/collections/products/records', { category: tissue, brand: 'Kleenex', name: '舒潔衛生紙', unit: '抽' }, token);
}
// 前一次執行留下的「平版衛生紙」會讓步驟 6 撞到重複；臨時資料庫每次都是新的，所以這裡不處理

// ---- 2. 無頭 Chrome ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9342', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9342/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
let id = 0; const pending = new Map();
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { await js('document.fonts.ready.then(()=>1)'); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
async function clickAt(x, y) { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(500); }
async function click(sel) { await js(`document.querySelector('${sel}')?.scrollIntoView({ block: 'center' })`); const p = await js(`(() => { const r = document.querySelector('${sel}')?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function clickText(sel, text) { const p = await js(`(() => { const el = [...document.querySelectorAll('${sel}')].find(e => e.textContent.trim() === ${JSON.stringify(text)}); el?.scrollIntoView({ block: 'center' }); const r = el?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function typeText(t) { await send('Input.insertText', { text: t }); await sleep(200); }
async function key(k, code, vk, commands = []) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, commands }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code }); await sleep(100); }
/** 點進欄位、全選、輸入新內容（空字串 = 清空） */
async function setField(sel, value) { await click(sel); await key('a', 'KeyA', 65, ['selectAll']); if (value) await typeText(value); else await key('Backspace', 'Backspace', 8, ['deleteBackward']); }
const alert = () => js(`document.querySelector('[role=alert]')?.innerText.replace(/\\n/g, ' / ')`);
const invalid = () => js(`[...document.querySelectorAll('[aria-invalid=true]')].map(e => e.id).join(',') || '（無）'`);
const focused = () => js('document.activeElement?.id');

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}`);

await click('a[href="/products"]'); await sleep(1500);
await clickText('[role=radio]', '衛生紙'); await sleep(500);
await click('a.add-link'); await sleep(1500);
console.log('1 從「衛生紙」篩選按新增商品:', await js('location.pathname'), '| 預選分類:', await js(`document.querySelector('#p-cat').selectedOptions[0].textContent.trim()`));
await shot('pnew-1-empty');

await click('button[type=submit]'); await sleep(800);
console.log('2 什麼都沒填就送出:', await alert(), '| 紅框:', await invalid(), '| 焦點:', await focused());

await click('#p-brand'); await typeText(' 春風 '); await click('#p-name'); await typeText('抽取式衛生紙'); await clickText('.unit-chip', '抽');
console.log('3 點常用單位「抽」→ 計價單位:', await js(`document.querySelector('#p-unit').value`), '| 按鈕狀態:', await js(`document.querySelector('.unit-chip[aria-pressed=true]')?.textContent.trim()`));
await click('button[type=submit]'); await sleep(1000);
console.log('4 「 春風 」＋抽取式衛生紙:', await alert(), '| 紅框:', await invalid());

await setField('#p-brand', 'ＫＬＥＥＮＥＸ'); await setField('#p-name', '舒潔衛生紙');
await click('button[type=submit]'); await sleep(1000);
console.log('5 「ＫＬＥＥＮＥＸ」＋舒潔衛生紙:', await alert());
await shot('pnew-2-duplicate');

await setField('#p-brand', '春風'); await setField('#p-name', '平版衛生紙'); await setField('#p-unit', '');
await click('button[type=submit]'); await sleep(1000);
console.log('6 清空計價單位:', await alert(), '| 紅框:', await invalid(), '| 焦點:', await focused());

await clickText('.unit-chip', '抽'); await click('#p-cunit'); await typeText('包');
console.log('7 選回「抽」→ 計價單位紅框拿掉:', await invalid());
await click('button[type=submit]'); await sleep(1500);
console.log('8 送出 → 提示:', await js(`document.querySelector('.q-notification')?.textContent.trim()`), '| 網址:', await js('location.pathname'));

await send('Runtime.evaluate', { expression: 'history.back()' }); await sleep(1500);
console.log('9 上一頁 → 回到列表（不是表單）:', await js('location.pathname + location.search'), '| 有平版衛生紙:', await js(`[...document.querySelectorAll('.list__name')].some(n => n.textContent.includes('平版衛生紙'))`));

await send('Page.navigate', { url: base + '/products/new' }); await sleep(1500);
console.log('10 從「全部」直接開新增頁 → 預設分類:', await js(`document.querySelector('#p-cat').selectedOptions[0].textContent.trim()`), '| 提示字顏色:', await js(`getComputedStyle(document.querySelector('#p-cat')).color`));
await click('#p-brand'); await typeText('白蘭'); await click('#p-name'); await typeText('洗衣粉'); await clickText('.unit-chip', 'g');
await click('button[type=submit]'); await sleep(1000);
console.log('11 沒選分類就送出:', await alert(), '| 紅框:', await invalid(), '| 焦點:', await focused(), '| 網址:', await js('location.pathname'));
console.log('12 版面:', JSON.stringify(await js(`({ 沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth, 輸入框字級: getComputedStyle(document.querySelector('#p-brand')).fontSize })`)));
await shot('pnew-3-no-category');
sock.close(); chrome.kill();
