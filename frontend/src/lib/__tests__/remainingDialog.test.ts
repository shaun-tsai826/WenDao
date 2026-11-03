// 新增購買記錄後「是否更新此商品的剩餘數量？」對話框（task 8.4，REQ-7 / AC-7.13，CONFIRM-002）
// 設計：設計稿 Pur-Remain；用真正的 Quasar Dialog（和 feedback.test.ts 同樣的做法）
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { createApp, h } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { Quasar, Dialog, Notify } from 'quasar';
import { askUpdateRemaining, type RemainingDialogOptions } from '@/lib/feedback';
import { ValidationError } from '@/lib/errors';
import { CONFIRM, ERR } from '@/constants/messages';

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
const input = () => dialog().querySelector<HTMLInputElement>('#remain-dialog-input')!;

async function click(label: string) {
  await flushPromises();
  const button = [...dialog().querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => b.textContent?.trim() === label,
  );
  expect(button, `找不到「${label}」按鈕`).toBeDefined();
  button!.click();
  await flushPromises();
}

async function type(value: string) {
  input().value = value;
  input().dispatchEvent(new Event('input'));
  await flushPromises();
}

function open(over: Partial<RemainingDialogOptions> = {}) {
  const onSave = vi.fn<RemainingDialogOptions['onSave']>().mockResolvedValue(undefined);
  const result = askUpdateRemaining({
    productName: '春風 抽取式衛生紙',
    purchased: '剛記錄了 1,200 抽',
    remaining: 3,
    unit: '包',
    updatedAt: '2026-10-24',
    today: '2026-11-02',
    onSave,
    ...over,
  });
  return { result, onSave };
}

describe('畫面', () => {
  it('BDD：標題 CONFIRM-002，剩餘數量預先帶入目前的 3（AC-7.13）', async () => {
    const { result } = open();
    await flushPromises();
    expect(dialog().querySelector('h2')!.textContent).toBe(CONFIRM.updateRemaining);
    expect(dialog().textContent).toContain('春風 抽取式衛生紙 · 剛記錄了 1,200 抽');
    expect(input().value).toBe('3');
    expect(input().getAttribute('inputmode')).toBe('decimal');
    expect(dialog().querySelector('.remain__unit')!.textContent.trim()).toBe('包');
    expect(dialog().querySelector('#remain-dialog-hint')!.textContent).toContain(
      '已先填入目前的 3 包（10/24 更新）',
    );
    await click('先不用');
    await result;
  });

  it('BDD：尚未設定剩餘數量 → 欄位空白，說明改成「還沒設定過」', async () => {
    const { result } = open({ remaining: null, updatedAt: null });
    await flushPromises();
    expect(input().value).toBe('');
    expect(dialog().querySelector('#remain-dialog-hint')!.textContent).toContain(
      '還沒設定過剩餘數量',
    );
    await click('先不用');
    await result;
  });
});

describe('焦點', () => {
  // 回歸測試（e2e 發現）：對話框打開後焦點要在剩餘數量欄位，使用者才能直接打字
  it('對話框顯示後，焦點在剩餘數量欄位', async () => {
    const { result } = open();
    for (let i = 0; i < 50 && document.activeElement !== input(); i++) {
      await new Promise((r) => setTimeout(r, 20));
    }
    expect(document.activeElement).toBe(input());
    await click('先不用');
    await result;
  });
});

describe('操作', () => {
  it('改成 15 按「更新剩餘數量」→ 交給 onSave(15)，關閉並回傳 true', async () => {
    const { result, onSave } = open();
    await flushPromises();
    await type('15');
    await click('更新剩餘數量');
    await expect(result).resolves.toBe(true);
    expect(onSave).toHaveBeenCalledWith(15);
  });

  it('輸入時整理成數字（全形、文字）', async () => {
    const { result, onSave } = open();
    await flushPromises();
    await type('１５包');
    expect(input().value).toBe('15');
    await click('更新剩餘數量');
    await result;
    expect(onSave).toHaveBeenCalledWith(15);
  });

  it('清空後按更新 → onSave(null)（不追蹤剩餘數量）', async () => {
    const { result, onSave } = open();
    await flushPromises();
    await type('');
    await click('更新剩餘數量');
    await result;
    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('按「先不用」→ 不儲存，回傳 false', async () => {
    const { result, onSave } = open();
    await click('先不用');
    await expect(result).resolves.toBe(false);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('儲存被拒（負數 ERR-015）→ 錯誤顯示在欄位下方，對話框不關', async () => {
    const { result, onSave } = open();
    onSave.mockRejectedValueOnce(new ValidationError(ERR.remainingNegative));
    await flushPromises();
    await type('-5');
    await click('更新剩餘數量');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(
      dialog().querySelector(`#${input().getAttribute('aria-describedby')!.split(' ')[0]}`)!
        .textContent,
    ).toContain(ERR.remainingNegative);
    await type('5');
    await click('更新剩餘數量');
    await expect(result).resolves.toBe(true);
    expect(onSave).toHaveBeenLastCalledWith(5);
  });
});
