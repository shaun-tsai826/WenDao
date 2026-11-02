// 商品詳情頁（task 7.5，REQ-6 / AC-6.4、AC-6.5，REQ-7 / AC-7.3，REQ-8 / AC-8.2、AC-8.4）
// 設計：設計稿 Prod-Detail（使用者 2026-11-02 確認）、design.md v3.3「商品管理」
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import ProductDetail from '@/pages/ProductDetail.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { ERR, STATUS } from '@/constants/messages';
import { personTone } from '@/lib/personTone';
import type { ProductRecord, PurchaseRecordRecord } from '@/types/models';

const routes = [
  { path: '/products', component: stubPage('list-page') },
  { path: '/products/:id', component: ProductDetail },
  { path: '/products/:id/edit', component: stubPage('edit-page') },
];

function product(over: Partial<ProductRecord> & { id: string }): Partial<ProductRecord> {
  return {
    category: 'c-tissue',
    brand: '春風',
    name: '抽取式衛生紙',
    unit: '抽',
    consumption_unit: '包',
    consumption_rate: 0,
    consumption_period: '',
    remaining_quantity: 0,
    remaining_updated_at: '',
    consumption_note: '',
    ...over,
  };
}

function purchase(
  over: Partial<PurchaseRecordRecord> & { id: string },
): Partial<PurchaseRecordRecord> {
  return {
    product: 'p-spring',
    store: '全聯',
    total_price: 599,
    quantity: 1200,
    unit_price: 0.4992,
    user: 'u-pi',
    ...over,
  };
}

// 設計稿的例子：今天 11/2，剩 2 包（10/24 更新），每月用 4 包 → 15 天 → 11/8（剩 6 天）
const SPRING = product({
  id: 'p-spring',
  consumption_rate: 4,
  consumption_period: 'monthly',
  remaining_quantity: 2,
  remaining_updated_at: '2026-10-24 00:00:00.000Z',
  consumption_note: '2026 年預計消耗 48 包',
});

const PURCHASES = [
  purchase({
    id: 'r-2',
    purchase_date: '2026-09-05 00:00:00.000Z',
    store: '蝦皮',
    total_price: 549,
    unit_price: 0.4575,
    user: 'u-bao',
  }),
  purchase({ id: 'r-1', purchase_date: '2026-10-20 00:00:00.000Z' }),
  purchase({
    id: 'r-3',
    purchase_date: '2026-07-12 00:00:00.000Z',
    store: '家樂福',
    total_price: 629,
    unit_price: 0.5242,
  }),
  purchase({
    id: 'r-other',
    product: 'p-kleenex',
    purchase_date: '2026-10-30 00:00:00.000Z',
    store: '好市多',
    unit_price: 0.1,
  }),
];

const seed = (products = [SPRING], purchases = PURCHASES) =>
  installFakePocketBase({
    categories: [{ id: 'c-tissue', name: '衛生紙' }],
    products: products as never,
    users: [
      { id: 'u-pi', name: '老皮' },
      { id: 'u-bao', name: '阿寶' },
    ],
    purchase_records: purchases as never,
  });

type Page = Awaited<ReturnType<typeof mountPage>>;
const text = (page: Page, sel: string) => page.wrapper.find(sel).text();
const texts = (page: Page, sel: string) => page.wrapper.findAll(sel).map((n) => n.text());

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 2, 9, 0)); // 本地 2026-11-02
});
afterEach(() => vi.useRealTimers());

describe('商品資訊', () => {
  it('標題、品牌品名、分類與單位說明、狀態標籤', async () => {
    seed();
    const page = await mountPage('/products/p-spring', routes);
    expect(text(page, 'h1')).toBe('商品詳情');
    expect(text(page, 'h2.product__name')).toBe('春風 抽取式衛生紙');
    expect(text(page, '.product__meta')).toBe('衛生紙 · 以「抽」計價 · 以「包」計算消耗');
    expect(text(page, '.tile')).toBe('衛生');
    expect(text(page, '.depletion-badge')).toBe(STATUS.soon);
  });

  it('三個資訊塊：剩餘數量、預計用完、歷史均價（設計稿數字）', async () => {
    seed();
    const page = await mountPage('/products/p-spring', routes);
    expect(texts(page, '.stat__label')).toEqual(['剩餘數量', '預計用完', '歷史均價（3 筆）']);
    expect(texts(page, '.stat__value')).toEqual(['2 包', '11/8', '0.4936 元/抽']);
    expect(texts(page, '.stat__sub')).toEqual(['10/24 更新', '剩 6 天 · 每月用 4 包']);
  });

  it('備註與「更新剩餘數量與消耗設定」入口', async () => {
    seed();
    const page = await mountPage('/products/p-spring', routes);
    expect(text(page, '.product__note')).toBe('備註：2026 年預計消耗 48 包');
    const edit = page.wrapper.find('a.edit-link');
    expect(edit.text()).toBe('更新剩餘數量與消耗設定');
    expect(edit.attributes('href')).toBe('/products/p-spring/edit');
  });

  it('沒有消耗單位、沒有備註時不顯示那一段', async () => {
    seed([product({ id: 'p-spring', consumption_unit: '' })], []);
    const page = await mountPage('/products/p-spring', routes);
    expect(text(page, '.product__meta')).toBe('衛生紙 · 以「抽」計價');
    expect(page.wrapper.find('.product__note').exists()).toBe(false);
  });

  it('未設定消耗速率（AC-7.7）：剩餘數量與預計用完顯示未設定，不計算日期', async () => {
    seed([product({ id: 'p-spring' })], []);
    const page = await mountPage('/products/p-spring', routes);
    expect(text(page, '.depletion-badge')).toBe(STATUS.rateNotSet);
    expect(texts(page, '.stat__value').slice(0, 2)).toEqual(['未設定', '—']);
    expect(texts(page, '.stat__sub')).toEqual(['', STATUS.rateNotSet].filter(Boolean));
  });

  it('已設定速率但未設定剩餘數量（AC-7.12）', async () => {
    seed([product({ id: 'p-spring', consumption_rate: 4, consumption_period: 'weekly' })], []);
    const page = await mountPage('/products/p-spring', routes);
    expect(texts(page, '.stat__value').slice(0, 2)).toEqual(['未設定', '—']);
    expect(texts(page, '.stat__sub')).toEqual([STATUS.remainingNotSet + ' · 每週用 4 包']);
  });

  it('已耗盡：寫出已過幾天；今天用完寫「今天」', async () => {
    seed(
      [
        product({
          id: 'p-spring',
          consumption_rate: 2,
          consumption_period: 'monthly',
          remaining_quantity: 0.5,
          remaining_updated_at: '2026-10-01 00:00:00.000Z',
        }),
      ],
      [],
    );
    let page = await mountPage('/products/p-spring', routes);
    expect(texts(page, '.stat__value').slice(0, 2)).toEqual(['0.5 包', '10/9']);
    expect(texts(page, '.stat__sub')).toEqual(['10/1 更新', '已過 24 天 · 每月用 2 包']);

    document.body.innerHTML = '';
    seed(
      [
        product({
          id: 'p-spring',
          consumption_rate: 1,
          consumption_period: 'monthly',
          remaining_quantity: 1,
          remaining_updated_at: '2026-10-03 00:00:00.000Z',
        }),
      ],
      [],
    );
    page = await mountPage('/products/p-spring', routes);
    expect(texts(page, '.stat__sub')[1]).toBe('今天用完 · 每月用 1 包');
  });
});

describe('歷史均價（AC-6.4、6.5、8.4）', () => {
  it('BDD：2 筆單位均價 0.4992 與 0.5008 → 0.5000', async () => {
    seed(
      [SPRING],
      [
        purchase({ id: 'a', purchase_date: '2026-10-01 00:00:00.000Z' }),
        purchase({ id: 'b', purchase_date: '2026-10-02 00:00:00.000Z', unit_price: 0.5008 }),
      ],
    );
    const page = await mountPage('/products/p-spring', routes);
    expect(texts(page, '.stat__label')[2]).toBe('歷史均價（2 筆）');
    expect(texts(page, '.stat__value')[2]).toBe('0.5000 元/抽');
  });

  it('數量缺失的記錄不算進均價；全部缺失 → 無法計算（STATUS-001）', async () => {
    seed(
      [SPRING],
      [
        purchase({
          id: 'a',
          purchase_date: '2026-10-01 00:00:00.000Z',
          quantity: 0,
          unit_price: 0,
        }),
      ],
    );
    const page = await mountPage('/products/p-spring', routes);
    expect(texts(page, '.stat__label')[2]).toBe('歷史均價');
    expect(texts(page, '.stat__value')[2]).toBe(STATUS.cannotCalculate);
  });

  it('還沒有購買記錄：歷史均價顯示「—」', async () => {
    seed([SPRING], []);
    const page = await mountPage('/products/p-spring', routes);
    expect(texts(page, '.stat__value')[2]).toBe('—');
  });
});

describe('購買記錄（AC-8.2）', () => {
  it('BDD：只顯示這個商品的記錄，依購入日期由新至舊', async () => {
    seed();
    const page = await mountPage('/products/p-spring', routes);
    expect(text(page, '.purchases h2')).toBe('購買記錄（新到舊）');
    expect(texts(page, '.purchase__when')).toEqual(['10/20 · 全聯', '9/5 · 蝦皮', '7/12 · 家樂福']);
    expect(texts(page, '.purchase__detail')).toEqual([
      '1,200 抽 · 0.4992 元/抽',
      '1,200 抽 · 0.4575 元/抽',
      '1,200 抽 · 0.5242 元/抽',
    ]);
    expect(texts(page, '.purchase__total')).toEqual(['599 元', '549 元', '629 元']);
  });

  it('每筆附新增者頭像：名稱最後一個字、依使用者順序配色、可讀出名稱', async () => {
    seed();
    const page = await mountPage('/products/p-spring', routes);
    const avatars = page.wrapper.findAll('.avatar');
    expect(avatars.map((a) => a.text())).toEqual(['皮', '寶', '皮']);
    expect(avatars.map((a) => a.attributes('title'))).toEqual(['老皮', '阿寶', '老皮']);
    expect(avatars[1]!.attributes('aria-label')).toBe('新增者：阿寶');
    expect(avatars[1]!.attributes('style')).toContain(hexToRgb(personTone(1).bg));
  });

  it('數量缺失：寫「數量未填 · 無法計算」；去年的記錄加上年份', async () => {
    seed(
      [SPRING],
      [
        purchase({
          id: 'a',
          purchase_date: '2025-12-30 00:00:00.000Z',
          quantity: 0,
          unit_price: 0,
          total_price: 1200,
        }),
      ],
    );
    const page = await mountPage('/products/p-spring', routes);
    expect(texts(page, '.purchase__when')).toEqual(['2025/12/30 · 全聯']);
    expect(texts(page, '.purchase__detail')).toEqual([`數量未填 · ${STATUS.cannotCalculate}`]);
    expect(texts(page, '.purchase__total')).toEqual(['1,200 元']);
  });

  it('沒有購買記錄：顯示提示', async () => {
    seed([SPRING], []);
    const page = await mountPage('/products/p-spring', routes);
    expect(text(page, '.purchases .state')).toBe('還沒有購買記錄');
  });
});

describe('返回與錯誤', () => {
  it('返回箭頭：預設回商品列表；從篩選過的列表進來時回到同一個篩選', async () => {
    seed();
    let page = await mountPage('/products/p-spring', routes);
    expect(page.wrapper.find('a[aria-label="返回商品"]').attributes('href')).toBe('/products');

    document.body.innerHTML = '';
    seed();
    page = await mountPage('/products?category=c-tissue', routes);
    // 正式環境的 web history 會自動在 state.back 記下上一頁；測試用的 memory history 不會，所以手動帶入
    await page.router.push({
      path: '/products/p-spring',
      state: { back: '/products?category=c-tissue' },
    });
    await flushPromises();
    expect(page.wrapper.find('a[aria-label="返回商品"]').attributes('href')).toBe(
      '/products?category=c-tissue',
    );
  });

  it('找不到商品：顯示說明與回到商品列表的連結', async () => {
    seed();
    const page = await mountPage('/products/p-gone', routes);
    expect(text(page, '.state')).toContain('找不到這個商品');
    expect(page.wrapper.find('.state a').attributes('href')).toBe('/products');
  });

  it('載入失敗：顯示 ERR-014 與重新載入，重試成功後顯示內容', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'purchase_records', method: 'getFullList' });
    const page = await mountPage('/products/p-spring', routes);
    expect(text(page, '[role="alert"]')).toContain(ERR.networkError);
    await page.wrapper.find('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(text(page, 'h2.product__name')).toBe('春風 抽取式衛生紙');
    expect(page.wrapper.findAll('.purchase')).toHaveLength(3);
  });
});

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
