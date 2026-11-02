// 更新消耗設定頁（task 7.6，REQ-7 / AC-7.1、7.8、7.9、7.10、7.11）
// 設計：設計稿 Prod-Edit（使用者 2026-11-02 確認）、design.md v3.4「商品管理」
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import ProductEdit from '@/pages/ProductEdit.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { ERR, MSG } from '@/constants/messages';
import * as feedback from '@/lib/feedback';
import type { ProductRecord } from '@/types/models';

const routes = [
  { path: '/products', component: stubPage('list-page') },
  { path: '/products/:id', component: stubPage('detail-page') },
  { path: '/products/:id/edit', component: ProductEdit },
];

function product(over: Partial<ProductRecord> = {}): Partial<ProductRecord> {
  return {
    id: 'p-spring',
    category: 'c-tissue',
    brand: '春風',
    name: '抽取式衛生紙',
    unit: '抽',
    consumption_unit: '包',
    consumption_rate: 4,
    consumption_period: 'monthly',
    remaining_quantity: 2,
    remaining_updated_at: '2026-10-24 00:00:00.000Z',
    consumption_note: '2026 年預計消耗 48 包',
    ...over,
  };
}

const seed = (p = product()) => installFakePocketBase({ products: [p as never] });

type Page = Awaited<ReturnType<typeof mountPage>>;
const value = (page: Page, sel: string) =>
  (page.wrapper.find(sel).element as HTMLInputElement | HTMLTextAreaElement).value;
const preview = (page: Page) => page.wrapper.find('.preview').text().replace(/\s+/g, ' ');
const saved = (fake: ReturnType<typeof seed>) => fake.rows('products')[0]!;

async function save(page: Page) {
  await page.wrapper.find('form').trigger('submit');
  await flushPromises();
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 2, 9, 0)); // 本地 2026-11-02（設計稿的今天）
  vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
});
afterEach(() => vi.useRealTimers());

describe('畫面與預先帶入', () => {
  it('標題、商品名稱、返回商品詳情；欄位帶入目前設定', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    expect(page.wrapper.find('h1').text()).toBe('更新消耗設定');
    expect(page.wrapper.find('.back-row__sub').text()).toBe('春風 抽取式衛生紙');
    expect(page.wrapper.find('a[aria-label="返回商品詳情"]').attributes('href')).toBe(
      '/products/p-spring',
    );
    expect(value(page, '#e-remain')).toBe('2');
    expect(page.wrapper.find('.remain__unit').text()).toBe('包');
    expect((page.wrapper.find('input[value="monthly"]').element as HTMLInputElement).checked).toBe(
      true,
    );
    expect(value(page, '#e-rate')).toBe('4');
    expect(value(page, '#e-cunit')).toBe('包');
    expect(value(page, '#e-note')).toBe('2026 年預計消耗 48 包');
    expect(page.wrapper.find('#e-remain-hint').text()).toBe(
      '儲存時記為今天（11/2）更新；上次更新 10/24。清空代表不追蹤剩餘數量',
    );
  });

  it('數字欄位用數字鍵盤（inputmode="decimal"）', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    expect(page.wrapper.find('#e-remain').attributes('inputmode')).toBe('decimal');
    expect(page.wrapper.find('#e-rate').attributes('inputmode')).toBe('decimal');
  });

  it('還沒設定過的商品：欄位空白、週期預設每月、提示不寫上次更新', async () => {
    seed(
      product({
        consumption_rate: 0,
        consumption_period: '',
        remaining_quantity: 0,
        remaining_updated_at: '',
        consumption_unit: '',
        consumption_note: '',
      }),
    );
    const page = await mountPage('/products/p-spring/edit', routes);
    expect(value(page, '#e-remain')).toBe('');
    expect(value(page, '#e-rate')).toBe('');
    expect((page.wrapper.find('input[value="monthly"]').element as HTMLInputElement).checked).toBe(
      true,
    );
    expect(page.wrapper.find('#e-remain-hint').text()).toBe(
      '儲存時記為今天（11/2）更新。清空代表不追蹤剩餘數量',
    );
  });

  it('消耗單位改了，剩餘數量後面的單位跟著變', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-cunit').setValue('串');
    expect(page.wrapper.find('.remain__unit').text()).toBe('串');
  });

  it('數字欄位輸入時整理：去掉文字、全形轉半形', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-remain').setValue('約１２．５包');
    expect(value(page, '#e-remain')).toBe('12.5');
    await page.wrapper.find('#e-rate').setValue('-3');
    expect(value(page, '#e-rate')).toBe('3'); // 速率不保留負號
  });
});

describe('即時預估用完日（design.md v3.2）', () => {
  it('設計稿：剩 2、每月用 4 → 預計 11/17 用完（剩 15 天）', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    expect(page.wrapper.find('.preview').attributes('role')).toBe('status');
    expect(page.wrapper.findAll('.preview > span').map((n) => n.text())).toEqual([
      '依這個設定',
      '預計 11/17 用完（剩 15 天）',
      '2 ÷ 4 × 30 天 = 15 天',
    ]);
  });

  it('改數字或週期時立即更新', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-remain').setValue('1');
    expect(preview(page)).toContain('預計 11/10 用完（剩 8 天）');
    await page.wrapper.find('input[value="weekly"]').setValue(true);
    expect(preview(page)).toContain('1 ÷ 4 × 7 天 ≈ 2 天');
  });

  it('缺少數字時改顯示提示', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-rate').setValue('');
    expect(preview(page)).toBe('填入「用掉」多少，就能預估用完日');
    await page.wrapper.find('#e-rate').setValue('4');
    await page.wrapper.find('#e-remain').setValue('');
    expect(preview(page)).toBe('填入現在還剩多少，就能預估用完日');
  });
});

describe('即時預估：負數', () => {
  it('剩餘數量是負數：預估區提示先修正（不重複 ERR-015 錯誤框的文字）', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-remain').setValue('-5');
    expect(preview(page)).toBe('修正剩餘數量後，就能預估用完日');
  });
});

describe('儲存（AC-7.1、7.8、7.9）', () => {
  it('BDD：今天 11/2，輸入剩餘數量 5 並儲存 → 存 5 與更新日 2026-11-02，顯示 MSG-007 並回到商品詳情', async () => {
    const fake = seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-remain').setValue('5');
    await save(page);
    expect(saved(fake)).toMatchObject({
      remaining_quantity: 5,
      remaining_updated_at: '2026-11-02 00:00:00.000Z',
    });
    expect(feedback.notifySuccess).toHaveBeenCalledWith(MSG.productUpdated);
    expect(page.router.currentRoute.value.path).toBe('/products/p-spring');
  });

  it('設定每週消耗量、消耗單位與備註（AC-7.1、7.8）', async () => {
    const fake = seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('input[value="weekly"]').setValue(true);
    await page.wrapper.find('#e-rate').setValue('0.5');
    await page.wrapper.find('#e-cunit').setValue(' 包 ');
    await page.wrapper.find('#e-note').setValue('每週消耗量約0.5包');
    await save(page);
    expect(saved(fake)).toMatchObject({
      consumption_rate: 0.5,
      consumption_period: 'weekly',
      consumption_unit: '包',
      consumption_note: '每週消耗量約0.5包',
    });
  });

  it('清空剩餘數量 → 不追蹤（數量與更新日一起清空）；清空用掉多少 → 未設定消耗速率', async () => {
    const fake = seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-remain').setValue('');
    await page.wrapper.find('#e-rate').setValue('');
    await save(page);
    expect(saved(fake)).toMatchObject({
      remaining_quantity: 0,
      remaining_updated_at: '',
      consumption_rate: 0,
      consumption_period: '',
    });
  });

  it('從商品詳情進來：儲存後回上一頁（不多一筆瀏覽紀錄）', async () => {
    seed();
    const page = await mountPage('/products/p-spring', routes);
    await page.router.push({
      path: '/products/p-spring/edit',
      state: { back: '/products/p-spring' },
    });
    await flushPromises();
    const back = vi.spyOn(page.router, 'back');
    await save(page);
    expect(back).toHaveBeenCalled();
  });

  it('直接開啟編輯頁：儲存後用 replace 進入商品詳情', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    const replace = vi.spyOn(page.router, 'replace');
    await save(page);
    expect(replace).toHaveBeenCalledWith('/products/p-spring');
  });

  it('取消：回到商品詳情，不儲存', async () => {
    const fake = seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-remain').setValue('9');
    const cancel = page.wrapper.find('a.cancel');
    expect(cancel.attributes('href')).toBe('/products/p-spring');
    await cancel.trigger('click');
    await flushPromises();
    expect(page.router.currentRoute.value.path).toBe('/products/p-spring');
    expect(saved(fake).remaining_quantity).toBe(2);
  });
});

describe('輸入錯誤（AC-7.10、7.11）', () => {
  it('BDD：剩餘數量輸入 -5 → ERR-015，標示並聚焦剩餘數量，不儲存', async () => {
    const fake = seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-remain').setValue('-5');
    await save(page);
    expect(page.wrapper.find('[role="alert"]').text()).toBe(ERR.remainingNegative);
    expect(page.wrapper.find('#e-remain').attributes('aria-invalid')).toBe('true');
    expect(document.activeElement?.id).toBe('e-remain');
    expect(saved(fake).remaining_quantity).toBe(2);
    expect(page.router.currentRoute.value.path).toBe('/products/p-spring/edit');
  });

  it('BDD：設定消耗速率 2 但未填消耗單位 → ERR-016，標示並聚焦消耗單位', async () => {
    const fake = seed(product({ consumption_unit: '' }));
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-rate').setValue('2');
    await save(page);
    expect(page.wrapper.find('[role="alert"]').text()).toBe(ERR.consumptionUnitRequired);
    expect(page.wrapper.find('#e-cunit').attributes('aria-invalid')).toBe('true');
    expect(document.activeElement?.id).toBe('e-cunit');
    expect(saved(fake).consumption_rate).toBe(4);
  });

  it('改了有問題的欄位就拿掉紅框', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-remain').setValue('-5');
    await save(page);
    await page.wrapper.find('#e-remain').setValue('5');
    expect(page.wrapper.find('#e-remain').attributes('aria-invalid')).toBeUndefined();
  });

  it('連不上伺服器 → ERR-014；可以再儲存一次', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'products', method: 'update' });
    const page = await mountPage('/products/p-spring/edit', routes);
    await page.wrapper.find('#e-remain').setValue('5');
    await save(page);
    expect(page.wrapper.find('[role="alert"]').text()).toBe(ERR.networkError);
    await save(page);
    expect(saved(fake).remaining_quantity).toBe(5);
  });

  it('儲存中按鈕停用並顯示「儲存中…」', async () => {
    seed();
    const page = await mountPage('/products/p-spring/edit', routes);
    void page.wrapper.find('form').trigger('submit');
    await page.wrapper.vm.$nextTick();
    const button = page.wrapper.find('button[type="submit"]');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.text()).toBe('儲存中…');
    await flushPromises();
  });
});

describe('載入', () => {
  it('找不到商品：顯示說明與回到商品列表的連結', async () => {
    seed();
    const page = await mountPage('/products/p-gone/edit', routes);
    expect(page.wrapper.find('form').exists()).toBe(false);
    expect(page.wrapper.find('.state').text()).toContain('找不到這個商品');
    expect(page.wrapper.find('.state a').attributes('href')).toBe('/products');
  });

  it('載入失敗：顯示 ERR-014 與重新載入', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'products', method: 'getFullList' });
    const page = await mountPage('/products/p-spring/edit', routes);
    expect(page.wrapper.find('[role="alert"]').text()).toContain(ERR.networkError);
    await page.wrapper.find('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(value(page, '#e-remain')).toBe('2');
  });
});
