// 編輯分類頁（task 6.4：刪除分類 AC-2.5、2.6；CONFIRM-003）
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import CategoryEdit from '@/pages/CategoryEdit.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { CONFIRM, ERR, MSG, withName } from '@/constants/messages';
import * as feedback from '@/lib/feedback';

const routes = [
  { path: '/categories', component: stubPage('list-page') },
  { path: '/categories/:id/edit', component: CategoryEdit },
];

const seed = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [{ id: 'p1', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙' }],
    custom_fields: [{ id: 'f1', category: 'c-veg', field_name: '產地' }],
  });

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('編輯分類：刪除（AC-2.5、2.6）', () => {
  it('BDD：「衛生紙」下有商品 → 刪除按鈕停用，並寫出原因（AC-2.5）', async () => {
    seed();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    expect(wrapper.find('.current').text()).toBe('衛生紙');
    expect(wrapper.find('.danger__button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.danger__hint').text()).toBe('此分類下仍有 1 項商品，要先刪除或移走商品');
  });

  it('BDD：刪除沒有商品的「蔬菜」→ 先確認（CONFIRM-003），確定後刪除、顯示 MSG-002、回到列表（AC-2.6）', async () => {
    const fake = seed();
    const confirm = vi.spyOn(feedback, 'confirmDelete').mockResolvedValue(true);
    const notify = vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const { wrapper, router } = await mountPage('/categories/c-veg/edit', routes);
    expect(wrapper.find('.danger__hint').text()).toBe('分類和它的自訂欄位設定會一起刪除');
    await wrapper.find('.danger__button').trigger('click');
    await flushPromises();
    expect(confirm).toHaveBeenCalledWith(withName(CONFIRM.deleteCategory, '蔬菜'));
    expect(confirm).toHaveBeenCalledWith('確定要刪除分類「蔬菜」嗎？');
    expect(notify).toHaveBeenCalledWith(MSG.categoryDeleted);
    expect(MSG.categoryDeleted).toBe('分類刪除成功');
    expect(router.currentRoute.value.path).toBe('/categories');
    expect(fake.rows('categories').map((c) => c.id)).toEqual(['c-tissue']);
  });

  it('確認時按「取消」：不刪除，留在原頁', async () => {
    const fake = seed();
    vi.spyOn(feedback, 'confirmDelete').mockResolvedValue(false);
    const { wrapper, router } = await mountPage('/categories/c-veg/edit', routes);
    await wrapper.find('.danger__button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/categories/c-veg/edit');
    expect(fake.rows('categories')).toHaveLength(2);
  });

  it('確認後才發現另一人剛新增商品（資料庫擋下）：顯示 ERR-004，按鈕改為停用', async () => {
    const fake = seed();
    vi.spyOn(feedback, 'confirmDelete').mockImplementation(() => {
      fake.insert('products', { id: 'p2', category: 'c-veg', brand: '小農', name: '高麗菜' });
      return Promise.resolve(true);
    });
    const error = vi.spyOn(feedback, 'notifyError').mockImplementation(() => undefined);
    const { wrapper, router } = await mountPage('/categories/c-veg/edit', routes);
    await wrapper.find('.danger__button').trigger('click');
    await flushPromises();
    expect(error).toHaveBeenCalledWith(ERR.categoryHasProducts);
    expect(router.currentRoute.value.path).toBe('/categories/c-veg/edit');
    expect(wrapper.find('.danger__button').attributes('disabled')).toBeDefined();
    expect(fake.rows('categories')).toHaveLength(2);
  });

  it('找不到分類（例如已被另一人刪除）：顯示提示與返回連結', async () => {
    seed();
    const { wrapper } = await mountPage('/categories/nope/edit', routes);
    expect(wrapper.text()).toContain('找不到這個分類');
    expect(wrapper.find('.danger').exists()).toBe(false);
  });

  it('返回箭頭回到分類管理；頁面標題為「編輯分類」', async () => {
    seed();
    const { wrapper, router } = await mountPage('/categories/c-veg/edit', routes);
    expect(wrapper.find('h1').text()).toBe('編輯分類');
    await wrapper.find('a[aria-label="返回分類管理"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/categories');
  });
});
