// App 名稱（品牌更名：家庭ERP → 溫叨Pantry，2026-11-03 使用者決定）
// 畫面上的名稱來自 constants/app.ts；設定檔（package.json、PWA manifest）不能 import，
// 所以用這個測試確認它們和常數一致，以後改名不會漏改。
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { APP_NAME, APP_NAME_ASCII } from '@/constants/app';

const readJson = (rel: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')) as Record<
    string,
    unknown
  >;

describe('App 名稱', () => {
  it('中文名稱「溫叨Pantry」；不能用中文的地方用「WenDaoPantry」', () => {
    expect(APP_NAME).toBe('溫叨Pantry');
    expect(APP_NAME_ASCII).toBe('WenDaoPantry');
  });

  it('package.json 的 productName（瀏覽器分頁標題）與常數一致', () => {
    expect(readJson('../../../package.json').productName).toBe(APP_NAME);
  });

  it('PWA manifest 的 name、short_name（手機桌面圖示下的名字）與常數一致', () => {
    const manifest = readJson('../../../src-pwa/manifest.json');
    expect(manifest.name).toBe(APP_NAME);
    expect(manifest.short_name).toBe(APP_NAME);
  });
});
