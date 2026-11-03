// 首頁 / 儀表板（task 9.1，REQ-7 / AC-7.4、7.5、7.6）
// 設計：設計稿 Dash、Dash-Clear、Dash-First（使用者 2026-11-03 確認，選 A）；design.md v4.3「首頁（儀表板）」
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import Dashboard from '@/pages/Dashboard.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { ERR, STATUS } from '@/constants/messages';
import type { ProductRecord } from '@/types/models';

const routes = [
  { path: '/', component: Dashboard },
  { path: '/products', component: stubPage('products-page') },
  { path: '/products/new', component: stubPage('product-new-page') },
  { path: '/products/:id', component: stubPage('product-page') },
  { path: '/purchases/new', component: stubPage('purchase-new-page') },
  { path: '/categories', component: stubPage('categories-page') },
];

/** 每月用 30 → 一天 1 個；更新日 11/1，剩幾個就從 11/1 再幾天用完 */
function product(
  id: string,
  brand: string,
  name: string,
  over: Partial<ProductRecord> = {},
): Partial<ProductRecord> {
  return {
    id,
    category: 'c-tissue',
    brand,
    name,
    unit: '個',
    consumption_unit: '包',
    consumption_rate: 30,
    consumption_period: 'monthly',
    remaining_quantity: 0,
    remaining_updated_at: '2026-11-01 00:00:00.000Z',
    consumption_note: '',
    ...over,
  };
}

// 設計稿 Dash 的例子（今天 11/3）
const LAUNDRY = product('p-laundry', '白蘭', '洗衣精補充包', {
  category: 'c-clean',
  remaining_quantity: 0.5,
  remaining_updated_at: '2026-10-24 00:00:00.000Z',
}); // 10/25 已耗盡
const EGG = product('p-egg', '大成', '雞蛋', {
  category: 'c-food',
  consumption_unit: '顆',
  remaining_quantity: 3,
}); // 11/4 即將耗盡
const TISSUE = product('p-tissue', '春風', '抽取式衛生紙', { remaining_quantity: 7 }); // 11/8
const PASTE = product('p-paste', '黑人', '牙膏', { remaining_quantity: 11 }); // 11/12 正常
const DISH = product('p-dish', '泡舒', '洗碗精', { remaining_quantity: 18 }); // 11/19 正常
const SPONGE = product('p-sponge', '3M', '菜瓜布', { consumption_rate: 0, consumption_period: '' });

const seed = (products: Partial<ProductRecord>[]) =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-clean', name: '清潔用品' },
      { id: 'c-food', name: '食品' },
    ],
    products: products as never,
  });

type Page = Awaited<ReturnType<typeof mountPage>>;
const text = (page: Page, sel: string) => page.wrapper.find(sel).text();
const texts = (page: Page, sel: string) => page.wrapper.findAll(sel).map((n) => n.text());

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 3, 9, 0)); // 本地 2026-11-03（二）
});
afterEach(() => vi.useRealTimers());

describe('有需要補貨的商品（設計稿 Dash，AC-7.6）', () => {
  const ALL = [DISH, SPONGE, TISSUE, PASTE, LAUNDRY, EGG];

  it('標題「補貨提醒」、日期與追蹤數、「記一筆」到新增購買記錄', async () => {
    seed(ALL);
    const page = await mountPage('/', routes);
    expect(text(page, 'h1')).toBe('補貨提醒');
    expect(text(page, '.page__meta')).toBe('11/3（二）· 追蹤中 5 項');
    const add = page.wrapper.find('a.add-link');
    expect(add.text()).toBe('記一筆');
    expect(add.attributes('href')).toBe('/purchases/new');
  });

  it('兩格摘要：已耗盡 1 項、即將耗盡（7 天內）2 項', async () => {
    seed(ALL);
    const page = await mountPage('/', routes);
    expect(texts(page, '.summary__label')).toEqual(['已耗盡', '即將耗盡（7 天內）']);
    expect(texts(page, '.summary__value')).toEqual(['1 項', '2 項']);
    expect(page.wrapper.findAll('.summary__item--zero')).toHaveLength(0);
  });

  it('BDD：清單列出所有已耗盡與即將耗盡，已耗盡在前、再依預計用完日（AC-7.4、7.5、7.6）', async () => {
    seed(ALL);
    const page = await mountPage('/', routes);
    const rows = page.wrapper.findAll('.reminders .list__row');
    expect(rows.map((r) => r.find('.list__name').text())).toEqual([
      '白蘭 洗衣精補充包',
      '大成 雞蛋',
      '春風 抽取式衛生紙',
    ]);
    expect(rows.map((r) => r.find('.list__sub').text())).toEqual([
      '剩 0.5 包 · 10/25 已用完',
      '剩 3 顆 · 預計 11/4（剩 1 天）',
      '剩 7 包 · 預計 11/8（剩 5 天）',
    ]);
    expect(rows.map((r) => r.find('.depletion-badge').text())).toEqual([
      STATUS.depleted,
      STATUS.soon,
      STATUS.soon,
    ]);
    expect(rows[0]!.attributes('href')).toBe('/products/p-laundry');
    expect(rows.map((r) => r.find('.tile').text())).toEqual(['清潔', '食品', '衛生']);
  });

  it('庫存正常：依預計用完日、右側「剩 N 天 · M/D」，附「全部商品」連結', async () => {
    seed(ALL);
    const page = await mountPage('/', routes);
    expect(text(page, '#normal-title')).toBe('庫存正常');
    expect(texts(page, '.normal__name')).toEqual(['黑人 牙膏', '泡舒 洗碗精']);
    expect(texts(page, '.normal__when')).toEqual(['剩 9 天 · 11/12', '剩 16 天 · 11/19']);
    expect(page.wrapper.find('.normal a.normal__all').attributes('href')).toBe('/products');
  });

  it('庫存正常最多 5 項（使用者決定）', async () => {
    seed(
      [20, 10, 30, 12, 15, 25].map((n) =>
        product(`p-${n}`, '品牌', `剩${n}`, { remaining_quantity: n }),
      ),
    );
    const page = await mountPage('/', routes);
    expect(texts(page, '.normal__name')).toEqual([
      '品牌 剩10',
      '品牌 剩12',
      '品牌 剩15',
      '品牌 剩20',
      '品牌 剩25',
    ]);
  });

  it('有需要補貨時不顯示「未設定消耗速率」提示（只在沒有需要補貨時提醒）', async () => {
    seed(ALL);
    const page = await mountPage('/', routes);
    expect(page.wrapper.find('.unset-note').exists()).toBe(false);
  });
});

describe('沒有需要補貨（設計稿 Dash-Clear）', () => {
  it('摘要寫 0 項（白底），清單位置寫說明與下一個預計用完', async () => {
    seed([DISH, PASTE, SPONGE]);
    const page = await mountPage('/', routes);
    expect(texts(page, '.summary__value')).toEqual(['0 項', '0 項']);
    expect(page.wrapper.findAll('.summary__item--zero')).toHaveLength(2);
    expect(page.wrapper.findAll('.reminders .list__row')).toHaveLength(0);
    expect(text(page, '.clear__title')).toBe('目前沒有需要補貨的商品');
    expect(text(page, '.clear__next')).toBe('下一個預計用完：黑人 牙膏，11/12（剩 9 天）');
  });

  it('有未設定消耗速率的商品 → 最下面提示，連到商品頁（使用者同意）', async () => {
    seed([
      DISH,
      SPONGE,
      product('p-x', '舒潔', '面紙', { consumption_rate: 0, consumption_period: '' }),
    ]);
    const page = await mountPage('/', routes);
    expect(text(page, '.unset-note')).toBe(
      '另有 2 項商品還沒設定消耗速率，設定後才會出現在這裡。到商品頁設定',
    );
    expect(page.wrapper.find('.unset-note a').attributes('href')).toBe('/products');
  });

  it('全部商品都設定好了 → 不顯示提示', async () => {
    seed([DISH, PASTE]);
    const page = await mountPage('/', routes);
    expect(page.wrapper.find('.unset-note').exists()).toBe(false);
  });

  it('只有未設定速率的商品 → 追蹤中 0 項、沒有「下一個」、不顯示庫存正常', async () => {
    seed([SPONGE]);
    const page = await mountPage('/', routes);
    expect(text(page, '.page__meta')).toBe('11/3（二）· 追蹤中 0 項');
    expect(page.wrapper.find('.clear__next').exists()).toBe(false);
    expect(page.wrapper.find('.normal').exists()).toBe(false);
    expect(text(page, '.unset-note')).toContain('另有 1 項商品');
  });
});

describe('還沒有商品（設計稿 Dash-First）', () => {
  it('引導新增商品；不顯示「記一筆」與摘要', async () => {
    seed([]);
    const page = await mountPage('/', routes);
    expect(text(page, 'h1')).toBe('補貨提醒');
    expect(text(page, '.page__meta')).toBe('11/3（二）');
    expect(text(page, '#first-title')).toBe('還沒有任何商品');
    const add = page.wrapper.find('a.first__add');
    expect(add.text()).toBe('新增商品');
    expect(add.attributes('href')).toBe('/products/new');
    expect(page.wrapper.find('a.first__categories').attributes('href')).toBe('/categories');
    expect(page.wrapper.find('a.add-link').exists()).toBe(false);
    expect(page.wrapper.find('.summary').exists()).toBe(false);
  });
});

describe('載入失敗', () => {
  it('連不上伺服器 → ERR-014 與重新載入，重試成功後顯示提醒', async () => {
    const fake = seed([LAUNDRY]);
    fake.failNext(0, { collection: 'products' });
    const page = await mountPage('/', routes);
    expect(text(page, '[role=alert]')).toContain(ERR.networkError);
    expect(page.wrapper.find('.summary').exists()).toBe(false);

    await page.wrapper.find('[role=alert] button').trigger('click');
    await flushPromises();
    expect(page.wrapper.find('[role=alert]').exists()).toBe(false);
    expect(texts(page, '.reminders .list__name')).toEqual(['白蘭 洗衣精補充包']);
  });
});
