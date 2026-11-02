// 操作回饋（task 6.6）：真正的 Quasar Dialog / Notify，不用替身
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createApp, h } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { Quasar, Dialog, Notify } from 'quasar';
import { confirmDelete, notifyError, notifySuccess } from '@/lib/feedback';

// Quasar 的 Notify / Dialog 只在第一次安裝時建立顯示容器，所以整個檔案只掛載一次、不清空 body
beforeAll(() => {
  document.body.innerHTML = '<div id="app"></div>';
  createApp({ render: () => h('div') })
    .use(Quasar, { plugins: { Dialog, Notify } })
    .mount('#app');
});

/** 點「最新開啟」那個對話框裡的按鈕（舊的對話框可能還在播關閉動畫） */
async function clickDialogButton(label: string) {
  await flushPromises();
  const dialogs = [...document.querySelectorAll('.q-dialog')];
  const latest = dialogs.at(-1);
  const button = [...(latest?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find(
    (b) => b.textContent?.trim() === label,
  );
  expect(button, `找不到「${label}」按鈕`).toBeDefined();
  button!.click();
  await flushPromises();
}

/** 等對話框關閉動畫結束、從畫面移除 */
async function waitDialogsGone() {
  for (let i = 0; i < 50 && document.querySelector('.q-dialog'); i++) {
    await new Promise((r) => setTimeout(r, 20));
  }
}

afterEach(waitDialogsGone);

describe('confirmDelete', () => {
  it('顯示訊息與「取消」「刪除」兩個按鈕', async () => {
    void confirmDelete('確定要刪除分類「蔬菜」嗎？');
    await flushPromises();
    expect(document.querySelector('.q-dialog')?.textContent).toContain(
      '確定要刪除分類「蔬菜」嗎？',
    );
    const labels = [...document.querySelectorAll('.q-dialog:last-of-type button')].map((b) =>
      b.textContent?.trim(),
    );
    expect(labels).toEqual(['取消', '刪除']);
    await clickDialogButton('取消'); // 關掉，避免影響下一個測試
  });

  it('按「刪除」→ true', async () => {
    const result = confirmDelete('確定要刪除欄位「層數」嗎？');
    await clickDialogButton('刪除');
    await expect(result).resolves.toBe(true);
  });

  it('按「取消」→ false', async () => {
    const result = confirmDelete('確定要刪除欄位「層數」嗎？');
    await clickDialogButton('取消');
    await expect(result).resolves.toBe(false);
  });
});

describe('notifySuccess / notifyError', () => {
  it('在畫面底部顯示訊息', async () => {
    notifySuccess('分類建立成功');
    notifyError('此分類下仍有商品，無法刪除');
    await flushPromises();
    const text = document.querySelector('.q-notifications')?.textContent ?? '';
    expect(text).toContain('分類建立成功');
    expect(text).toContain('此分類下仍有商品，無法刪除');
  });
});
