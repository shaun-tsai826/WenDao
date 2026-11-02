// 用真正的滑鼠與鍵盤操作自訂欄位面板（重現使用者的操作方式）
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [,, base, outDir, w = '390', h = '844'] = process.argv;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9338', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9338/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
let id = 0; const pending = new Map();
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
async function clickAt(x, y) { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); await sleep(500); }
async function click(sel) { const p = await js(`(() => { const r = document.querySelector('${sel}')?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function clickText(sel, text) { const p = await js(`(() => { const el = [...document.querySelectorAll('${sel}')].find(e => e.textContent.includes(${JSON.stringify(text)})); const r = el?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; })()`); if (!p) return false; await clickAt(p[0], p[1]); return true; }
async function typeText(t) { await send('Input.insertText', { text: t }); await sleep(200); }
async function selectAll() { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, commands: ['selectAll'] }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA' }); }
const open = () => js(`!!document.querySelector('.sheet')`);
const names = () => js(`[...document.querySelectorAll('.fields__row')].map(r => r.querySelector('.fields__name').textContent.trim() + '｜' + [...r.querySelectorAll('.chip')].map(c => c.textContent.trim()).join('/'))`);
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 2, mobile: +w < 600 });
await send('Page.navigate', { url: base + '/login' }); await sleep(2500);
await click('#login-email'); await typeText('alice@family.home'); await click('#login-password'); await typeText('correct-password1'); await click('button[type=submit]'); await sleep(2000);
await send('Page.navigate', { url: base + '/categories' }); await sleep(1500);
await clickText('.list__row', '衛生紙'); await sleep(1200);
console.log(`畫面 ${w}x${h}`);
await click('.fields__add'); console.log('1 點新增欄位 → 面板開啟:', await open());
await click('#field-name'); console.log('2 點名稱輸入框 → 面板仍開啟:', await open(), '| 焦點:', await js('document.activeElement.id'));
await typeText('捲數'); console.log('3 打字 → 輸入框內容:', await js(`document.querySelector('#field-name').value`));
await clickText('.choice__item', '文字'); await clickText('.choice__item', '只記錄'); console.log('4 點選文字、只記錄 → 面板仍開啟:', await open(), '| 選擇:', await js(`[...document.querySelectorAll('.sheet input:checked')].map(i => i.value).join(',')`));
await click('.sheet__title'); console.log('5 點面板空白處 → 面板仍開啟:', await open());
await shot('real-1-filled');
await click('.sheet__save'); await sleep(800); console.log('6 按儲存 → 面板關閉:', !(await open()), '| 清單:', JSON.stringify(await names()));
await clickText('.fields__open', '層數'); await click('#field-name'); await selectAll(); await typeText('厚度'); await click('.sheet__save'); await sleep(800);
console.log('7 改名層數→厚度:', JSON.stringify(await names()));
await clickText('.fields__open', '抽數'); await click('.sheet [role=note]'); await click('.sheet__title');
console.log('8 已使用欄位：點說明與標題 → 面板仍開啟:', await open(), '| 型別鎖定:', await js(`[...document.querySelectorAll('.sheet fieldset')].every(f => f.disabled)`));
await clickAt(+w / 2, 40); await sleep(600); console.log('9 點面板外的背景 → 面板關閉:', !(await open()));
sock.close(); chrome.kill();
