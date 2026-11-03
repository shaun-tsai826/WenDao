// 編輯購買記錄（task 8.6，REQ-5 / AC-5.7，REQ-6 / AC-6.1）
// 設計：design.md v4.0「購買記錄 › 編輯購買記錄」：沿用新增頁表單，標題改「編輯購買記錄」、預先帶入原本的值
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import PurchaseEdit from '@/pages/PurchaseEdit.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { ERR, MSG } from '@/constants/messages';
import * as feedback from '@/lib/feedback';
import pb from '@/lib/pocketbase';

const routes = [
  { path: '/purchases', component: stubPage('list-page') },
  { path: '/purchases/:id', component: stubPage('detail-page') },
  { path: '/purchases/:id/edit', component: PurchaseEdit },
];

const product = (over: Record<string, unknown>) => ({
  unit: '抽',
  consumption_unit: '',
  consumption_rate: 0,
  consumption_period: '',
  remaining_quantity: 0,
  remaining_updated_at: '',
  consumption_note: '',
  ...over,
});

const record = (over: Record<string, unknown>) => ({
  product: 'p-spring',
  purchase_date: '2026-10-31 00:00:00.000Z',
  store: '全聯',
  total_price: 599,
  quantity: 1200,
  unit_price: 0.4992,
  user: 'u-bao', // 別人新增的：編輯後新增者不變（AC-5.6）
  ...over,
});

// 衛生紙：抽數 × 包數算數量、層數只記錄；蔬菜沒有自訂欄位（直接輸入數量）
const seed = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [
      product({ id: 'p-spring', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙' }),
      product({ id: 'p-cabbage', category: 'c-veg', brand: '有機', name: '高麗菜', unit: '顆' }),
    ] as never,
    custom_fields: [
      {
        id: 'f-sheets',
        category: 'c-tissue',
        field_name: '抽數(單包)',
        field_type: 'number',
        is_quantity_component: true,
        display_order: 1,
      },
      {
        id: 'f-packs',
        category: 'c-tissue',
        field_name: '包數',
        field_type: 'number',
        is_quantity_component: true,
        display_order: 2,
      },
      {
        id: 'f-ply',
        category: 'c-tissue',
        field_name: '層數',
        field_type: 'number',
        is_quantity_component: false,
        display_order: 3,
      },
    ],
    purchase_records: [
      record({ id: 'r-1' }),
      record({
        id: 'r-veg',
        product: 'p-cabbage',
        store: '市場',
        total_price: 90,
        quantity: 3,
        unit_price: 30,
      }),
      record({ id: 'r-noqty', product: 'p-cabbage', total_price: 90, quantity: 0, unit_price: 0 }),
    ] as never,
    purchase_record_field_values: [
      { id: 'v1', purchase_record: 'r-1', custom_field: 'f-sheets', field_value: '100' },
      { id: 'v2', purchase_record: 'r-1', custom_field: 'f-packs', field_value: '12' },
      { id: 'v3', purchase_record: 'r-1', custom_field: 'f-ply', field_value: '2' },
    ],
  });

type Page = Awaited<ReturnType<typeof mountPage>>;
const value = (page: Page, sel: string) =>
  (page.wrapper.find(sel).element as HTMLInputElement).value;
const text = (page: Page, sel: string) => page.wrapper.find(sel).text();

async function fill(page: Page, values: Record<string, string>) {
  for (const [sel, v] of Object.entries(values)) await page.wrapper.find(sel).setValue(v);
  await flushPromises();
}
async function submit(page: Page) {
  await page.wrapper.find('form').trigger('submit');
  await flushPromises();
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 3, 9, 0)); // 今天 2026-11-03
  pb.authStore.save('test-token', { id: 'u-pi', name: '老皮' } as never);
  vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
  vi.spyOn(feedback, 'askUpdateRemaining').mockResolvedValue(false);
});
afterEach(() => {
  vi.useRealTimers();
  pb.authStore.clear();
});

describe('畫面：預先帶入原本的值', () => {
  it('標題「編輯購買記錄」；返回與取消都回到這筆記錄的詳情', async () => {
    seed();
    const page = await mountPage('/purchases/r-1/edit', routes);
    expect(text(page, 'h1')).toBe('編輯購買記錄');
    expect(page.wrapper.find('a[aria-label="返回購買記錄詳情"]').attributes('href')).toBe(
      '/purchases/r-1',
    );
    expect(page.wrapper.find('a.cancel').attributes('href')).toBe('/purchases/r-1');
    expect(text(page, 'button[type=submit]')).toBe('儲存變更');
  });

  it('商品、購入日期、購買地點、總價、包裝規格都帶入；自動計算結果也算好', async () => {
    seed();
    const page = await mountPage('/purchases/r-1/edit', routes);
    expect(value(page, '#p-product')).toBe('p-spring');
    expect(value(page, '#p-date')).toBe('2026-10-31');
    expect(value(page, '#p-store')).toBe('全聯');
    expect(value(page, '#p-price')).toBe('599');
    expect(value(page, '#cf-f-sheets')).toBe('100');
    expect(value(page, '#cf-f-packs')).toBe('12');
    expect(value(page, '#cf-f-ply')).toBe('2');
    expect(text(page, '.preview__qty-value')).toBe('1,200 抽');
    expect(text(page, '.preview__price-value')).toBe('0.4992 元/抽');
  });

  it('沒有包裝規格的分類：帶入直接輸入的數量', async () => {
    seed();
    const page = await mountPage('/purchases/r-veg/edit', routes);
    expect(value(page, '#p-product')).toBe('p-cabbage');
    expect(value(page, '#p-qty')).toBe('3');
    expect(text(page, '.preview__price-value')).toBe('30.0000 元/顆');
  });

  it('原本沒填數量（存 0）→ 數量欄位留空，不是 0', async () => {
    seed();
    const page = await mountPage('/purchases/r-noqty/edit', routes);
    expect(value(page, '#p-qty')).toBe('');
  });
});

describe('儲存（AC-5.7、6.1）', () => {
  it('BDD：總價 599 改成 549 → 更新記錄、單位均價重算、顯示 MSG-005、回到詳情', async () => {
    const fake = seed();
    const page = await mountPage('/purchases/r-1/edit', routes);
    await fill(page, { '#p-price': '549' });
    await submit(page);

    expect(fake.rows('purchase_records').find((r) => r.id === 'r-1')).toMatchObject({
      total_price: 549,
      quantity: 1200,
      unit_price: 0.4575,
      user: 'u-bao', // 新增者不變
    });
    expect(feedback.notifySuccess).toHaveBeenCalledWith(MSG.recordUpdated);
    expect(page.router.currentRoute.value.path).toBe('/purchases/r-1');
  });

  it('改包裝規格：數量重算，欄位值同步（改了的更新、清空的刪除），不新增重複的值', async () => {
    const fake = seed();
    const page = await mountPage('/purchases/r-1/edit', routes);
    await fill(page, { '#cf-f-packs': '10', '#cf-f-ply': '' });
    await submit(page);

    expect(fake.rows('purchase_records').find((r) => r.id === 'r-1')).toMatchObject({
      quantity: 1000,
      unit_price: 0.599,
    });
    const values = fake
      .rows('purchase_record_field_values')
      .filter((v) => v.purchase_record === 'r-1')
      .map((v) => [v.custom_field, v.field_value]);
    expect(values).toEqual([
      ['f-sheets', '100'],
      ['f-packs', '10'],
    ]);
  });

  it('編輯不會跳出「是否更新剩餘數量」對話框（只有新增時才問，AC-7.13）', async () => {
    seed();
    const page = await mountPage('/purchases/r-1/edit', routes);
    await fill(page, { '#p-price': '549' });
    await submit(page);
    expect(feedback.askUpdateRemaining).not.toHaveBeenCalled();
  });

  it('總價改成 0 → 只顯示 ERR-010，不寫入（AC-5.4、5.11）', async () => {
    const fake = seed();
    const page = await mountPage('/purchases/r-1/edit', routes);
    await fill(page, { '#p-price': '0' });
    await submit(page);
    expect(text(page, '#p-price-error')).toBe(ERR.totalPriceNotPositive);
    expect(page.wrapper.text()).not.toContain(ERR.required);
    expect(fake.rows('purchase_records').find((r) => r.id === 'r-1')?.total_price).toBe(599);
    expect(page.router.currentRoute.value.path).toBe('/purchases/r-1/edit');
  });

  it('必填欄位清空（購買地點、總價）→ 各自顯示 ERR-009，不寫入（AC-5.3）', async () => {
    const fake = seed();
    const page = await mountPage('/purchases/r-1/edit', routes);
    await fill(page, { '#p-store': '  ', '#p-price': '' });
    await submit(page);
    expect(text(page, '#p-store-error')).toBe(ERR.required);
    expect(text(page, '#p-price-error')).toBe(ERR.required);
    expect(fake.rows('purchase_records').find((r) => r.id === 'r-1')).toMatchObject({
      store: '全聯',
      total_price: 599,
    });
  });

  it('購入日期改成未來 → ERR-011（AC-5.5）', async () => {
    seed();
    const page = await mountPage('/purchases/r-1/edit', routes);
    await fill(page, { '#p-date': '2026-11-15' });
    await submit(page);
    expect(text(page, '#p-date-error')).toBe(ERR.purchaseDateInFuture);
  });

  it('連不上伺服器 → 表單上方顯示 ERR-014，留在編輯頁', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'purchase_records', method: 'update' });
    const page = await mountPage('/purchases/r-1/edit', routes);
    await fill(page, { '#p-price': '549' });
    await submit(page);
    expect(text(page, '.form-alert')).toBe(ERR.networkError);
    expect(page.router.currentRoute.value.path).toBe('/purchases/r-1/edit');
    expect(feedback.notifySuccess).not.toHaveBeenCalled();
  });
});

describe('找不到、載入失敗', () => {
  it('記錄不存在（可能已被刪除）→ 說明並提供回列表的連結，不顯示表單', async () => {
    seed();
    const page = await mountPage('/purchases/r-gone/edit', routes);
    expect(text(page, '.state')).toContain('找不到這筆記錄，可能已被刪除。');
    expect(page.wrapper.find('.state a').attributes('href')).toBe('/purchases');
    expect(page.wrapper.find('form').exists()).toBe(false);
  });

  it('連不上伺服器 → ERR-014，按「重新載入」後顯示表單', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'purchase_records', method: 'getOne' });
    const page = await mountPage('/purchases/r-1/edit', routes);
    expect(text(page, '[role=alert]')).toContain(ERR.networkError);
    expect(page.wrapper.find('form').exists()).toBe(false);

    await page.wrapper.find('[role=alert] button').trigger('click');
    await flushPromises();
    expect(value(page, '#p-price')).toBe('599');
  });
});
