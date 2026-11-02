// 分類管理頁（task 6.2：列表，AC-2.1）
import { describe, it, expect, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import Categories from '@/pages/Categories.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { ERR } from '@/constants/messages';
import { categoryLabel, categoryTone } from '@/lib/categoryTone';

const routes = [
  { path: '/categories', component: Categories },
  { path: '/categories/:id/edit', component: stubPage('edit-page') },
];

// BDD 背景：種子分類「衛生紙」「蔬菜」；衛生紙有 1 項商品、3 個自訂欄位
const seed = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [{ id: 'p1', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙' }],
    custom_fields: [
      { id: 'f1', category: 'c-tissue', field_name: '抽數(單包)' },
      { id: 'f2', category: 'c-tissue', field_name: '包數' },
      { id: 'f3', category: 'c-tissue', field_name: '層數' },
    ],
  });

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('分類列表（AC-2.1）', () => {
  it('顯示所有分類，依建立順序，並顯示總數', async () => {
    seed();
    const { wrapper } = await mountPage('/categories', routes);
    expect(wrapper.find('h1').text()).toBe('分類管理');
    expect(wrapper.findAll('.list__name').map((n) => n.text())).toEqual(['衛生紙', '蔬菜']);
    expect(wrapper.find('.page__meta').text()).toBe('共 2 個分類');
  });

  it('每列顯示商品數與自訂欄位數', async () => {
    seed();
    const { wrapper } = await mountPage('/categories', routes);
    expect(wrapper.findAll('.list__sub').map((n) => n.text())).toEqual([
      '1 項商品 · 3 個自訂欄位',
      '0 項商品 · 沒有自訂欄位',
    ]);
  });

  it('分類圖塊：名稱前 2 個字，依順序配色', async () => {
    seed();
    const { wrapper } = await mountPage('/categories', routes);
    const tiles = wrapper.findAll('.tile');
    expect(tiles.map((t) => t.text())).toEqual(['衛生', '蔬菜']);
    expect(tiles[1]!.attributes('style')).toContain(hexToRgb(categoryTone(1).bg));
  });

  it('點選分類進入編輯分類頁', async () => {
    seed();
    const { wrapper, router } = await mountPage('/categories', routes);
    await wrapper.findAll('.list__row')[1]!.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/categories/c-veg/edit');
  });

  it('沒有分類：顯示提示文字', async () => {
    installFakePocketBase({});
    const { wrapper } = await mountPage('/categories', routes);
    expect(wrapper.text()).toContain('還沒有分類');
    expect(wrapper.find('.page__meta').text()).toBe('共 0 個分類');
  });

  it('載入失敗：顯示 ERR-014 與「重新載入」，按下後重新取得', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'categories', method: 'getFullList' });
    const { wrapper } = await mountPage('/categories', routes);
    expect(wrapper.find('[role="alert"]').text()).toContain(ERR.networkError);
    await wrapper.find('.link-button').trigger('click');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.findAll('.list__name')).toHaveLength(2);
  });
});

describe('categoryTone / categoryLabel', () => {
  it('6 組顏色輪流，第 7 個起重複', () => {
    expect(categoryTone(6)).toEqual(categoryTone(0));
    expect(categoryTone(7)).toEqual(categoryTone(1));
  });

  it('取名稱前 2 個字，前後空白不算', () => {
    expect(categoryLabel(' 清潔用品 ')).toBe('清潔');
    expect(categoryLabel('A')).toBe('A');
  });
});

function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
