// useCategoryStore（task 6.1，REQ-2 / AC-2.1～2.9；對應 BDD「REQ-2：商品分類管理」）
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCategoryStore } from '@/stores/category';
import { ValidationError, apiErrorMessage } from '@/lib/errors';
import { ERR } from '@/constants/messages';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';

// BDD 背景：種子分類「衛生紙」「蔬菜」，衛生紙下有商品「春風抽取式衛生紙」
const seed = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [{ id: 'p1', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙' }],
  });

/** 執行並回傳丟出的錯誤訊息（沒丟錯就回傳 null） */
async function errorOf(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (err) {
    return apiErrorMessage(err);
  }
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('fetchCategories（AC-2.1）', () => {
  it('取得所有分類，依建立順序', async () => {
    seed();
    const store = useCategoryStore();
    await store.fetchCategories();
    expect(store.categories.map((c) => c.name)).toEqual(['衛生紙', '蔬菜']);
    expect(store.loading).toBe(false);
  });

  it('連不上伺服器：丟出錯誤（ERR-014），loading 恢復 false', async () => {
    const fake = seed();
    fake.failNext(0);
    const store = useCategoryStore();
    expect(await errorOf(store.fetchCategories())).toBe(ERR.networkError);
    expect(store.loading).toBe(false);
  });
});

describe('createCategory', () => {
  it('BDD：建立「清潔用品」成功，清單與資料庫都多一筆（AC-2.2）', async () => {
    const fake = seed();
    const store = useCategoryStore();
    await store.fetchCategories();
    const created = await store.createCategory('清潔用品');
    expect(created.name).toBe('清潔用品');
    expect(store.categories.map((c) => c.name)).toEqual(['衛生紙', '蔬菜', '清潔用品']);
    expect(fake.rows('categories')).toHaveLength(3);
  });

  it('名稱前後空白會被去掉', async () => {
    const fake = seed();
    await useCategoryStore().createCategory('  清潔用品 ');
    expect(fake.rows('categories').at(-1)?.name).toBe('清潔用品');
  });

  it.each(['', '   ', '\t\n'])('BDD：空名稱「%s」被拒，ERR-002（AC-2.3）', async (name) => {
    const fake = seed();
    expect(await errorOf(useCategoryStore().createCategory(name))).toBe('分類名稱不可為空');
    expect(fake.rows('categories')).toHaveLength(2);
  });

  it.each(['衛生紙', ' 衛生紙 '])('BDD：重複名稱「%s」被拒，ERR-003（AC-2.4）', async (name) => {
    const fake = seed();
    expect(await errorOf(useCategoryStore().createCategory(name))).toBe(
      '此分類名稱已存在，請使用其他名稱',
    );
    expect(fake.rows('categories')).toHaveLength(2);
  });

  it('另一人剛在別的手機新增同名分類（本機清單還沒更新）：一樣擋下', async () => {
    const fake = seed();
    const store = useCategoryStore();
    await store.fetchCategories();
    fake.insert('categories', { id: 'c-other', name: '清潔用品' });
    expect(await errorOf(store.createCategory('清潔用品'))).toBe(ERR.categoryNameDuplicate);
  });

  it('丟出的是 ValidationError，錯誤訊息可直接顯示', async () => {
    seed();
    await expect(useCategoryStore().createCategory('')).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('updateCategory', () => {
  it('BDD：「蔬菜」改為「生鮮蔬菜」成功（AC-2.7）', async () => {
    const fake = seed();
    const store = useCategoryStore();
    await store.fetchCategories();
    await store.updateCategory('c-veg', '生鮮蔬菜');
    expect(store.getById('c-veg')?.name).toBe('生鮮蔬菜');
    expect(fake.rows('categories').find((c) => c.id === 'c-veg')?.name).toBe('生鮮蔬菜');
  });

  it('名稱不變直接儲存：不算重複', async () => {
    seed();
    const store = useCategoryStore();
    await expect(store.updateCategory('c-veg', '蔬菜')).resolves.toMatchObject({ name: '蔬菜' });
  });

  it('BDD：改為空名稱被拒，ERR-002（AC-2.8）', async () => {
    const fake = seed();
    expect(await errorOf(useCategoryStore().updateCategory('c-veg', '  '))).toBe(
      ERR.categoryNameEmpty,
    );
    expect(fake.rows('categories').find((c) => c.id === 'c-veg')?.name).toBe('蔬菜');
  });

  it('BDD：「蔬菜」改為「衛生紙」被拒，ERR-003（AC-2.9）', async () => {
    const fake = seed();
    expect(await errorOf(useCategoryStore().updateCategory('c-veg', '衛生紙'))).toBe(
      ERR.categoryNameDuplicate,
    );
    expect(fake.rows('categories').find((c) => c.id === 'c-veg')?.name).toBe('蔬菜');
  });
});

describe('deleteCategory', () => {
  it('BDD：刪除沒有商品的「蔬菜」成功（AC-2.6）', async () => {
    const fake = seed();
    const store = useCategoryStore();
    await store.fetchCategories();
    await store.deleteCategory('c-veg');
    expect(store.categories.map((c) => c.name)).toEqual(['衛生紙']);
    expect(fake.rows('categories').map((c) => c.id)).toEqual(['c-tissue']);
  });

  it('BDD：刪除有商品的「衛生紙」被拒，ERR-004（AC-2.5）', async () => {
    const fake = seed();
    const store = useCategoryStore();
    await store.fetchCategories();
    expect(await errorOf(store.deleteCategory('c-tissue'))).toBe('此分類下仍有商品，無法刪除');
    expect(store.categories).toHaveLength(2);
    expect(fake.rows('categories')).toHaveLength(2);
  });

  it('有商品時在前端就擋下，不送出刪除請求（design.md：前端驗證）', async () => {
    const fake = seed();
    await errorOf(useCategoryStore().deleteCategory('c-tissue'));
    expect(fake.calls.some((c) => c.collection === 'categories' && c.method === 'delete')).toBe(
      false,
    );
  });

  it('先查沒有商品、但刪除時被資料庫 Restrict 擋下（另一人剛好新增商品）：一樣顯示 ERR-004', async () => {
    const fake = seed();
    const store = useCategoryStore();
    await store.fetchCategories();
    fake.failNext(400, { collection: 'categories', method: 'delete' });
    expect(await errorOf(store.deleteCategory('c-veg'))).toBe(ERR.categoryHasProducts);
    expect(store.categories).toHaveLength(2);
  });

  it('伺服器錯誤：丟出 ERR-013，清單不變', async () => {
    const fake = seed();
    const store = useCategoryStore();
    await store.fetchCategories();
    fake.failNext(500);
    expect(await errorOf(store.deleteCategory('c-veg'))).toBe(ERR.serverError);
    expect(store.categories).toHaveLength(2);
  });
});
