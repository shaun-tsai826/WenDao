// usePurchaseStore（task 7.5：fetchByProduct、fetchUsers；task 8.1：fetchRecords、createRecord、updateRecord、deleteRecord）
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePurchaseStore } from '@/stores/purchase';
import pb from '@/lib/pocketbase';
import { apiErrorMessage, FieldsValidationError } from '@/lib/errors';
import { ERR } from '@/constants/messages';
import type { PurchaseFormData } from '@/lib/purchaseForm';
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

// ======================= task 8.1：fetchRecords、createRecord、updateRecord、deleteRecord =======================

// BDD 背景：分類「衛生紙」（3 個自訂欄位）與「蔬菜」（沒有自訂欄位）
const TISSUE_FIELDS = [
  { id: 'f-sheets', field_type: 'number' as const, is_quantity_component: true },
  { id: 'f-packs', field_type: 'number' as const, is_quantity_component: true },
  { id: 'f-ply', field_type: 'number' as const, is_quantity_component: false },
];

const FULL = () =>
  installFakePocketBase({
    users: [
      { id: 'u-pi', name: '老皮' },
      { id: 'u-bao', name: '阿寶' },
    ],
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [
      { id: 'p-spring', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙', unit: '抽' },
      { id: 'p-cabbage', category: 'c-veg', brand: '有機', name: '高麗菜', unit: '顆' },
    ],
    custom_fields: TISSUE_FIELDS.map((f) => ({ ...f, category: 'c-tissue' })),
    // BDD AC-8.6：購入日期 9/30、10/1、10/31、11/1
    purchase_records: [
      {
        id: 'r-0930',
        product: 'p-spring',
        purchase_date: '2026-09-30 00:00:00.000Z',
        store: '全聯',
        total_price: 599,
        quantity: 1200,
        unit_price: 0.4992,
        user: 'u-pi',
      },
      {
        id: 'r-1001',
        product: 'p-cabbage',
        purchase_date: '2026-10-01 00:00:00.000Z',
        store: '市場',
        total_price: 60,
        quantity: 2,
        unit_price: 30,
        user: 'u-bao',
      },
      {
        id: 'r-1031',
        product: 'p-spring',
        purchase_date: '2026-10-31 00:00:00.000Z',
        store: '蝦皮',
        total_price: 549,
        quantity: 1200,
        unit_price: 0.4575,
        user: 'u-bao',
      },
      {
        id: 'r-1101',
        product: 'p-cabbage',
        purchase_date: '2026-11-01 00:00:00.000Z',
        store: '市場',
        total_price: 70,
        quantity: 0,
        unit_price: 0,
        user: 'u-pi',
      },
    ],
    purchase_record_field_values: [
      { id: 'v-sheets', purchase_record: 'r-1031', custom_field: 'f-sheets', field_value: '100' },
      { id: 'v-packs', purchase_record: 'r-1031', custom_field: 'f-packs', field_value: '12' },
      { id: 'v-ply', purchase_record: 'r-1031', custom_field: 'f-ply', field_value: '2' },
    ],
  });

const NEW_TISSUE: PurchaseFormData = {
  productId: 'p-spring',
  purchaseDate: '2026-11-01',
  store: ' 全聯 ',
  totalPrice: 599,
  quantity: null,
  customFields: TISSUE_FIELDS,
  fieldValues: { 'f-sheets': '100', 'f-packs': '12', 'f-ply': '2' },
};

/** 取出丟出的錯誤（沒丟出時回傳 null） */
async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return null;
  } catch (err) {
    return err;
  }
}

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe('task 8.1', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 2, 9, 0)); // 今天 2026-11-02
    pb.authStore.save('test-token', { id: 'u-pi', name: '老皮' } as never); // 老皮登入
  });
  afterEach(() => {
    vi.useRealTimers();
    pb.authStore.clear();
  });

  describe('fetchRecords（AC-8.1、8.5、8.6、8.7）', () => {
    it('BDD：沒有篩選 → 所有記錄，依購入日期由新至舊', async () => {
      FULL();
      const store = usePurchaseStore();
      await store.fetchRecords();
      expect(ids(store.records)).toEqual(['r-1101', 'r-1031', 'r-1001', 'r-0930']);
      expect(store.views.map((v) => v.date)).toEqual([
        '2026-11-01',
        '2026-10-31',
        '2026-10-01',
        '2026-09-30',
      ]);
      expect(store.views[0]).toMatchObject({ quantity: null, unitPrice: null }); // 數量 0 = 缺失
    });

    it('同一天：後建立的排前面', async () => {
      const fake = FULL();
      fake.insert('purchase_records', {
        id: 'r-1101-b',
        product: 'p-spring',
        purchase_date: '2026-11-01 00:00:00.000Z',
        quantity: 1,
        unit_price: 1,
      });
      const store = usePurchaseStore();
      await store.fetchRecords();
      expect(ids(store.records).slice(0, 2)).toEqual(['r-1101-b', 'r-1101']);
    });

    it('BDD：以分類「衛生紙」篩選 → 只有衛生紙的記錄（AC-8.5）', async () => {
      FULL();
      const store = usePurchaseStore();
      await store.fetchRecords({ categoryId: 'c-tissue' });
      expect(ids(store.records)).toEqual(['r-1031', 'r-0930']);
    });

    it('BDD：日期 10/1～10/31 → 只有 10/1 與 10/31 兩筆（含結束日當天，AC-8.6）', async () => {
      FULL();
      const store = usePurchaseStore();
      await store.fetchRecords({ startDate: '2026-10-01', endDate: '2026-10-31' });
      expect(ids(store.records)).toEqual(['r-1031', 'r-1001']);
    });

    it('只填開始日或只填結束日也可以', async () => {
      FULL();
      const store = usePurchaseStore();
      await store.fetchRecords({ startDate: '2026-10-31' });
      expect(ids(store.records)).toEqual(['r-1101', 'r-1031']);
      await store.fetchRecords({ endDate: '2026-10-01' });
      expect(ids(store.records)).toEqual(['r-1001', 'r-0930']);
    });

    it('分類與日期一起篩選', async () => {
      FULL();
      const store = usePurchaseStore();
      await store.fetchRecords({ categoryId: 'c-veg', endDate: '2026-10-31' });
      expect(ids(store.records)).toEqual(['r-1001']);
    });

    it('BDD：結束日期早於開始日期 → ERR-012（標在 endDate），不查詢（AC-8.7）', async () => {
      const fake = FULL();
      const err = await caught(
        usePurchaseStore().fetchRecords({ startDate: '2026-10-31', endDate: '2026-10-01' }),
      );
      expect(err).toBeInstanceOf(FieldsValidationError);
      expect((err as FieldsValidationError).fieldErrors).toEqual({ endDate: ERR.dateRangeInvalid });
      expect(fake.calls.some((c) => c.collection === 'purchase_records')).toBe(false);
    });

    it('開始與結束同一天可以', async () => {
      FULL();
      const store = usePurchaseStore();
      await store.fetchRecords({ startDate: '2026-10-31', endDate: '2026-10-31' });
      expect(ids(store.records)).toEqual(['r-1031']);
    });
  });

  describe('createRecord（AC-5.1、5.2、5.6、6.1、4.3）', () => {
    it('BDD：寫入前端算好的數量 1200 與單位均價 0.4992、新增者為登入的人、自訂欄位值（EAV）', async () => {
      const fake = FULL();
      const created = await usePurchaseStore().createRecord(NEW_TISSUE);
      const row = fake.rows('purchase_records').find((r) => r.id === created.id)!;
      expect(row).toMatchObject({
        product: 'p-spring',
        purchase_date: '2026-11-01 00:00:00.000Z',
        store: '全聯',
        total_price: 599,
        quantity: 1200,
        unit_price: 0.4992,
        user: 'u-pi',
      });
      const values = fake
        .rows('purchase_record_field_values')
        .filter((v) => v.purchase_record === created.id);
      expect(Object.fromEntries(values.map((v) => [v.custom_field, v.field_value]))).toEqual({
        'f-sheets': '100',
        'f-packs': '12',
        'f-ply': '2',
      });
    });

    it('新增的記錄放進 store.records 最前面', async () => {
      FULL();
      const store = usePurchaseStore();
      await store.fetchRecords();
      const created = await store.createRecord(NEW_TISSUE);
      expect(store.records[0]!.id).toBe(created.id);
    });

    it('沒有組成欄位的分類（蔬菜）：寫入直接輸入的數量，沒有欄位值', async () => {
      const fake = FULL();
      const created = await usePurchaseStore().createRecord({
        ...NEW_TISSUE,
        productId: 'p-cabbage',
        customFields: [],
        fieldValues: {},
        quantity: 3,
        totalPrice: 90,
      });
      expect(fake.rows('purchase_records').find((r) => r.id === created.id)).toMatchObject({
        quantity: 3,
        unit_price: 30,
      });
      expect(
        fake.rows('purchase_record_field_values').some((v) => v.purchase_record === created.id),
      ).toBe(false);
    });

    it('BDD：數量缺失 → 寫入 quantity 0、unit_price 0（讀取時轉成「無法計算」）', async () => {
      const fake = FULL();
      const created = await usePurchaseStore().createRecord({
        ...NEW_TISSUE,
        fieldValues: { 'f-packs': '12' },
      });
      expect(fake.rows('purchase_records').find((r) => r.id === created.id)).toMatchObject({
        quantity: 0,
        unit_price: 0,
      });
    });

    it('檢查不通過 → 丟出 FieldsValidationError（每個欄位的訊息），不寫入', async () => {
      const fake = FULL();
      const err = await caught(
        usePurchaseStore().createRecord({
          ...NEW_TISSUE,
          store: '',
          totalPrice: 0,
          purchaseDate: '2026-11-03',
        }),
      );
      expect(err).toBeInstanceOf(FieldsValidationError);
      expect((err as FieldsValidationError).fieldErrors).toEqual({
        store: ERR.required,
        totalPrice: ERR.totalPriceNotPositive,
        purchaseDate: ERR.purchaseDateInFuture,
      });
      expect(fake.calls.some((c) => c.method === 'create')).toBe(false);
    });

    it('自訂欄位值寫到一半失敗 → 刪掉剛建立的記錄（不留下半套資料），並丟出原本的錯誤', async () => {
      const fake = FULL();
      fake.failNext(0, { collection: 'purchase_record_field_values', method: 'create' });
      const before = fake.rows('purchase_records').length;
      const err = await caught(usePurchaseStore().createRecord(NEW_TISSUE));
      expect(apiErrorMessage(err)).toBe(ERR.networkError);
      expect(fake.rows('purchase_records')).toHaveLength(before);
      expect(fake.rows('purchase_record_field_values')).toHaveLength(3); // 只剩原本的 3 筆
    });

    it('資料庫擋下總價（min 0.01，例如 0.004）→ 轉成 ERR-010（K-6）', async () => {
      const fake = FULL();
      fake.failNext(400, {
        collection: 'purchase_records',
        method: 'create',
        data: { total_price: { code: 'validation_min_number_constraint' } },
      });
      const err = await caught(
        usePurchaseStore().createRecord({ ...NEW_TISSUE, totalPrice: 0.004 }),
      );
      expect((err as FieldsValidationError).fieldErrors).toEqual({
        totalPrice: ERR.totalPriceNotPositive,
      });
    });
  });

  describe('updateRecord（AC-5.7、6.1）', () => {
    const EDIT: PurchaseFormData = {
      ...NEW_TISSUE,
      purchaseDate: '2026-10-30',
      store: '家樂福',
      totalPrice: 629,
      fieldValues: { 'f-sheets': '110', 'f-packs': '12', 'f-ply': '' },
    };

    it('重新計算數量與單位均價；新增者維持原本的人（阿寶），不是編輯的人', async () => {
      const fake = FULL();
      await usePurchaseStore().updateRecord('r-1031', EDIT);
      expect(fake.rows('purchase_records').find((r) => r.id === 'r-1031')).toMatchObject({
        purchase_date: '2026-10-30 00:00:00.000Z',
        store: '家樂福',
        total_price: 629,
        quantity: 1320,
        unit_price: 0.4765,
        user: 'u-bao',
      });
    });

    it('同步自訂欄位值：改了的更新、清空的刪除、新填的新增', async () => {
      const fake = FULL();
      await usePurchaseStore().updateRecord('r-0930', {
        ...EDIT,
        fieldValues: { 'f-sheets': '100', 'f-packs': '10' },
      });
      await usePurchaseStore().updateRecord('r-1031', EDIT);
      const valuesOf = (record: string) =>
        Object.fromEntries(
          fake
            .rows('purchase_record_field_values')
            .filter((v) => v.purchase_record === record)
            .map((v) => [v.custom_field, v.field_value]),
        );
      expect(valuesOf('r-1031')).toEqual({ 'f-sheets': '110', 'f-packs': '12' }); // 層數清空 → 刪除
      expect(valuesOf('r-0930')).toEqual({ 'f-sheets': '100', 'f-packs': '10' }); // 原本沒有 → 新增
      expect(
        fake.rows('purchase_record_field_values').find((v) => v.id === 'v-sheets')!.field_value,
      ).toBe('110'); // 同一筆更新
    });

    it('換成沒有自訂欄位的商品 → 舊的欄位值全部刪除', async () => {
      const fake = FULL();
      await usePurchaseStore().updateRecord('r-1031', {
        ...EDIT,
        productId: 'p-cabbage',
        customFields: [],
        fieldValues: {},
        quantity: 2,
      });
      expect(
        fake.rows('purchase_record_field_values').filter((v) => v.purchase_record === 'r-1031'),
      ).toEqual([]);
      expect(fake.rows('purchase_records').find((r) => r.id === 'r-1031')).toMatchObject({
        product: 'p-cabbage',
        quantity: 2,
      });
    });

    it('值沒變的欄位不會多送一次更新', async () => {
      const fake = FULL();
      await usePurchaseStore().updateRecord('r-1031', {
        ...EDIT,
        fieldValues: { 'f-sheets': '100', 'f-packs': '12', 'f-ply': '2' },
      });
      expect(
        fake.calls.filter(
          (c) => c.collection === 'purchase_record_field_values' && c.method !== 'getFullList',
        ),
      ).toEqual([]);
    });

    it('store.records 裡的那筆跟著更新', async () => {
      FULL();
      const store = usePurchaseStore();
      await store.fetchRecords();
      await store.updateRecord('r-1031', EDIT);
      expect(store.getById('r-1031')).toMatchObject({ store: '家樂福', quantity: 1320 });
    });

    it('檢查不通過 → 不更新', async () => {
      const fake = FULL();
      const err = await caught(
        usePurchaseStore().updateRecord('r-1031', { ...EDIT, totalPrice: -1 }),
      );
      expect((err as FieldsValidationError).fieldErrors).toEqual({
        totalPrice: ERR.totalPriceNotPositive,
      });
      expect(fake.calls.some((c) => c.method === 'update')).toBe(false);
    });
  });

  describe('deleteRecord（AC-5.9）', () => {
    it('刪除記錄，連同自訂欄位值（資料庫 cascade）；store.records 也拿掉', async () => {
      const fake = FULL();
      const store = usePurchaseStore();
      await store.fetchRecords();
      await store.deleteRecord('r-1031');
      expect(ids(fake.rows('purchase_records'))).not.toContain('r-1031');
      expect(fake.rows('purchase_record_field_values')).toEqual([]);
      expect(ids(store.records)).not.toContain('r-1031');
    });

    it('連不上伺服器 → 丟出錯誤，store.records 不變', async () => {
      const fake = FULL();
      const store = usePurchaseStore();
      await store.fetchRecords();
      fake.failNext(0, { collection: 'purchase_records', method: 'delete' });
      expect(apiErrorMessage(await caught(store.deleteRecord('r-1031')))).toBe(ERR.networkError);
      expect(ids(store.records)).toContain('r-1031');
    });
  });
});

// task 8.4：新增購買記錄的「常去的地點」按鈕（使用者同意提案 1）
describe('fetchRecentStores', () => {
  const at = (n: number) => `2026-10-${String(n).padStart(2, '0')} 00:00:00.000Z`;

  it('以前用過的地點，最近用的在前、不重複、去掉前後空白，最多 6 個', async () => {
    const stores = [
      '全聯',
      ' 蝦皮 ',
      '全聯',
      '家樂福',
      '',
      '市場',
      '好市多',
      '屈臣氏',
      '康是美',
      '全聯',
    ];
    installFakePocketBase({
      purchase_records: stores.map((store, i) => ({
        id: `r${i}`,
        store,
        purchase_date: at(i + 1),
        created: at(i + 1),
      })),
    });
    const store = usePurchaseStore();
    await store.fetchRecentStores();
    expect(store.recentStores).toEqual(['全聯', '康是美', '屈臣氏', '好市多', '市場', '家樂福']);
  });

  it('還沒有記錄 → 空陣列', async () => {
    installFakePocketBase({});
    const store = usePurchaseStore();
    await store.fetchRecentStores();
    expect(store.recentStores).toEqual([]);
  });
});

// task 8.5：購買記錄詳情
describe('fetchRecord（購買記錄詳情）', () => {
  it('依 id 取得一筆記錄', async () => {
    seed();
    const store = usePurchaseStore();
    const record = await store.fetchRecord('r-new');
    expect(record).toMatchObject({ id: 'r-new', product: 'p-spring', total_price: 599 });
  });

  it('找不到（404，可能已被刪除）→ null，不丟錯誤', async () => {
    seed();
    const store = usePurchaseStore();
    expect(await store.fetchRecord('r-gone')).toBeNull();
  });

  it('連不上伺服器 → 丟出錯誤（畫面顯示 ERR-014，不是「找不到」）', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'purchase_records' });
    const store = usePurchaseStore();
    await expect(store.fetchRecord('r-new')).rejects.toSatisfy(
      (err) => apiErrorMessage(err) === ERR.networkError,
    );
  });
});

describe('fetchFieldValues（購買記錄的自訂欄位值）', () => {
  it('只取這一筆記錄的欄位值', async () => {
    installFakePocketBase({
      purchase_record_field_values: [
        { id: 'v1', purchase_record: 'r-new', custom_field: 'f-sheets', field_value: '100' },
        { id: 'v2', purchase_record: 'r-old', custom_field: 'f-sheets', field_value: '90' },
        { id: 'v3', purchase_record: 'r-new', custom_field: 'f-packs', field_value: '12' },
      ],
    });
    const store = usePurchaseStore();
    const values = await store.fetchFieldValues('r-new');
    expect(values.map((v) => [v.custom_field, v.field_value])).toEqual([
      ['f-sheets', '100'],
      ['f-packs', '12'],
    ]);
  });
});
