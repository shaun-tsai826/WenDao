// useProductStore（task 7.1，REQ-3 / AC-3.1～3.6、REQ-7 / AC-7.1、7.8～7.11；對應 BDD）
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useProductStore, type ConsumptionInput } from '@/stores/product';
import { apiErrorMessage, DuplicateProductError } from '@/lib/errors';
import { ERR } from '@/constants/messages';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';

// BDD 背景：分類「衛生紙」下有「春風 抽取式衛生紙」「Kleenex 舒潔衛生紙」
const seed = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [
      {
        id: 'p-spring',
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
      },
      {
        id: 'p-kleenex',
        category: 'c-tissue',
        brand: 'Kleenex',
        name: '舒潔衛生紙',
        unit: '抽',
        consumption_unit: '包',
        consumption_rate: 0,
        consumption_period: '',
        remaining_quantity: 0,
        remaining_updated_at: '',
        consumption_note: '',
      },
    ],
  });

async function errorOf(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (err) {
    return apiErrorMessage(err);
  }
}

const NEW = {
  category: 'c-tissue',
  brand: '春風',
  name: '平版衛生紙',
  unit: '抽',
  consumption_unit: '',
};
const CONSUMPTION: ConsumptionInput = {
  consumption_rate: 4,
  consumption_period: 'monthly',
  consumption_unit: '包',
  remaining_quantity: 2,
  consumption_note: '',
};

beforeEach(() => {
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchProducts', () => {
  it('取得所有商品', async () => {
    seed();
    const store = useProductStore();
    await store.fetchProducts();
    expect(store.products.map((p) => p.id)).toEqual(['p-spring', 'p-kleenex']);
  });
});

describe('createProduct（AC-3.1～3.6）', () => {
  it('BDD：「春風 平版衛生紙」計價單位「抽」→ 建立成功（AC-3.1、3.2）', async () => {
    const fake = seed();
    const created = await useProductStore().createProduct(NEW);
    expect(created).toMatchObject({
      category: 'c-tissue',
      brand: '春風',
      name: '平版衛生紙',
      unit: '抽',
    });
    expect(fake.rows('products')).toHaveLength(3);
  });

  it('前後空白會被去掉後儲存', async () => {
    const fake = seed();
    await useProductStore().createProduct({
      ...NEW,
      brand: ' 春風 ',
      name: ' 平版衛生紙 ',
      unit: ' 抽 ',
      consumption_unit: ' 包 ',
    });
    expect(fake.rows('products').at(-1)).toMatchObject({
      brand: '春風',
      name: '平版衛生紙',
      unit: '抽',
      consumption_unit: '包',
    });
  });

  it('同一分類可以有多個商品（AC-3.5）', async () => {
    const fake = seed();
    await useProductStore().createProduct(NEW);
    await useProductStore().createProduct({ ...NEW, name: '盒裝面紙' });
    expect(fake.rows('products').filter((p) => p.category === 'c-tissue')).toHaveLength(4);
  });

  it.each([
    ['品牌空白', { brand: '  ' }],
    ['品名空白', { name: '' }],
  ])('BDD：%s → ERR-005（AC-3.3）', async (_label, change) => {
    const fake = seed();
    expect(await errorOf(useProductStore().createProduct({ ...NEW, ...change }))).toBe(
      '品牌與品名不可為空',
    );
    expect(fake.rows('products')).toHaveLength(2);
  });

  it('BDD：沒填計價單位 → ERR-006（AC-3.4）', async () => {
    seed();
    expect(await errorOf(useProductStore().createProduct({ ...NEW, unit: ' ' }))).toBe(
      '請設定計量單位',
    );
  });

  it('沒選分類 → ERR-009', async () => {
    seed();
    expect(await errorOf(useProductStore().createProduct({ ...NEW, category: '' }))).toBe(
      ERR.required,
    );
  });

  it.each([
    ['前後空白「 春風 」', ' 春風 ', '抽取式衛生紙'],
    ['全形大寫「ＫＬＥＥＮＥＸ」', 'ＫＬＥＥＮＥＸ', '舒潔衛生紙'],
    ['小寫「kleenex」', 'kleenex', '舒潔衛生紙'],
    ['品名全形空白「　舒潔衛生紙」', 'Kleenex', '　舒潔衛生紙'],
  ])('BDD：%s → ERR-007（AC-3.6）', async (_label, brand, name) => {
    const fake = seed();
    expect(await errorOf(useProductStore().createProduct({ ...NEW, brand, name }))).toBe(
      '此品牌與品名已存在於此分類',
    );
    expect(fake.rows('products')).toHaveLength(2);
  });

  it('不同分類可以有相同品牌品名', async () => {
    const fake = seed();
    await useProductStore().createProduct({
      ...NEW,
      category: 'c-veg',
      brand: '春風',
      name: '抽取式衛生紙',
    });
    expect(fake.rows('products')).toHaveLength(3);
  });

  it('重複時錯誤帶出已存在的商品（task 7.4 畫面顯示「已有『Kleenex 舒潔衛生紙』」）', async () => {
    seed();
    const err = await useProductStore()
      .createProduct({ ...NEW, brand: 'ＫＬＥＥＮＥＸ', name: '舒潔衛生紙' })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DuplicateProductError);
    expect((err as DuplicateProductError).message).toBe(ERR.productDuplicate);
    expect((err as DuplicateProductError).existing).toEqual({
      brand: 'Kleenex',
      name: '舒潔衛生紙',
    });
  });

  it('另一人剛好建立相同商品（前端查詢之後、資料庫 UNIQUE 擋下）→ ERR-007', async () => {
    const fake = seed();
    fake.failNext(400, {
      collection: 'products',
      method: 'create',
      data: { name: { code: 'validation_not_unique' } },
    });
    expect(await errorOf(useProductStore().createProduct(NEW))).toBe(ERR.productDuplicate);
  });
});

describe('updateProduct：消耗設定與剩餘數量（AC-7.1、7.8～7.11）', () => {
  it('BDD：今天 2026-11-01，剩餘數量 5 → 儲存 5 與更新日 2026-11-01（AC-7.9）', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 1, 21, 0));
    const fake = seed();
    await useProductStore().updateProduct('p-spring', { ...CONSUMPTION, remaining_quantity: 5 });
    expect(fake.rows('products').find((p) => p.id === 'p-spring')).toMatchObject({
      remaining_quantity: 5,
      remaining_updated_at: '2026-11-01 00:00:00.000Z',
      consumption_rate: 4,
      consumption_period: 'monthly',
      consumption_unit: '包',
    });
  });

  it('剩 0 也是有效值（會記錄更新日）', async () => {
    const fake = seed();
    await useProductStore().updateProduct('p-spring', { ...CONSUMPTION, remaining_quantity: 0 });
    const row = fake.rows('products').find((p) => p.id === 'p-spring')!;
    expect(row.remaining_quantity).toBe(0);
    expect(row.remaining_updated_at).not.toBe('');
  });

  it('清空剩餘數量 → 數量與更新日一起清空（代表不追蹤）', async () => {
    const fake = seed();
    const store = useProductStore();
    await store.updateProduct('p-spring', CONSUMPTION);
    await store.updateProduct('p-spring', { ...CONSUMPTION, remaining_quantity: null });
    expect(fake.rows('products').find((p) => p.id === 'p-spring')).toMatchObject({
      remaining_quantity: 0,
      remaining_updated_at: '',
    });
  });

  it('BDD：剩餘數量 -5 → ERR-015，不儲存（AC-7.10）', async () => {
    const fake = seed();
    expect(
      await errorOf(
        useProductStore().updateProduct('p-spring', { ...CONSUMPTION, remaining_quantity: -5 }),
      ),
    ).toBe('剩餘數量不可為負數');
    expect(fake.calls.some((c) => c.method === 'update')).toBe(false);
  });

  it('BDD：設定消耗速率 2 但沒填消耗單位 → ERR-016（AC-7.11）', async () => {
    seed();
    expect(
      await errorOf(
        useProductStore().updateProduct('p-spring', {
          ...CONSUMPTION,
          consumption_rate: 2,
          consumption_unit: '  ',
        }),
      ),
    ).toBe('請設定消耗單位');
  });

  it('沒設定消耗速率時，消耗單位可以不填', async () => {
    const fake = seed();
    await useProductStore().updateProduct('p-spring', {
      ...CONSUMPTION,
      consumption_rate: null,
      consumption_unit: '',
    });
    expect(fake.rows('products').find((p) => p.id === 'p-spring')).toMatchObject({
      consumption_rate: 0,
      consumption_period: '',
    });
  });

  it('消耗速率 0 視為未設定；有速率但沒選週期 → 預設每月', async () => {
    const fake = seed();
    const store = useProductStore();
    await store.updateProduct('p-spring', { ...CONSUMPTION, consumption_rate: 0 });
    expect(fake.rows('products').find((p) => p.id === 'p-spring')?.consumption_period).toBe('');
    await store.updateProduct('p-spring', { ...CONSUMPTION, consumption_period: null });
    expect(fake.rows('products').find((p) => p.id === 'p-spring')?.consumption_period).toBe(
      'monthly',
    );
  });

  it('備註可以儲存（AC-7.8），前後空白去掉', async () => {
    const fake = seed();
    await useProductStore().updateProduct('p-spring', {
      ...CONSUMPTION,
      consumption_note: ' 2026 年預計消耗 48 包 ',
    });
    expect(fake.rows('products').find((p) => p.id === 'p-spring')?.consumption_note).toBe(
      '2026 年預計消耗 48 包',
    );
  });

  it('更新後 store 裡的商品也跟著更新', async () => {
    seed();
    const store = useProductStore();
    await store.fetchProducts();
    await store.updateProduct('p-spring', CONSUMPTION);
    expect(store.getById('p-spring')?.consumption_rate).toBe(4);
  });
});
