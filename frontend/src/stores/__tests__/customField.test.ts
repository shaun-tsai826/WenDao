// useCustomFieldStore（task 6.5，REQ-4 / AC-4.1、4.2、4.7～4.11；對應 BDD「REQ-4」）
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCustomFieldStore } from '@/stores/customField';
import { apiErrorMessage } from '@/lib/errors';
import { ERR } from '@/constants/messages';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';

// BDD 背景：衛生紙有 3 個欄位；「抽數(單包)」已被 1 筆購買記錄使用，「層數」未被使用
const seed = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    custom_fields: [
      {
        id: 'f-sheets',
        category: 'c-tissue',
        field_name: '抽數(單包)',
        field_type: 'number',
        is_quantity_component: true,
        display_order: 1,
      },
      {
        id: 'f-packs',
        category: 'c-tissue',
        field_name: '包數',
        field_type: 'number',
        is_quantity_component: true,
        display_order: 2,
      },
      {
        id: 'f-ply',
        category: 'c-tissue',
        field_name: '層數',
        field_type: 'number',
        is_quantity_component: false,
        display_order: 3,
      },
    ],
    purchase_record_field_values: [
      { id: 'v1', purchase_record: 'r1', custom_field: 'f-sheets', field_value: '100' },
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

async function loaded() {
  const store = useCustomFieldStore();
  await store.fetchFields('c-tissue');
  return store;
}

const NUMBER_QTY = { field_type: 'number' as const, is_quantity_component: true };
const TEXT_INFO = { field_type: 'text' as const, is_quantity_component: false };

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('fetchFields', () => {
  it('依顯示順序取得分類的欄位，並算出各欄位被幾筆記錄使用', async () => {
    seed();
    const store = await loaded();
    expect(store.fields.map((f) => f.field_name)).toEqual(['抽數(單包)', '包數', '層數']);
    expect(store.usageOf('f-sheets')).toBe(1);
    expect(store.usageOf('f-ply')).toBe(0);
  });

  it('其他分類的欄位不會混進來', async () => {
    const fake = seed();
    fake.insert('custom_fields', {
      id: 'f-origin',
      category: 'c-veg',
      field_name: '產地',
      display_order: 1,
    });
    const store = await loaded();
    expect(store.fields).toHaveLength(3);
  });
});

describe('createField（AC-4.1、4.2、4.7）', () => {
  it('新增「產地」（文字、只記錄），排在最後', async () => {
    const fake = seed();
    const store = await loaded();
    const created = await store.createField('c-tissue', { field_name: ' 產地 ', ...TEXT_INFO });
    expect(created).toMatchObject({
      field_name: '產地',
      field_type: 'text',
      is_quantity_component: false,
      display_order: 4,
    });
    expect(store.fields.at(-1)?.field_name).toBe('產地');
    expect(fake.rows('custom_fields')).toHaveLength(4);
  });

  it('可標記為數量組成欄位（AC-4.2）', async () => {
    seed();
    const store = await loaded();
    const created = await store.createField('c-tissue', { field_name: '捲數', ...NUMBER_QTY });
    expect(created.is_quantity_component).toBe(true);
  });

  it('BDD：同分類已有「包數」→ ERR-017（AC-4.7）', async () => {
    const fake = seed();
    const store = await loaded();
    expect(
      await errorOf(store.createField('c-tissue', { field_name: '包數', ...NUMBER_QTY })),
    ).toBe('此欄位名稱已存在於此分類');
    expect(fake.rows('custom_fields')).toHaveLength(3);
  });

  it('不同分類可以有同名欄位', async () => {
    seed();
    const store = useCustomFieldStore();
    await store.fetchFields('c-veg');
    await expect(
      store.createField('c-veg', { field_name: '包數', ...NUMBER_QTY }),
    ).resolves.toMatchObject({
      field_name: '包數',
    });
  });

  it('名稱空白 → ERR-009', async () => {
    seed();
    const store = await loaded();
    expect(await errorOf(store.createField('c-tissue', { field_name: '  ', ...TEXT_INFO }))).toBe(
      ERR.required,
    );
  });
});

describe('updateField（AC-4.10、4.11）', () => {
  it('BDD：未使用的「層數」改名為「厚度」→ 允許（AC-4.11）', async () => {
    const fake = seed();
    const store = await loaded();
    await store.updateField('f-ply', {
      field_name: '厚度',
      field_type: 'number',
      is_quantity_component: false,
    });
    expect(store.getById('f-ply')?.field_name).toBe('厚度');
    expect(fake.rows('custom_fields').find((f) => f.id === 'f-ply')?.field_name).toBe('厚度');
  });

  it('已被使用的欄位仍可改名（AC-4.11）', async () => {
    seed();
    const store = await loaded();
    await expect(
      store.updateField('f-sheets', { field_name: '每包抽數', ...NUMBER_QTY }),
    ).resolves.toMatchObject({ field_name: '每包抽數' });
  });

  it.each([
    ['型別 number → text', { field_type: 'text' as const, is_quantity_component: true }],
    ['取消數量組成', { field_type: 'number' as const, is_quantity_component: false }],
  ])('BDD：已被使用的「抽數(單包)」%s → ERR-019（AC-4.10）', async (_label, settings) => {
    const fake = seed();
    const store = await loaded();
    expect(
      await errorOf(store.updateField('f-sheets', { field_name: '抽數(單包)', ...settings })),
    ).toBe('此欄位已有購買記錄使用，無法修改型別或計算設定');
    expect(fake.rows('custom_fields').find((f) => f.id === 'f-sheets')).toMatchObject(NUMBER_QTY);
  });

  it('打開編輯後另一人才新增記錄：存檔時重新查，一樣擋下 ERR-019', async () => {
    const fake = seed();
    const store = await loaded();
    expect(store.usageOf('f-ply')).toBe(0);
    fake.insert('purchase_record_field_values', {
      id: 'v2',
      purchase_record: 'r2',
      custom_field: 'f-ply',
      field_value: '2',
    });
    expect(await errorOf(store.updateField('f-ply', { field_name: '層數', ...TEXT_INFO }))).toBe(
      ERR.fieldInUseCannotChangeType,
    );
    expect(store.usageOf('f-ply')).toBe(1);
  });

  it('改成同分類其他欄位的名稱 → ERR-017', async () => {
    seed();
    const store = await loaded();
    expect(
      await errorOf(
        store.updateField('f-ply', {
          field_name: '包數',
          field_type: 'number',
          is_quantity_component: false,
        }),
      ),
    ).toBe(ERR.fieldNameDuplicate);
  });
});

describe('moveField（AC-4.11 顯示順序）', () => {
  it('BDD：「層數」上移兩次 → 變成第 1 個', async () => {
    const fake = seed();
    const store = await loaded();
    await store.moveField('f-ply', -1);
    await store.moveField('f-ply', -1);
    expect(store.fields.map((f) => f.field_name)).toEqual(['層數', '抽數(單包)', '包數']);
    const order = (id: string) =>
      fake.rows('custom_fields').find((f) => f.id === id)?.display_order;
    expect([order('f-ply'), order('f-sheets'), order('f-packs')]).toEqual([1, 2, 3]);
  });

  it('第一個再上移、最後一個再下移：不動', async () => {
    seed();
    const store = await loaded();
    await store.moveField('f-sheets', -1);
    await store.moveField('f-ply', 1);
    expect(store.fields.map((f) => f.id)).toEqual(['f-sheets', 'f-packs', 'f-ply']);
  });

  it('舊資料順序都是 0：移動後整理成 1、2、3', async () => {
    const fake = installFakePocketBase({
      custom_fields: [
        { id: 'a', category: 'c', field_name: 'A', display_order: 0 },
        { id: 'b', category: 'c', field_name: 'B', display_order: 0 },
      ],
    });
    const store = useCustomFieldStore();
    await store.fetchFields('c');
    await store.moveField('b', -1);
    expect(store.fields.map((f) => f.id)).toEqual(['b', 'a']);
    expect(fake.rows('custom_fields').map((f) => [f.id, f.display_order])).toEqual([
      ['a', 2],
      ['b', 1],
    ]);
  });
});

describe('deleteField（AC-4.8、4.9）', () => {
  it('BDD：刪除未使用的「層數」成功（AC-4.9）', async () => {
    const fake = seed();
    const store = await loaded();
    await store.deleteField('f-ply');
    expect(store.fields.map((f) => f.id)).toEqual(['f-sheets', 'f-packs']);
    expect(fake.rows('custom_fields')).toHaveLength(2);
  });

  it('BDD：刪除已被使用的「抽數(單包)」→ ERR-018，不送出刪除（AC-4.8）', async () => {
    const fake = seed();
    const store = await loaded();
    expect(await errorOf(store.deleteField('f-sheets'))).toBe('此欄位已有購買記錄使用，無法刪除');
    expect(fake.calls.some((c) => c.collection === 'custom_fields' && c.method === 'delete')).toBe(
      false,
    );
    expect(fake.rows('custom_fields')).toHaveLength(3);
  });

  it('資料庫 Restrict 擋下（查完後另一人剛好使用）→ 一樣顯示 ERR-018', async () => {
    const fake = seed();
    const store = await loaded();
    fake.failNext(400, { collection: 'custom_fields', method: 'delete' });
    expect(await errorOf(store.deleteField('f-ply'))).toBe(ERR.fieldInUseCannotDelete);
    expect(store.fields).toHaveLength(3);
  });
});

// task 8.4：新增購買記錄表單只需要欄位本身（不查使用狀況、不改 store 的狀態）
describe('listFields', () => {
  it('回傳分類的欄位（依顯示順序），不查使用狀況、不改 store 的 fields', async () => {
    const fake = installFakePocketBase({
      custom_fields: [
        { id: 'b', category: 'c', field_name: '包數', display_order: 2 },
        { id: 'a', category: 'c', field_name: '抽數', display_order: 1 },
        { id: 'x', category: 'other', field_name: '別的', display_order: 1 },
      ],
    });
    const store = useCustomFieldStore();
    const fields = await store.listFields('c');
    expect(fields.map((f) => f.id)).toEqual(['a', 'b']);
    expect(store.fields).toEqual([]);
    expect(fake.calls.some((c) => c.collection === 'purchase_record_field_values')).toBe(false);
  });
});
