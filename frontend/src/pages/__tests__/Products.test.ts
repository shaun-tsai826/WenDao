// 商品列表頁（task 7.3，REQ-7 / AC-7.3、AC-7.4、AC-7.5、AC-7.7、AC-7.12）
// 設計：設計稿 Prod-List（使用者 2026-11-02 確認）、design.md v3.2「商品管理」
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import Products from '@/pages/Products.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { ERR, STATUS } from '@/constants/messages';
import { categoryTone } from '@/lib/categoryTone';
import type { ProductRecord } from '@/types/models';

const routes = [
  { path: '/products', component: Products },
  { path: '/products/new', component: stubPage('new-page') },
  { path: '/products/:id', component: stubPage('detail-page') },
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

// 今天 2026-11-01（BDD 的今天）。每月 = 30 天
const monthly = { consumption_rate: 1, consumption_period: 'monthly' as const };
const PRODUCTS = [
  // 建立順序刻意打亂，確認畫面依急迫程度排序
  product({
    id: 'p-normal',
    category: 'c-clean',
    brand: '泡舒',
    name: '洗碗精',
    unit: '瓶',
    consumption_unit: '瓶',
    ...monthly,
    remaining_quantity: 1,
    remaining_updated_at: '2026-10-28 00:00:00.000Z',
  }), // 11/27
  product({
    id: 'p-unset',
    category: 'c-clean',
    brand: '3M',
    name: '菜瓜布',
    unit: '片',
    consumption_unit: '',
  }),
  product({
    id: 'p-soon',
    brand: '春風',
    name: '抽取式衛生紙',
    remaining_quantity: 1,
    remaining_updated_at: '2026-10-08 00:00:00.000Z',
    ...monthly,
  }), // 11/7
  product({
    id: 'p-noremain',
    brand: 'Kleenex',
    name: '舒潔衛生紙',
    consumption_rate: 2,
    consumption_period: 'monthly',
  }),
  product({
    id: 'p-depleted',
    category: 'c-clean',
    brand: '白蘭',
    name: '洗衣精補充包',
    remaining_quantity: 0.5,
    remaining_updated_at: '2026-10-01 00:00:00.000Z',
    ...monthly,
    consumption_rate: 2,
  }), // 10/9
];

const seed = (products = PRODUCTS) =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
      { id: 'c-clean', name: '清潔用品' },
    ],
    products: products as never,
  });

const names = (w: Awaited<ReturnType<typeof mountPage>>['wrapper']) =>
  w.findAll('.list__name').map((n) => n.text());

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 1, 9, 0)); // 本地 2026-11-01
});
afterEach(() => vi.useRealTimers());

describe('商品列表（AC-7.3）', () => {
  it('標題、總數；依急迫程度排序：已耗盡 → 即將耗盡 → 未設定剩餘數量 → 正常 → 未設定消耗速率', async () => {
    seed();
    const { wrapper } = await mountPage('/products', routes);
    expect(wrapper.find('h1').text()).toBe('商品');
    expect(wrapper.find('.page__meta').text()).toBe('共 5 項 · 最需要補的排在前面');
    expect(names(wrapper)).toEqual([
      '白蘭 洗衣精補充包',
      '春風 抽取式衛生紙',
      'Kleenex 舒潔衛生紙',
      '泡舒 洗碗精',
      '3M 菜瓜布',
    ]);
  });

  it('第二行：剩餘數量（以消耗單位計）與預計耗盡日期', async () => {
    seed();
    const { wrapper } = await mountPage('/products', routes);
    expect(wrapper.findAll('.list__sub').map((n) => n.text())).toEqual([
      '剩 0.5 包 · 10/9 已用完',
      '剩 1 包 · 預計 11/7（剩 6 天）',
      '每月用 2 包',
      '剩 1 瓶 · 預計 11/27（剩 26 天）',
      '計價單位：片',
    ]);
  });

  it('狀態標籤：已耗盡、即將耗盡、未設定剩餘數量、未設定消耗速率；正常不顯示（AC-7.4、7.5、7.7、7.12）', async () => {
    seed();
    const { wrapper } = await mountPage('/products', routes);
    const badges = wrapper
      .findAll('.list__row')
      .map((row) => row.find('.depletion-badge'))
      .map((b) => (b.exists() ? b.text() : null));
    expect(badges).toEqual([
      STATUS.depleted,
      STATUS.soon,
      STATUS.remainingNotSet,
      null,
      STATUS.rateNotSet,
    ]);
  });

  it('分類圖塊：分類名稱前 2 個字，顏色依分類建立順序', async () => {
    seed();
    const { wrapper } = await mountPage('/products', routes);
    const tiles = wrapper.findAll('.tile');
    expect(tiles.map((t) => t.text())).toEqual(['清潔', '衛生', '衛生', '清潔', '清潔']);
    // 「清潔用品」是第 3 個建立的分類 → 第 3 組顏色
    expect(tiles[0]!.attributes('style')).toContain(hexToRgb(categoryTone(2).bg));
    expect(tiles[1]!.attributes('style')).toContain(hexToRgb(categoryTone(0).bg));
  });

  it('點選商品進入商品詳情', async () => {
    seed();
    const { wrapper, router } = await mountPage('/products', routes);
    await wrapper.findAll('.list__row')[1]!.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/products/p-soon');
  });

  it('「新增商品」按鈕前往新增商品頁', async () => {
    seed();
    const { wrapper, router } = await mountPage('/products', routes);
    await wrapper.find('a.add-link').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/products/new');
  });
});

describe('依分類篩選（AC-7.3）', () => {
  it('篩選按鈕：全部 + 各分類（依建立順序），預設「全部」', async () => {
    seed();
    const { wrapper } = await mountPage('/products', routes);
    const group = wrapper.find('[role="radiogroup"]');
    expect(group.attributes('aria-label')).toBe('依分類篩選');
    const chips = group.findAll('[role="radio"]');
    expect(chips.map((c) => c.text())).toEqual(['全部', '衛生紙', '蔬菜', '清潔用品']);
    expect(chips.map((c) => c.attributes('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
  });

  it('選分類只顯示該分類的商品（仍依急迫程度），總數跟著變；選「全部」恢復', async () => {
    seed();
    const { wrapper } = await mountPage('/products', routes);
    const chip = (text: string) =>
      wrapper.findAll('[role="radio"]').find((c) => c.text() === text)!;

    await chip('清潔用品').trigger('click');
    await flushPromises();
    expect(names(wrapper)).toEqual(['白蘭 洗衣精補充包', '泡舒 洗碗精', '3M 菜瓜布']);
    expect(wrapper.find('.page__meta').text()).toBe('共 3 項 · 最需要補的排在前面');
    expect(chip('清潔用品').attributes('aria-checked')).toBe('true');
    expect(chip('全部').attributes('aria-checked')).toBe('false');

    await chip('全部').trigger('click');
    await flushPromises();
    expect(names(wrapper)).toHaveLength(5);
  });

  it('分類下沒有商品：顯示提示', async () => {
    seed();
    const { wrapper } = await mountPage('/products', routes);
    await wrapper
      .findAll('[role="radio"]')
      .find((c) => c.text() === '蔬菜')!
      .trigger('click');
    await flushPromises();
    expect(names(wrapper)).toEqual([]);
    expect(wrapper.find('.list__state').text()).toBe('「蔬菜」還沒有商品');
  });
});

describe('記住篩選（網址 ?category=）', () => {
  const chip = (w: Awaited<ReturnType<typeof mountPage>>['wrapper'], text: string) =>
    w.findAll('[role="radio"]').find((c) => c.text() === text)!;

  it('選分類時寫進網址（replace，不多一筆瀏覽紀錄）；選「全部」時拿掉', async () => {
    seed();
    const { wrapper, router } = await mountPage('/products', routes);
    const push = vi.spyOn(router, 'push');

    await chip(wrapper, '清潔用品').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/products?category=c-clean');
    expect(push).not.toHaveBeenCalled();

    await chip(wrapper, '全部').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/products');
  });

  it('直接開啟帶分類的網址：套用篩選', async () => {
    seed();
    const { wrapper } = await mountPage('/products?category=c-clean', routes);
    expect(chip(wrapper, '清潔用品').attributes('aria-checked')).toBe('true');
    expect(names(wrapper)).toEqual(['白蘭 洗衣精補充包', '泡舒 洗碗精', '3M 菜瓜布']);
  });

  it('從商品詳情按上一頁：回到原本的篩選', async () => {
    seed();
    const { wrapper, router } = await mountPage('/products', routes);
    await chip(wrapper, '清潔用品').trigger('click');
    await flushPromises();
    await wrapper.findAll('.list__row')[0]!.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/products/p-depleted');

    router.back();
    await new Promise((r) => setTimeout(r, 0)); // memory history 的 back 是非同步
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/products?category=c-clean');
    expect(chip(wrapper, '清潔用品').attributes('aria-checked')).toBe('true');
    expect(names(wrapper)).toEqual(['白蘭 洗衣精補充包', '泡舒 洗碗精', '3M 菜瓜布']);
  });

  it('篩選中按「新增商品」：帶上分類（task 7.4 預先選好）', async () => {
    seed();
    const { wrapper } = await mountPage('/products', routes);
    expect(wrapper.find('a.add-link').attributes('href')).toBe('/products/new');
    await chip(wrapper, '清潔用品').trigger('click');
    await flushPromises();
    expect(wrapper.find('a.add-link').attributes('href')).toBe('/products/new?category=c-clean');
  });

  it('網址上的分類不存在（例如已被刪除）：當成「全部」', async () => {
    seed();
    const { wrapper } = await mountPage('/products?category=c-gone', routes);
    expect(chip(wrapper, '全部').attributes('aria-checked')).toBe('true');
    expect(names(wrapper)).toHaveLength(5);
  });
});

describe('載入狀態', () => {
  it('完全沒有商品：顯示提示', async () => {
    seed([]);
    const { wrapper } = await mountPage('/products', routes);
    expect(wrapper.find('.list__state').text()).toBe('還沒有商品，按右上角「新增商品」開始記錄');
  });

  it('載入失敗：顯示錯誤（ERR-014）與重新載入，重試成功後顯示清單', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'products', method: 'getFullList' });
    const { wrapper } = await mountPage('/products', routes);
    expect(wrapper.find('[role="alert"]').text()).toContain(ERR.networkError);
    expect(names(wrapper)).toEqual([]);

    await wrapper.find('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(names(wrapper)).toHaveLength(5);
  });
});

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
