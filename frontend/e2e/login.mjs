// 真的在登入表單輸入、送出，截圖驗證（正式 build + 臨時 PocketBase）
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
const [,, base, outDir] = process.argv;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9334', '--user-data-dir=' + mkdtempSync(tmpdir() + '/chr-'), '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 40; i++) { try { const l = await (await fetch('http://127.0.0.1:9334/json/list')).json(); const p = l.find((x) => x.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await sleep(250); }
const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
let id = 0; const pending = new Map();
sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const js = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { await js('document.fonts.ready.then(()=>1)'); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
const type = (sel, v) => js(`(() => { const el = document.querySelector('${sel}'); el.focus(); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

await send('Page.navigate', { url: base + '/purchases' }); await sleep(2500);
console.log('1 未登入開 /purchases →', await js('location.pathname'));
await shot('login-1-empty');

await js(`document.querySelector('button[type=submit]').click(); true`); await sleep(300);
console.log('2 空白送出 → 欄位錯誤:', await js(`[...document.querySelectorAll('.field__error')].map(e => e.textContent.trim()).join(' / ')`));

await type('#login-email', 'alice@family.home'); await type('#login-password', 'wrong-password');
await js(`document.querySelector('button[type=submit]').click(); true`); await sleep(1500);
console.log('3 錯誤密碼 →', await js('location.pathname'), '| alert:', await js(`document.querySelector('[role=alert]')?.textContent.trim()`), '| 密碼欄:', JSON.stringify(await js(`document.querySelector('#login-password').value`)), '| 焦點:', await js('document.activeElement.id'));
await shot('login-2-error');

await type('#login-password', 'correct-password1');
await js(`document.querySelector('button[type=submit]').click(); true`); await sleep(2000);
console.log('4 正確密碼 →', await js('location.pathname'), '| 右上角:', await js(`document.querySelector('.user__name')?.textContent`), '| localStorage 有 token:', await js(`!!JSON.parse(localStorage.getItem('pocketbase_auth')||'{}').token`));
await shot('login-3-success');

await send('Page.reload'); await sleep(2500);
console.log('5 重新整理後 →', await js('location.pathname'), '| 仍登入:', await js(`document.querySelector('.user__name')?.textContent`));
await send('Page.navigate', { url: base + '/login' }); await sleep(2000);
console.log('6 已登入開 /login →', await js('location.pathname'));
sock.close(); chrome.kill();
