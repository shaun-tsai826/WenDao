// 新增商品頁（task 7.4，REQ-3 / AC-3.1～3.6）
// 設計：設計稿 Prod-New（使用者 2026-11-02 確認）、design.md v3.3「商品管理」
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import ProductNew from '@/pages/ProductNew.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { ERR, MSG } from '@/constants/messages';
import * as feedback from '@/lib/feedback';

const routes = [
  { path: '/products', component: stubPage('list-page') },
  { path: '/products/new', component: ProductNew },
  { path: '/products/:id', component: stubPage('detail-page') },
  { path: '/categories', component: stubPage('categories-page') },
];

// BDD 背景：分類「衛生紙」下有「春風 抽取式衛生紙」「Kleenex 舒潔衛生紙」
const seed = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [
      { id: 'p-spring', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙', unit: '抽' },
      { id: 'p-kleenex', category: 'c-tissue', brand: 'Kleenex', name: '舒潔衛生紙', unit: '抽' },
    ],
  });

type Page = Awaited<ReturnType<typeof mountPage>>;

async function fill(
  page: Page,
  values: Partial<Record<'category' | 'brand' | 'name' | 'unit' | 'cunit', string>>,
) {
  const w = page.wrapper;
  if (values.category !== undefined) await w.find('#p-cat').setValue(values.category);
  if (values.brand !== undefined) await w.find('#p-brand').setValue(values.brand);
  if (values.name !== undefined) await w.find('#p-name').setValue(values.name);
  if (values.unit !== undefined) await w.find('#p-unit').setValue(values.unit);
  if (values.cunit !== undefined) await w.find('#p-cunit').setValue(values.cunit);
}

async function submit(page: Page) {
  await page.wrapper.find('form').trigger('submit');
  await flushPromises();
}

const alertText = (page: Page) => page.wrapper.find('[role="alert"]').text();

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('畫面', () => {
  it('返回列與標題；分類選單依建立順序，預設第一個分類', async () => {
    seed();
    const page = await mountPage('/products/new', routes);
    expect(page.wrapper.find('h1').text()).toBe('新增商品');
    expect(page.wrapper.find('a[aria-label="返回商品"]').attributes('href')).toBe('/products');
    const options = page.wrapper.findAll('#p-cat option');
    expect(options.map((o) => o.text())).toEqual(['衛生紙', '蔬菜']);
    expect((page.wrapper.find('#p-cat').element as HTMLSelectElement).value).toBe('c-tissue');
  });

  it('從篩選過的商品列表進來（?category=）：預先選好該分類，返回時回到同一個篩選', async () => {
    seed();
    const page = await mountPage('/products/new?category=c-veg', routes);
    expect((page.wrapper.find('#p-cat').element as HTMLSelectElement).value).toBe('c-veg');
    expect(page.wrapper.find('a[aria-label="返回商品"]').attributes('href')).toBe(
      '/products?category=c-veg',
    );
  });

  it('網址上的分類不存在：改選第一個分類', async () => {
    seed();
    const page = await mountPage('/products/new?category=c-gone', routes);
    expect((page.wrapper.find('#p-cat').element as HTMLSelectElement).value).toBe('c-tissue');
  });

  it('常用單位按鈕：點了填入計價單位並標示目前選的；自己輸入相同單位也會標示', async () => {
    seed();
    const page = await mountPage('/products/new', routes);
    const chips = page.wrapper.findAll('.unit-chip');
    expect(chips.map((c) => c.text())).toEqual(['抽', '片', '包', '個', 'ml', 'g']);

    await chips[1]!.trigger('click');
    expect((page.wrapper.find('#p-unit').element as HTMLInputElement).value).toBe('片');
    expect(chips[1]!.attributes('aria-pressed')).toBe('true');
    expect(chips[0]!.attributes('aria-pressed')).toBe('false');

    await fill(page, { unit: 'ml' });
    expect(chips[4]!.attributes('aria-pressed')).toBe('true');
    expect(chips[1]!.attributes('aria-pressed')).toBe('false');
  });

  it('還沒有分類：說明要先建立分類並提供連結，不顯示表單', async () => {
    installFakePocketBase({});
    const page = await mountPage('/products/new', routes);
    expect(page.wrapper.find('form').exists()).toBe(false);
    expect(page.wrapper.find('.empty').text()).toContain('要先建立分類');
    expect(page.wrapper.find('.empty a').attributes('href')).toBe('/categories');
  });

  it('分類載入失敗：顯示錯誤（ERR-014）與重新載入', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'categories', method: 'getFullList' });
    const page = await mountPage('/products/new', routes);
    expect(alertText(page)).toContain(ERR.networkError);
    await page.wrapper.find('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(page.wrapper.find('form').exists()).toBe(true);
  });
});

describe('建立商品（AC-3.1、3.2、3.5）', () => {
  it('BDD：衛生紙下輸入春風 / 平版衛生紙 / 抽 → 建立（同分類可有多個商品），顯示 MSG-003 並進入商品詳情', async () => {
    const fake = seed();
    const notify = vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const page = await mountPage('/products/new', routes);
    await fill(page, { brand: ' 春風 ', name: '平版衛生紙', unit: '抽', cunit: '包' });
    await submit(page);

    const created = fake.rows('products').find((p) => p.name === '平版衛生紙');
    expect(created).toMatchObject({
      category: 'c-tissue',
      brand: '春風',
      unit: '抽',
      consumption_unit: '包',
    });
    expect(fake.rows('products')).toHaveLength(3);
    expect(notify).toHaveBeenCalledWith(MSG.productCreated);
    expect(page.router.currentRoute.value.path).toBe(`/products/${created!.id}`);
  });

  it('消耗單位可以不填；選其他分類就建在該分類', async () => {
    const fake = seed();
    vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const page = await mountPage('/products/new', routes);
    await fill(page, { category: 'c-veg', brand: '有機', name: '高麗菜', unit: 'g' });
    await submit(page);
    expect(fake.rows('products').find((p) => p.name === '高麗菜')).toMatchObject({
      category: 'c-veg',
      consumption_unit: '',
    });
  });

  it('建立後用 replace 導頁：在詳情頁按上一頁不會回到填好的表單', async () => {
    seed();
    vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const page = await mountPage('/products/new', routes);
    const replace = vi.spyOn(page.router, 'replace');
    const push = vi.spyOn(page.router, 'push');
    await fill(page, { brand: '春風', name: '平版衛生紙', unit: '抽' });
    await submit(page);
    expect(replace).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});

describe('輸入錯誤（AC-3.3、3.4、3.6）', () => {
  it.each([
    ['品牌空白', { brand: '  ', name: '平版衛生紙', unit: '抽' }, ['p-brand']],
    ['品名空白', { brand: '春風', name: '', unit: '抽' }, ['p-name']],
    ['兩個都空白', { brand: '', name: '', unit: '抽' }, ['p-brand', 'p-name']],
  ])('BDD：%s → ERR-005，標示該欄位', async (_label, values, invalid) => {
    const fake = seed();
    const page = await mountPage('/products/new', routes);
    await fill(page, values);
    await submit(page);
    expect(alertText(page)).toBe(ERR.brandNameEmpty);
    for (const id of ['p-brand', 'p-name', 'p-unit']) {
      expect(page.wrapper.find(`#${id}`).attributes('aria-invalid')).toBe(
        invalid.includes(id) ? 'true' : undefined,
      );
    }
    expect(fake.rows('products')).toHaveLength(2);
    expect(page.router.currentRoute.value.path).toBe('/products/new');
  });

  it('BDD：未輸入計價單位 → ERR-006，標示計價單位', async () => {
    const fake = seed();
    const page = await mountPage('/products/new', routes);
    await fill(page, { brand: '春風', name: '平版衛生紙', unit: ' ' });
    await submit(page);
    expect(alertText(page)).toBe(ERR.unitRequired);
    expect(page.wrapper.find('#p-unit').attributes('aria-invalid')).toBe('true');
    expect(fake.rows('products')).toHaveLength(2);
  });

  it('BDD：「 春風 」（前後空白）＋抽取式衛生紙 → ERR-007，寫出已存在的商品', async () => {
    seed();
    const page = await mountPage('/products/new', routes);
    await fill(page, { brand: ' 春風 ', name: '抽取式衛生紙', unit: '抽' });
    await submit(page);
    expect(page.wrapper.find('.form-alert__title').text()).toBe(ERR.productDuplicate);
    expect(page.wrapper.find('.form-alert__detail').text()).toBe(
      '已有「春風 抽取式衛生紙」（大小寫、全半形不同也算同一個）',
    );
    expect(page.wrapper.find('#p-brand').attributes('aria-invalid')).toBe('true');
    expect(page.wrapper.find('#p-name').attributes('aria-invalid')).toBe('true');
  });

  it('BDD：「ＫＬＥＥＮＥＸ」（全形大寫）＋舒潔衛生紙 → ERR-007，寫出原本的 Kleenex', async () => {
    seed();
    const page = await mountPage('/products/new', routes);
    await fill(page, { brand: 'ＫＬＥＥＮＥＸ', name: '舒潔衛生紙', unit: '抽' });
    await submit(page);
    expect(page.wrapper.find('.form-alert__title').text()).toBe(ERR.productDuplicate);
    expect(page.wrapper.find('.form-alert__detail').text()).toContain('「Kleenex 舒潔衛生紙」');
  });

  it('出錯時焦點移到第一個有問題的欄位；改了那一欄就拿掉紅框', async () => {
    seed();
    const page = await mountPage('/products/new', routes);
    await fill(page, { brand: '春風', name: '', unit: '' });
    await submit(page);
    expect(document.activeElement?.id).toBe('p-name');

    await fill(page, { brand: '春風', name: '', unit: '' });
    await page.wrapper.find('.unit-chip').trigger('click');
    await submit(page); // 品名仍空白
    expect(document.activeElement?.id).toBe('p-name');
    await page.wrapper.find('#p-name').setValue('平版衛生紙');
    expect(page.wrapper.find('#p-name').attributes('aria-invalid')).toBeUndefined();
  });

  it('同品牌品名在「其他分類」不算重複', async () => {
    const fake = seed();
    vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const page = await mountPage('/products/new', routes);
    await fill(page, { category: 'c-veg', brand: '春風', name: '抽取式衛生紙', unit: '抽' });
    await submit(page);
    expect(fake.rows('products')).toHaveLength(3);
  });

  it('連不上伺服器 → ERR-014；可以再送出一次', async () => {
    const fake = seed();
    vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    fake.failNext(0, { collection: 'products', method: 'create' });
    const page = await mountPage('/products/new', routes);
    await fill(page, { brand: '春風', name: '平版衛生紙', unit: '抽' });
    await submit(page);
    expect(alertText(page)).toBe(ERR.networkError);
    expect(page.wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined();

    await submit(page);
    expect(fake.rows('products')).toHaveLength(3);
  });

  it('送出中按鈕停用並顯示「建立中…」，避免重複建立', async () => {
    seed();
    vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const page = await mountPage('/products/new', routes);
    await fill(page, { brand: '春風', name: '平版衛生紙', unit: '抽' });
    void page.wrapper.find('form').trigger('submit');
    await page.wrapper.vm.$nextTick();
    const button = page.wrapper.find('button[type="submit"]');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.text()).toBe('建立中…');
    await flushPromises();
  });
});
