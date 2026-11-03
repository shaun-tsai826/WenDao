// 刪除購買記錄確認對話框（task 8.7，REQ-5 / AC-5.8，CONFIRM-001）
// 設計：設計稿 Pur-Delete；用真正的 Quasar Dialog（和 remainingDialog.test.ts 同樣的做法）
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createApp, h } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { Quasar, Dialog, Notify } from 'quasar';
import { confirmDeleteRecord } from '@/lib/feedback';
import { CONFIRM } from '@/constants/messages';

beforeAll(() => {
  document.body.innerHTML = '<div id="app"></div>';
  createApp({ render: () => h('div') })
    .use(Quasar, { plugins: { Dialog, Notify } })
    .mount('#app');
});

async function waitDialogsGone() {
  for (let i = 0; i < 50 && document.querySelector('.q-dialog'); i++) {
    await new Promise((r) => setTimeout(r, 20));
  }
}
afterEach(waitDialogsGone);

const dialog = () => [...document.querySelectorAll('.q-dialog')].at(-1)!;
const button = (label: string) =>
  [...dialog().querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => b.textContent?.trim() === label,
  );

const SUMMARY = '10/31 全聯 · 春風 抽取式衛生紙 · 599 元';

describe('confirmDeleteRecord', () => {
  it('CONFIRM-001 標題、寫出是哪一筆、提醒無法復原與歷史均價會重算（alertdialog）', async () => {
    const result = confirmDeleteRecord(SUMMARY);
    await flushPromises();
    const box = dialog().querySelector('[role=alertdialog]')!;
    expect(box).not.toBeNull();
    expect(box.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(box.getAttribute('aria-labelledby')!)!;
    expect(title.textContent?.trim()).toBe(CONFIRM.deleteRecord);
    const desc = document.getElementById(box.getAttribute('aria-describedby')!)!;
    expect(desc.textContent).toContain(SUMMARY);
    expect(desc.textContent).toContain('刪除後無法復原，商品的歷史均價會重新計算');
    button('取消')!.click();
    expect(await result).toBe(false);
  });

  it('按「刪除」→ true', async () => {
    const result = confirmDeleteRecord(SUMMARY);
    await flushPromises();
    expect(button('刪除')!.classList).toContain('btn--danger');
    button('刪除')!.click();
    expect(await result).toBe(true);
  });

  it('按「取消」→ false', async () => {
    const result = confirmDeleteRecord(SUMMARY);
    await flushPromises();
    button('取消')!.click();
    expect(await result).toBe(false);
  });

  it('按 Esc 關閉 → false（不刪除）', async () => {
    const result = confirmDeleteRecord(SUMMARY);
    await flushPromises();
    for (const type of ['keydown', 'keyup']) {
      document.dispatchEvent(
        new KeyboardEvent(type, { key: 'Escape', keyCode: 27, bubbles: true }),
      );
    }
    await flushPromises();
    expect(await result).toBe(false);
  });
});
