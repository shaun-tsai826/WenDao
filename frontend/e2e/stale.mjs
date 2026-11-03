// 剩餘數量久未更新（task 7.8，AC-7.14）：列表與詳情顯示 STATUS-008，確認數量後提醒消失
// 測試資料由本腳本用 API 建立（日期以今天推算）：
//   黑人 牙膏（正常，40 天前更新）→ 右側 STATUS-008
//   舒潔 盒裝面紙（即將耗盡，32 天前更新）→ 右側即將耗盡、第二行開頭加更新日
//   白人 牙刷（正常，剛好 30 天前更新）→ 不提醒
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
const care = cats.find((c) => c.name === '個人清潔')?.id ?? (await api('/collections/categories/records', { name: '個人清潔' }, token)).id;
const tissue = cats.find((c) => c.name === '衛生紙').id;
const pad = (n) => String(n).padStart(2, '0');
const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const at = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00.000Z`;
const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
const monthly = { consumption_rate: 1, consumption_period: 'monthly', consumption_note: '' };
const paste = await api('/collections/products/records', { category: care, brand: '黑人', name: '牙膏', unit: 'g', consumption_unit: '條', ...monthly, remaining_quantity: 3, remaining_updated_at: at(ago(40)) }, token);
await api('/collections/products/records', { category: tissue, brand: '舒潔', name: '盒裝面紙', unit: '抽', consumption_unit: '盒', ...monthly, remaining_quantity: 1.1, remaining_updated_at: at(ago(32)) }, token);
await api('/collections/products/records', { category: care, brand: '白人', name: '牙刷', unit: '支', consumption_unit: '支', ...monthly, remaining_quantity: 3, remaining_updated_at: at(ago(30)) }, token);

// ---- 2. 無頭 Chrome ----
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9348', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9348/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
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
const row = (name) => js(`(() => { const r = [...document.querySelectorAll('.list__row')].find(r => r.textContent.includes(${JSON.stringify(name)})); return r ? r.querySelector('.list__sub').textContent.trim() + '｜' + (r.querySelector('.depletion-badge')?.textContent.trim() ?? '—') : '（找不到）'; })()`);
const note = () => js(`document.querySelector('.stale-note')?.innerText.replace(/\\n/g, ' / ') ?? '（無）'`);

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
console.log(`畫面 ${w}x${h}（40 天前 ${md(ago(40))}、32 天前 ${md(ago(32))}、30 天前 ${md(ago(30))}）`);

await click('a[href="/products"]'); await sleep(1500);
console.log('1 列表：黑人 牙膏（正常、40 天）:', await row('牙膏'));
console.log('2 列表：舒潔 盒裝面紙（即將耗盡、32 天）:', await row('盒裝面紙'));
console.log('3 列表：白人 牙刷（正常、剛好 30 天）:', await row('牙刷'));
console.log('4 標籤樣式:', JSON.stringify(await js(`(() => { const b = [...document.querySelectorAll('.depletion-badge')].find(b => b.dataset.status === 'stale'); const s = getComputedStyle(b); return { 字級: s.fontSize, 底色: s.backgroundColor, 單行: b.getBoundingClientRect().height < 30, 不超出卡片: b.getBoundingClientRect().right <= document.querySelector('.list').getBoundingClientRect().right }; })()`)));
await clickText('[role=radio]', '個人清潔'); await sleep(500);
await shot('stale-1-list');

await clickText('.list__row', '牙膏'); await sleep(1500);
console.log('5 詳情：提示:', await note(), '| 剩餘數量第二行:', await js(`document.querySelector('.stat__sub').textContent.trim()`));
await shot('stale-2-detail');

await click('a.edit-link'); await sleep(1500);
await click('button[type=submit]'); await sleep(1800);
console.log('6 數字不改直接儲存 → 回到:', await js('location.pathname'), '| 提示:', await note(), '| 剩餘數量第二行:', await js(`document.querySelector('.stat__sub').textContent.trim()`));

await click('a[aria-label="返回商品"]'); await sleep(1500);
console.log('7 回列表：黑人 牙膏:', await row('牙膏'));
const saved = await api(`/collections/products/records/${paste.id}`, null, token);
console.log('8 資料庫：', saved.remaining_quantity, saved.remaining_updated_at, `（今天 ${at(new Date())}）`);
sock.close(); chrome.kill();
