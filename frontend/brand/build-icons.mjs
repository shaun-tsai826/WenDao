// 溫叨@Pantry 圖示產生器（Logo A：台北市門牌 5888）
//
// 用法（在 frontend/ 底下）：node brand/build-icons.mjs
//
// 唯一來源是 brand/digits.json（由 extract-digits.py 從 Barlow Condensed 取出的數字外框），產生：
//   1. brand/svg/*.svg            各用途的 SVG 原始檔
//   2. src/components/brandPaths.ts  BrandLogo.vue 用的路徑（數字不依賴字型）
//   3. public/icons/*.png、public/favicon.ico、public/icons/safari-pinned-tab.svg
//      PNG 由無頭 Chrome 把 SVG 畫出來（與 e2e 用同一個 Chrome）
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND = join(dirname(fileURLToPath(import.meta.url)), '..');
const digits = JSON.parse(readFileSync(join(FRONTEND, 'brand/digits.json'), 'utf8'));

const BLUE = '#1d5fd6'; // App 主色（--accent），白字對比 5.6:1
const WHITE = '#ffffff';

// ---- 1. SVG 原始檔 ----
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;

/** App 圖示裡的門牌（viewBox 100×100）；scale < 1 時以中心縮小（maskable 安全範圍） */
const iconPlate = (scale = 1, color = WHITE) =>
  `<g transform="translate(50 50) scale(${scale}) translate(-50 -50)">` +
  `<rect x="10" y="22" width="80" height="56" rx="8" fill="none" stroke="${color}" stroke-width="3"/>` +
  `<path d="${digits.icon}" fill="${color}"/></g>`;

const SVGS = {
  // 門牌本體（登入頁、大圖），viewBox 140×96
  logo: svg(
    140,
    96,
    `<rect width="140" height="96" rx="14" fill="${BLUE}"/>` +
      `<rect x="6" y="6" width="128" height="84" rx="9" fill="none" stroke="${WHITE}" stroke-width="3"/>` +
      `<path d="${digits.plate}" fill="${WHITE}"/>`,
  ),
  // 頂欄小尺寸：框線加粗、數字放大
  'logo-header': svg(
    140,
    96,
    `<rect width="140" height="96" rx="16" fill="${BLUE}"/>` +
      `<rect x="7" y="7" width="126" height="82" rx="10" fill="none" stroke="${WHITE}" stroke-width="5"/>` +
      `<path d="${digits.header}" fill="${WHITE}"/>`,
  ),
  // PWA 一般圖示：圓角方形
  'app-icon': svg(
    100,
    100,
    `<rect width="100" height="100" rx="22" fill="${BLUE}"/>` + iconPlate(),
  ),
  // iOS：系統自己會裁圓角，圖片要滿版、不能透明
  'app-icon-ios': svg(100, 100, `<rect width="100" height="100" fill="${BLUE}"/>` + iconPlate()),
  // Android maskable：系統裁成圓形等形狀，內容要在中央 80% 的圓內 → 門牌縮成 0.78 倍
  'app-icon-maskable': svg(
    100,
    100,
    `<rect width="100" height="100" fill="${BLUE}"/>` + iconPlate(0.78),
  ),
  // 單色圖示：系統只看不透明的部分再自己上色 → 透明底、只有門牌線條與數字
  'app-icon-monochrome': svg(100, 100, iconPlate(0.78, '#000000')),
  // 瀏覽器分頁：尺寸太小，拿掉框線、數字盡量大
  favicon: svg(
    100,
    100,
    `<rect width="100" height="100" rx="18" fill="${BLUE}"/><path d="${digits.favicon}" fill="${WHITE}"/>`,
  ),
  // Safari 釘選分頁：只能有一種顏色（黑），數字用遮罩挖空
  'safari-pinned-tab': svg(
    100,
    100,
    `<mask id="m"><rect width="100" height="100" fill="#fff"/><path d="${digits.favicon}" fill="#000"/></mask>` +
      `<rect width="100" height="100" rx="18" fill="#000" mask="url(#m)"/>`,
  ),
};

mkdirSync(join(FRONTEND, 'brand/svg'), { recursive: true });
for (const [name, text] of Object.entries(SVGS))
  writeFileSync(join(FRONTEND, `brand/svg/${name}.svg`), text);
writeFileSync(join(FRONTEND, 'public/icons/safari-pinned-tab.svg'), SVGS['safari-pinned-tab']);

// ---- 2. BrandLogo.vue 用的路徑 ----
writeFileSync(
  join(FRONTEND, 'src/components/brandPaths.ts'),
  `// 由 brand/build-icons.mjs 產生，請勿手動修改（來源：brand/digits.json）\n` +
    `// Logo A：台北市門牌 5888，數字是 Barlow Condensed SemiBold 的外框（SIL OFL 1.1）\n\n` +
    `/** 門牌（登入頁等大尺寸），viewBox 0 0 140 96 */\n` +
    `export const PLATE_DIGITS = '${digits.plate}';\n\n` +
    `/** 頂欄小尺寸，viewBox 0 0 140 96 */\n` +
    `export const HEADER_DIGITS = '${digits.header}';\n`,
);

// ---- 3. 用無頭 Chrome 畫出 PNG ----
const PNGS = [
  ['app-icon', 'icons/icon-128x128.png', 128],
  ['app-icon', 'icons/icon-192x192.png', 192],
  ['app-icon', 'icons/icon-256x256.png', 256],
  ['app-icon', 'icons/icon-384x384.png', 384],
  ['app-icon', 'icons/icon-512x512.png', 512],
  ['app-icon-maskable', 'icons/icon-maskable-512x512.png', 512],
  ['app-icon-monochrome', 'icons/icon-monochrome-512x512.png', 512],
  ['app-icon-ios', 'icons/apple-icon-120x120.png', 120],
  ['app-icon-ios', 'icons/apple-icon-152x152.png', 152],
  ['app-icon-ios', 'icons/apple-icon-167x167.png', 167],
  ['app-icon-ios', 'icons/apple-icon-180x180.png', 180],
  ['favicon', 'icons/favicon-16x16.png', 16],
  ['favicon', 'icons/favicon-32x32.png', 32],
  ['favicon', 'icons/favicon-96x96.png', 96],
  ['favicon', 'icons/favicon-128x128.png', 128],
  ['favicon', null, 48], // 只放進 favicon.ico
];

const PORT = 9350;
const chrome = spawn(
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'chr-'))}`,
    '--no-first-run',
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 40 && !ws; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    ws = list.find((x) => x.type === 'page')?.webSocketDebuggerUrl;
  } catch {}
  if (!ws) await sleep(250);
}
const sock = new WebSocket(ws);
await new Promise((r) => (sock.onopen = r));
let id = 0;
const pending = new Map();
sock.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) {
    pending.get(d.id)(d);
    pending.delete(d.id);
  }
};
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    sock.send(JSON.stringify({ id: i, method, params }));
  });

await send('Page.enable');
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }); // 透明背景

const icoParts = [];
for (const [name, out, size] of PNGS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: size,
    height: size,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const html = `<!doctype html><html><body style="margin:0;background:transparent">${SVGS[name].replace('<svg ', `<svg style="display:block;width:${size}px;height:${size}px" `)}</body></html>`;
  await send('Page.navigate', {
    url: `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
  });
  await sleep(150);
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
  });
  const png = Buffer.from(shot.result.data, 'base64');
  if (out) writeFileSync(join(FRONTEND, 'public', out), png);
  if (name === 'favicon' && [16, 32, 48].includes(size)) icoParts.push([size, png]);
  console.log(`✓ ${out ?? `favicon.ico 的 ${size}px`}`);
}
sock.close();
chrome.kill();

// favicon.ico：把 16 / 32 / 48 px 的 PNG 打包（ICO 檔可以直接放 PNG）
icoParts.sort((a, b) => a[0] - b[0]);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // 保留
header.writeUInt16LE(1, 2); // 1 = 圖示
header.writeUInt16LE(icoParts.length, 4);
let offset = 6 + 16 * icoParts.length;
const entries = icoParts.map(([size, png]) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size, 0);
  e.writeUInt8(size, 1);
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // 每像素位元數
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  return e;
});
writeFileSync(
  join(FRONTEND, 'public/favicon.ico'),
  Buffer.concat([header, ...entries, ...icoParts.map(([, png]) => png)]),
);
console.log('✓ favicon.ico（16、32、48 px）');

// 產生的檔案也要符合專案排版（npm run lint:check 會檢查）
execFileSync('npx', ['prettier', '--write', 'brand/digits.json', 'src/components/brandPaths.ts'], {
  cwd: FRONTEND,
  stdio: 'ignore',
});
console.log('✓ prettier 排版');
