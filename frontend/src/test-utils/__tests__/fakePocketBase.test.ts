// 測試用假 PocketBase 本身的測試（task 8.1 擴充：比較運算子、關聯欄位、連帶刪除）
// 假資料庫錯了，所有依賴它的測試都會跟著不準，所以擴充的部分也要測。
import { describe, it, expect } from 'vitest';
import pb from '@/lib/pocketbase';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';

const seed = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [
      { id: 'p-spring', category: 'c-tissue' },
      { id: 'p-cabbage', category: 'c-veg' },
    ],
    purchase_records: [
      { id: 'r-0930', product: 'p-spring', purchase_date: '2026-09-30 00:00:00.000Z' },
      { id: 'r-1001', product: 'p-spring', purchase_date: '2026-10-01 00:00:00.000Z' },
      { id: 'r-1031', product: 'p-cabbage', purchase_date: '2026-10-31 00:00:00.000Z' },
      { id: 'r-1101', product: 'p-cabbage', purchase_date: '2026-11-01 00:00:00.000Z' },
    ],
    purchase_record_field_values: [
      { id: 'v-1', purchase_record: 'r-1001', custom_field: 'f-1', field_value: '100' },
      { id: 'v-2', purchase_record: 'r-1001', custom_field: 'f-2', field_value: '12' },
      { id: 'v-3', purchase_record: 'r-0930', custom_field: 'f-1', field_value: '90' },
    ],
  });

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe('filter：比較運算子', () => {
  it('>= 與 <=（日期字串依字典順序比較，和 PocketBase 相同）', async () => {
    seed();
    const rows = await pb.collection('purchase_records').getFullList({
      filter: pb.filter('purchase_date >= {:s} && purchase_date <= {:e}', {
        s: '2026-10-01 00:00:00.000Z',
        e: '2026-10-31 23:59:59.999Z',
      }),
    });
    expect(ids(rows)).toEqual(['r-1001', 'r-1031']);
  });

  it('> 與 <', async () => {
    seed();
    const rows = await pb.collection('purchase_records').getFullList({
      filter: pb.filter('purchase_date > {:s} && purchase_date < {:e}', {
        s: '2026-09-30 00:00:00.000Z',
        e: '2026-11-01 00:00:00.000Z',
      }),
    });
    expect(ids(rows)).toEqual(['r-1001', 'r-1031']);
  });
});

describe('filter：關聯欄位（product.category）', () => {
  it('沿著關聯找到商品的分類', async () => {
    seed();
    const rows = await pb.collection('purchase_records').getFullList({
      filter: pb.filter('product.category = {:c}', { c: 'c-veg' }),
    });
    expect(ids(rows)).toEqual(['r-1031', 'r-1101']);
  });

  it('可以和其他條件一起用', async () => {
    seed();
    const rows = await pb.collection('purchase_records').getFullList({
      filter: pb.filter('product.category = {:c} && purchase_date <= {:e}', {
        c: 'c-veg',
        e: '2026-10-31 23:59:59.999Z',
      }),
    });
    expect(ids(rows)).toEqual(['r-1031']);
  });
});

describe('delete：連帶刪除（cascadeDelete）', () => {
  it('刪除購買記錄時，連同它的自訂欄位值一起刪掉；其他記錄的值不受影響', async () => {
    const fake = seed();
    await pb.collection('purchase_records').delete('r-1001');
    expect(ids(fake.rows('purchase_records'))).toEqual(['r-0930', 'r-1031', 'r-1101']);
    expect(ids(fake.rows('purchase_record_field_values'))).toEqual(['v-3']);
  });
});
