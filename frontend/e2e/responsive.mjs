// 響應式（task 12.7，使用者決定改成三種寬度）：手機 390、平板 768、桌機 1280 打開主要頁面，
// 檢查沒有橫向捲動、可點範圍至少 44px（含 .touch-target 的透明外圈）、字不小於 12px、
// 頂欄 / 內容 / 導覽列寬度為 min(畫面寬, 640)（使用者決定），並存截圖（resp-<寬>-<頁面>.png）。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { check, ok, done } from './check.mjs';
const [,, base, outDir] = process.argv;

// ---- 1. 找出要看的頁面（用前面腳本建好的資料；沒有時用種子資料） ----
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
const product = (await api('/collections/products/records?perPage=1&sort=created', null, token)).items[0];
const record = (await api('/collections/purchase_records/records?perPage=1&sort=-created', null, token)).items[0];
const category = (await api('/collections/categories/records?perPage=1&sort=created', null, token)).items[0];
const PAGES = [
  ['首頁', '/'],
  ['商品', '/products'],
  ['商品詳情', `/products/${product.id}`],
  ['更新消耗設定', `/products/${product.id}/edit`],
  ['新增商品', '/products/new'],
  ['購買記錄', '/purchases'],
  ['新增購買記錄', '/purchases/new'],
  ['購買記錄詳情', `/purchases/${record.id}`],
  ['編輯購買記錄', `/purchases/${record.id}/edit`],
  ['分類', '/categories'],
  ['編輯分類', `/categories/${category.id}/edit`],
];
const WIDTHS = [[390, 844], [768, 1024], [1280, 800]];

// ---- 2. 無頭 Chrome（繁體中文語系：日期欄位是「年/月/日」） ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--lang=zh-TW', '--remote-debugging-port=9366', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9366/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
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
/** 量測目前頁面 */
const measure = () => js(`(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const label = (e) => (e.getAttribute('aria-label') || e.textContent || e.id || e.tagName).trim().replace(/\\s+/g, ' ').slice(0, 24);
  // 可點的東西：連結、按鈕、輸入框、下拉選單（段落中的文字連結除外）
  const targets = [...document.querySelectorAll('a[href], button, input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, [role=radio]')]
    .filter(vis).filter((e) => !(e.tagName === 'A' && e.closest('p')));
  // 可點範圍：元素本身，或 .touch-target 用透明的 ::after 外圈加大的範圍（使用者決定：外觀不變、可點範圍至少 44px）
  const hit = (e) => {
    const r = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after');
    const extra = a.content !== 'none' && a.position === 'absolute';
    return { 高: Math.round(Math.max(r.height, extra ? parseFloat(a.height) : 0)), 寬: Math.round(Math.max(r.width, extra ? parseFloat(a.width) : 0)) };
  };
  const small = targets.map((e) => ({ 名稱: label(e), ...hit(e) })).filter((t) => t.高 < 44 || t.寬 < 44);
  // 字級：有直接文字內容的元素
  const tiny = [...document.querySelectorAll('body *')].filter(vis)
    .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12)
    .map((e) => label(e) + ' ' + getComputedStyle(e).fontSize);
  const width = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().width) : 0; };
  return {
    沒有橫向捲動: document.documentElement.scrollWidth <= window.innerWidth,
    太小的可點元件: small,
    小於12px的字: tiny,
    寬度: { 頂欄: width('.app-header__inner'), 內容: width('.q-page'), 導覽列: width('.app-nav__inner') },
  };
})()`);

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
const login = await measure();
check('登入頁 390：沒有橫向捲動、沒有太小的元件與字', [login.沒有橫向捲動, login.太小的可點元件, login.小於12px的字], [true, [], []]);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);

for (const [w, h] of WIDTHS) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
  for (const [name, path] of PAGES) {
    await send('Page.navigate', { url: base + path }); await sleep(1800);
    const m = await measure();
    // 內容寬度：手機撐滿，平板與桌機限制在 640px 置中（使用者決定，design.md v4.6）
    const max = Math.min(w, 640);
    check(`${w} ${name}：沒有橫向捲動、可點範圍 ≥ 44px、字 ≥ 12px、寬度 ${max}`, m, { 沒有橫向捲動: true, 太小的可點元件: [], 小於12px的字: [], 寬度: { 頂欄: max, 內容: max, 導覽列: max } });
    await shot(`resp-${w}-${path === '/' ? 'home' : path.split('/').filter(Boolean).map((p) => (p.length > 12 ? 'id' : p)).join('-')}`);
  }
}
sock.close(); chrome.kill();
done();
