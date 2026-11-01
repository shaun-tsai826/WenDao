// 單位均價、數量組成、歷史均價、價格比較（task 3.1～3.6、3.11、3.12）
// Property 1～4、7（design.md「Correctness Properties」）
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateUnitPrice } from '@/composables/useUnitPrice';
import {
  calculateQuantityFromComponents,
  validateQuantityComponent,
  validateQuantityComponents,
} from '@/composables/useQuantityFromComponents';
import { calculateHistoricalAverage } from '@/composables/useHistoricalAverage';
import { compareWithHistoricalAverage } from '@/composables/usePriceComparison';
import { ERR } from '@/constants/messages';

// 金額：0.01～100,000 元，以「分」為單位產生，避免無意義的超長小數
const money = fc.integer({ min: 1, max: 10_000_000 }).map((cents) => cents / 100);
// 4 位小數的單位均價：0.0001～1,000
const unitPrice = fc.integer({ min: 1, max: 10_000_000 }).map((n) => n / 10000);

describe('calculateUnitPrice（AC-6.1、AC-6.5）', () => {
  it('規格範例：599 元 ÷ 1,200 抽 = 0.4992 元/抽', () => {
    expect(calculateUnitPrice(599, 1200)).toBe(0.4992);
  });

  it('數量為 0 或 null → null（無法計算）', () => {
    expect(calculateUnitPrice(599, 0)).toBeNull();
    expect(calculateUnitPrice(599, null)).toBeNull();
  });

  it('Property 1：任意總價 > 0、數量 > 0，結果 = 總價 ÷ 數量四捨五入到 4 位小數', () => {
    fc.assert(
      fc.property(money, fc.integer({ min: 1, max: 100_000 }), (total, qty) => {
        const result = calculateUnitPrice(total, qty);
        expect(result).not.toBeNull();
        // 與真正的商相差不超過半個萬分位
        expect(Math.abs(result! - total / qty)).toBeLessThanOrEqual(0.00005 + 1e-12);
        // 最多 4 位小數
        expect(Math.abs(result! * 10000 - Math.round(result! * 10000))).toBeLessThan(1e-6);
      }),
    );
  });

  it('Property 1：任意總價，數量為 0 或 null 一律回傳 null', () => {
    fc.assert(
      fc.property(money, fc.constantFrom(0, null), (total, qty) => {
        expect(calculateUnitPrice(total, qty)).toBeNull();
      }),
    );
  });
});

describe('calculateQuantityFromComponents（AC-4.3、AC-4.4）', () => {
  const tissueFields = [
    { id: 'sheets', is_quantity_component: true }, // 抽數(單包)
    { id: 'packs', is_quantity_component: true }, // 包數
    { id: 'ply', is_quantity_component: false }, // 層數（一般資訊）
  ];

  it('規格範例：100 抽 × 12 包 = 1,200，層數不參與', () => {
    expect(calculateQuantityFromComponents({ sheets: 100, packs: 12, ply: 2 }, tissueFields)).toBe(
      1200,
    );
  });

  it('沒有數量組成欄位（例如蔬菜）→ null，改用直接輸入（AC-4.4）', () => {
    expect(calculateQuantityFromComponents({}, [])).toBeNull();
    expect(
      calculateQuantityFromComponents({ ply: 2 }, [{ id: 'ply', is_quantity_component: false }]),
    ).toBeNull();
  });

  it('數量組成欄位沒填 → 總數量為 0', () => {
    expect(calculateQuantityFromComponents({ sheets: 100 }, tissueFields)).toBe(0);
  });

  it('Property 2：任意正整數組合，總數量 = 所有數量組成欄位的乘積，一般資訊欄位不影響', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 4 }),
        fc.array(fc.integer({ min: -1000, max: 1000 }), { maxLength: 3 }),
        (components, infos) => {
          const fields = [
            ...components.map((_, i) => ({ id: `c${i}`, is_quantity_component: true })),
            ...infos.map((_, i) => ({ id: `i${i}`, is_quantity_component: false })),
          ];
          const values: Record<string, number> = {};
          components.forEach((v, i) => (values[`c${i}`] = v));
          infos.forEach((v, i) => (values[`i${i}`] = v));
          expect(calculateQuantityFromComponents(values, fields)).toBe(
            components.reduce((a, b) => a * b, 1),
          );
        },
      ),
    );
  });
});

describe('數量組成欄位驗證（AC-4.6）', () => {
  it('Property 3：任意 ≤ 0 的值都被拒絕，顯示 ERR-008', () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer({ max: 0 }), fc.double({ max: 0, noNaN: true })), (v) => {
        expect(validateQuantityComponent(v)).toBe(ERR.quantityComponentNotPositive);
        expect(ERR.quantityComponentNotPositive).toBe('數量組成欄位必須大於 0');
      }),
    );
  });

  it('Property 3：任意 > 0 的值都通過', () => {
    fc.assert(
      fc.property(fc.double({ min: Number.MIN_VALUE, max: 1e9, noNaN: true }), (v) => {
        expect(validateQuantityComponent(v)).toBeNull();
      }),
    );
  });

  it('NaN、Infinity 不算有效數字', () => {
    expect(validateQuantityComponent(Number.NaN)).toBe(ERR.quantityComponentNotPositive);
    expect(validateQuantityComponent(Number.POSITIVE_INFINITY)).toBe(
      ERR.quantityComponentNotPositive,
    );
  });

  it('整張表單：只回報數量組成欄位中 ≤ 0 的那幾格，一般資訊欄位與未填欄位不檢查', () => {
    const fields = [
      { id: 'sheets', is_quantity_component: true },
      { id: 'packs', is_quantity_component: true },
      { id: 'ply', is_quantity_component: false },
      { id: 'extra', is_quantity_component: true },
    ];
    expect(validateQuantityComponents({ sheets: 0, packs: 12, ply: -1 }, fields)).toEqual({
      sheets: ERR.quantityComponentNotPositive,
    });
    expect(validateQuantityComponents({ sheets: 100, packs: 12 }, fields)).toEqual({});
  });
});

describe('calculateHistoricalAverage（AC-6.3）', () => {
  it('範例：0.5、0.4992、0.52 的平均 = 0.5064', () => {
    expect(calculateHistoricalAverage([0.5, 0.4992, 0.52])).toBe(0.5064);
  });

  it('略過 null（無法計算的記錄）；全部 null 或沒有記錄 → null', () => {
    expect(calculateHistoricalAverage([0.5, null, 0.4])).toBe(0.45);
    expect(calculateHistoricalAverage([null, null])).toBeNull();
    expect(calculateHistoricalAverage([])).toBeNull();
  });

  it('Property 4：任意一組有效單位均價，結果 = 算術平均（4 位小數），且介於最小值與最大值之間', () => {
    fc.assert(
      fc.property(fc.array(unitPrice, { minLength: 1, maxLength: 30 }), (prices) => {
        const avg = calculateHistoricalAverage(prices)!;
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        expect(Math.abs(avg - mean)).toBeLessThanOrEqual(0.00005 + 1e-9);
        expect(avg).toBeGreaterThanOrEqual(Math.min(...prices));
        expect(avg).toBeLessThanOrEqual(Math.max(...prices));
      }),
    );
  });

  it('Property 4：混入任意個 null，不影響結果', () => {
    fc.assert(
      fc.property(
        fc.array(unitPrice, { minLength: 1, maxLength: 20 }),
        fc.nat({ max: 10 }),
        (prices, nulls) => {
          const mixed = [...prices, ...Array<null>(nulls).fill(null)];
          expect(calculateHistoricalAverage(mixed)).toBe(calculateHistoricalAverage(prices));
        },
      ),
    );
  });
});

describe('compareWithHistoricalAverage（AC-8.9、AC-8.10）', () => {
  it('範例', () => {
    expect(compareWithHistoricalAverage(0.52, 0.5)).toBe('higher');
    expect(compareWithHistoricalAverage(0.4992, 0.5)).toBe('lower');
    expect(compareWithHistoricalAverage(0.5, 0.5)).toBe('equal');
  });

  it('Property 7：任意兩個數字，結果與大小關係一致', () => {
    fc.assert(
      fc.property(unitPrice, unitPrice, (price, avg) => {
        const expected = price > avg ? 'higher' : price < avg ? 'lower' : 'equal';
        expect(compareWithHistoricalAverage(price, avg)).toBe(expected);
      }),
    );
  });

  it('Property 7：相同的值一律 equal', () => {
    fc.assert(
      fc.property(unitPrice, (p) => {
        expect(compareWithHistoricalAverage(p, p)).toBe('equal');
      }),
    );
  });

  it('Property 7：任一方為 null → na（無法比較）', () => {
    fc.assert(
      fc.property(fc.option(unitPrice), fc.option(unitPrice), (price, avg) => {
        fc.pre(price === null || avg === null);
        expect(compareWithHistoricalAverage(price, avg)).toBe('na');
      }),
    );
  });
});
