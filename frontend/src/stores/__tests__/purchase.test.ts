// usePurchaseStore 的讀取（task 7.5 先做：fetchByProduct、fetchUsers；其餘於 task 8.1）
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePurchaseStore } from '@/stores/purchase';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';

// BDD：「春風抽取式衛生紙」有 2 筆購買記錄，另有其他商品的記錄
const seed = () =>
  installFakePocketBase({
    users: [
      { id: 'u-pi', name: '老皮' },
      { id: 'u-bao', name: '阿寶' },
    ],
    purchase_records: [
      {
        id: 'r-old',
        product: 'p-spring',
        purchase_date: '2026-09-05 00:00:00.000Z',
        store: '蝦皮',
        total_price: 549,
        quantity: 1200,
        unit_price: 0.4575,
        user: 'u-bao',
      },
      {
        id: 'r-other',
        product: 'p-kleenex',
        purchase_date: '2026-10-25 00:00:00.000Z',
        store: '全聯',
        total_price: 300,
        quantity: 600,
        unit_price: 0.5,
        user: 'u-pi',
      },
      {
        id: 'r-new',
        product: 'p-spring',
        purchase_date: '2026-10-20 00:00:00.000Z',
        store: '全聯',
        total_price: 599,
        quantity: 1200,
        unit_price: 0.4992,
        user: 'u-pi',
      },
      {
        id: 'r-noqty',
        product: 'p-spring',
        purchase_date: '2026-08-01 00:00:00.000Z',
        store: '家樂福',
        total_price: 100,
        quantity: 0,
        unit_price: 0,
        user: 'u-pi',
      },
    ],
  });

beforeEach(() => setActivePinia(createPinia()));

describe('fetchByProduct（AC-8.2）', () => {
  it('BDD：只取這個商品的記錄，依購入日期由新至舊', async () => {
    seed();
    const views = await usePurchaseStore().fetchByProduct('p-spring');
    expect(views.map((v) => v.record.id)).toEqual(['r-new', 'r-old', 'r-noqty']);
    expect(views[2]).toMatchObject({ quantity: null, unitPrice: null });
  });

  it('同一天購買：後建立的排前面', async () => {
    installFakePocketBase({
      purchase_records: [
        {
          id: 'r-a',
          product: 'p',
          purchase_date: '2026-10-20 00:00:00.000Z',
          quantity: 1,
          unit_price: 1,
        },
        {
          id: 'r-b',
          product: 'p',
          purchase_date: '2026-10-20 00:00:00.000Z',
          quantity: 1,
          unit_price: 1,
        },
      ],
    });
    const views = await usePurchaseStore().fetchByProduct('p');
    expect(views.map((v) => v.record.id)).toEqual(['r-b', 'r-a']);
  });

  it('沒有記錄 → 空陣列', async () => {
    seed();
    expect(await usePurchaseStore().fetchByProduct('p-none')).toEqual([]);
  });
});

describe('fetchUsers（購買記錄的新增者）', () => {
  it('依建立順序取得所有使用者，可查名稱與順序（決定頭像顏色）', async () => {
    seed();
    const store = usePurchaseStore();
    await store.fetchUsers();
    expect(store.users.map((u) => u.name)).toEqual(['老皮', '阿寶']);
    expect(store.userIndex('u-bao')).toBe(1);
    expect(store.userName('u-bao')).toBe('阿寶');
    expect(store.userIndex('u-gone')).toBe(-1);
    expect(store.userName('u-gone')).toBe('');
  });
});
