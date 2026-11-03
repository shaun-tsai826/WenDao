// 購買記錄表單的檢查與計算（task 8.1，REQ-4 / AC-4.3、4.4、4.6，REQ-5 / AC-5.3、5.4、5.5、5.11，REQ-6 / AC-6.1、6.5）
// store 存檔前用、新增頁（task 8.4）也用來即時檢查與預覽
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ERR } from '@/constants/messages';
import {
  computePurchase,
  fieldValuesToSave,
  validatePurchase,
  type PurchaseFormData,
} from '@/lib/purchaseForm';

const TODAY = '2026-11-02';

// 衛生紙的 3 個自訂欄位：抽數(單包)、包數 算數量；層數 只記錄
const TISSUE_FIELDS = [
  { id: 'f-sheets', field_type: 'number' as const, is_quantity_component: true },
  { id: 'f-packs', field_type: 'number' as const, is_quantity_component: true },
  { id: 'f-ply', field_type: 'number' as const, is_quantity_component: false },
];

function form(over: Partial<PurchaseFormData> = {}): PurchaseFormData {
  return {
    productId: 'p-spring',
    purchaseDate: '2026-11-01',
    store: '全聯',
    totalPrice: 599,
    quantity: null,
    customFields: TISSUE_FIELDS,
    fieldValues: { 'f-sheets': '100', 'f-packs': '12', 'f-ply': '2' },
    ...over,
  };
}

describe('validatePurchase：必填（AC-5.3）', () => {
  it('全部填好 → 沒有錯誤', () => {
    expect(validatePurchase(form(), TODAY)).toEqual({});
  });

  it('BDD：未填必填欄位 → 每個欄位各自標 ERR-009（讓頁面顯示在欄位旁）', () => {
    expect(
      validatePurchase(
        form({ productId: '', purchaseDate: '', store: '  ', totalPrice: null }),
        TODAY,
      ),
    ).toEqual({
      productId: ERR.required,
      purchaseDate: ERR.required,
      store: ERR.required,
      totalPrice: ERR.required,
    });
  });

  it('日期格式不對（不是 YYYY-MM-DD 或不存在的日期）→ 當成沒填', () => {
    expect(validatePurchase(form({ purchaseDate: '2026/11/01' }), TODAY).purchaseDate).toBe(
      ERR.required,
    );
    expect(validatePurchase(form({ purchaseDate: '2026-02-30' }), TODAY).purchaseDate).toBe(
      ERR.required,
    );
  });

  it('總價不是數字（NaN）→ 當成沒填', () => {
    expect(validatePurchase(form({ totalPrice: Number.NaN }), TODAY).totalPrice).toBe(ERR.required);
  });
});

describe('validatePurchase：總價（AC-5.4、5.11）', () => {
  it.each([0, -1, -0.01])('BDD：總價 %s → 只有 ERR-010，不會同時出現 ERR-009', (price) => {
    expect(validatePurchase(form({ totalPrice: price }), TODAY)).toEqual({
      totalPrice: ERR.totalPriceNotPositive,
    });
  });

  it('0.01 可以', () => {
    expect(validatePurchase(form({ totalPrice: 0.01 }), TODAY)).toEqual({});
  });
});

describe('validatePurchase：購入日期（AC-5.5）', () => {
  it('BDD：未來日期（明天）→ ERR-011', () => {
    expect(validatePurchase(form({ purchaseDate: '2026-11-03' }), TODAY)).toEqual({
      purchaseDate: ERR.purchaseDateInFuture,
    });
  });

  it('今天可以', () => {
    expect(validatePurchase(form({ purchaseDate: TODAY }), TODAY)).toEqual({});
  });
});

describe('validatePurchase：數量組成欄位（AC-4.6）', () => {
  it.each(['0', '-3', 'abc'])('BDD：組成欄位填「%s」→ 該欄位 ERR-008', (value) => {
    expect(
      validatePurchase(form({ fieldValues: { 'f-sheets': value, 'f-packs': '12' } }), TODAY),
    ).toEqual({ 'f-sheets': ERR.quantityComponentNotPositive });
  });

  it('組成欄位沒填 → 不算錯（task 4 使用者確認：沒填算 0，單位均價顯示「無法計算」）', () => {
    expect(validatePurchase(form({ fieldValues: { 'f-packs': '12' } }), TODAY)).toEqual({});
  });

  it('只記錄的欄位填 0 → 不檢查', () => {
    expect(
      validatePurchase(
        form({ fieldValues: { 'f-sheets': '100', 'f-packs': '12', 'f-ply': '0' } }),
        TODAY,
      ),
    ).toEqual({});
  });
});

describe('computePurchase：數量與單位均價（AC-4.3、4.4、6.1、6.5）', () => {
  it('BDD：抽數 100 × 包數 12 = 1200（層數不參與），599 ÷ 1200 = 0.4992', () => {
    expect(computePurchase(form())).toEqual({ quantity: 1200, unitPrice: 0.4992 });
  });

  it('沒有組成欄位的分類（AC-4.4）：用直接輸入的數量', () => {
    expect(
      computePurchase(form({ customFields: [], fieldValues: {}, quantity: 3, totalPrice: 90 })),
    ).toEqual({
      quantity: 3,
      unitPrice: 30,
    });
  });

  it('BDD：數量缺失（null）→ 數量與單位均價都是 null（無法計算）', () => {
    expect(computePurchase(form({ customFields: [], fieldValues: {}, quantity: null }))).toEqual({
      quantity: null,
      unitPrice: null,
    });
  });

  it('組成欄位沒填 → 數量 0 → 視為缺失（null）', () => {
    expect(computePurchase(form({ fieldValues: { 'f-packs': '12' } }))).toEqual({
      quantity: null,
      unitPrice: null,
    });
  });

  it('直接輸入的數量為 0 或負數 → 視為缺失（資料庫 0 = 缺失）', () => {
    expect(
      computePurchase(form({ customFields: [], fieldValues: {}, quantity: 0 })).quantity,
    ).toBeNull();
    expect(
      computePurchase(form({ customFields: [], fieldValues: {}, quantity: -2 })).quantity,
    ).toBeNull();
  });

  it('組成欄位可以有小數（例如 1.5 公斤 × 2 袋 = 3）', () => {
    const fields = [
      { id: 'kg', field_type: 'number' as const, is_quantity_component: true },
      { id: 'bags', field_type: 'number' as const, is_quantity_component: true },
    ];
    expect(
      computePurchase(
        form({ customFields: fields, fieldValues: { kg: '1.5', bags: '2' }, totalPrice: 120 }),
      ),
    ).toEqual({ quantity: 3, unitPrice: 40 });
  });

  it('屬性：組成欄位都是正整數時，數量 = 乘積、單位均價 = 總價 ÷ 數量（4 位小數）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 100000 }),
        (sheets, packs, price) => {
          const r = computePurchase(
            form({
              fieldValues: { 'f-sheets': String(sheets), 'f-packs': String(packs) },
              totalPrice: price,
            }),
          );
          expect(r.quantity).toBe(sheets * packs);
          expect(r.unitPrice).toBe(Math.round((price / (sheets * packs)) * 10000) / 10000);
        },
      ),
    );
  });
});

describe('fieldValuesToSave：要寫進 purchase_record_field_values 的值', () => {
  it('只留這個分類的欄位、去掉前後空白、沒填的不寫', () => {
    expect(
      fieldValuesToSave(
        form({
          fieldValues: {
            'f-sheets': ' 100 ',
            'f-packs': '',
            'f-ply': '2',
            'f-other-category': '9',
          },
        }),
      ),
    ).toEqual({ 'f-sheets': '100', 'f-ply': '2' });
  });
});
