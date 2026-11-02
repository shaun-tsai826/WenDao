// 商品畫面用資料（task 7.1）：讀取轉換、狀態、久未更新（AC-7.14）、排序、AC-3.6 正規化
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  compareByUrgency,
  formatMonthDay,
  formatQuantity,
  normalizeForCompare,
  productSummary,
  toProductView,
  STALE_DAYS,
} from '@/lib/productView';
import type { ProductRecord } from '@/types/models';

const TODAY = '2026-11-01'; // BDD 的今天

function product(over: Partial<ProductRecord> = {}): ProductRecord {
  return {
    id: 'p',
    collectionId: 'products',
    collectionName: 'products',
    category: 'c',
    brand: '春風',
    name: '抽取式衛生紙',
    unit: '抽',
    consumption_unit: '包',
    consumption_rate: 0,
    consumption_period: '',
    remaining_quantity: 0,
    remaining_updated_at: '',
    consumption_note: '',
    ...over,
  };
}

describe('toProductView：資料庫原始值 → 畫面用資料', () => {
  it('消耗速率 0 → 未設定（unset）', () => {
    const v = toProductView(product(), TODAY);
    expect(v.rate).toBeNull();
    expect(v.status).toBe('unset');
    expect(v.depletionDate).toBeNull();
  });

  it('BDD：有速率但更新日為空 → 剩餘數量為 null、狀態 no_remaining（AC-7.12）', () => {
    const v = toProductView(product({ consumption_rate: 1, consumption_period: 'monthly' }), TODAY);
    expect(v.remaining).toBeNull();
    expect(v.status).toBe('no_remaining');
    expect(v.depletionDate).toBeNull();
  });

  it('有更新日時，剩 0 是真的剩 0（不是未設定）', () => {
    const v = toProductView(
      product({
        consumption_rate: 1,
        consumption_period: 'monthly',
        remaining_quantity: 0,
        remaining_updated_at: '2026-11-01 00:00:00.000Z',
      }),
      TODAY,
    );
    expect(v.remaining).toBe(0);
    expect(v.status).toBe('soon'); // 今天就用完
  });

  it('春風：剩 2 包、每月 4 包、10/24 更新 → 11/8、剩 7 天、即將耗盡', () => {
    const v = toProductView(
      product({
        consumption_rate: 4,
        consumption_period: 'monthly',
        remaining_quantity: 2,
        remaining_updated_at: '2026-10-24 00:00:00.000Z',
      }),
      TODAY,
    );
    expect(v.depletionDate).toBe('2026-11-08');
    expect(v.daysLeft).toBe(7);
    expect(v.status).toBe('soon');
  });
});

describe('久未更新（AC-7.14）', () => {
  const updatedDaysAgo = (days: number) => {
    const d = new Date(Date.parse(`${TODAY}T00:00:00Z`) - days * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return toProductView(
      product({
        consumption_rate: 1,
        consumption_period: 'monthly',
        remaining_quantity: 1,
        remaining_updated_at: `${d} 00:00:00.000Z`,
      }),
      TODAY,
    );
  };

  it('BDD：9/30 更新（距今 32 天）→ 久未更新', () => {
    expect(updatedDaysAgo(32).stale).toBe(true);
  });

  it('剛好 30 天 → 不提醒；31 天 → 提醒', () => {
    expect(STALE_DAYS).toBe(30);
    expect(updatedDaysAgo(30).stale).toBe(false);
    expect(updatedDaysAgo(31).stale).toBe(true);
  });

  it('沒有剩餘數量（更新日為空）→ 不算久未更新', () => {
    expect(toProductView(product(), TODAY).stale).toBe(false);
  });
});

describe('compareByUrgency：列表排序', () => {
  it('已耗盡 → 即將耗盡 → 未設定剩餘數量 → 正常 → 未設定消耗速率', () => {
    const at = (date: string, qty: number) => ({
      consumption_rate: 1,
      consumption_period: 'monthly' as const,
      remaining_quantity: qty,
      remaining_updated_at: `${date} 00:00:00.000Z`,
    });
    const views = [
      toProductView(product({ id: 'unset', brand: 'A' }), TODAY),
      toProductView(product({ id: 'normal', ...at('2026-10-20', 1) }), TODAY), // 11/19
      toProductView(
        product({ id: 'no-remaining', consumption_rate: 1, consumption_period: 'monthly' }),
        TODAY,
      ),
      toProductView(product({ id: 'soon', ...at('2026-10-05', 1) }), TODAY), // 11/4
      toProductView(product({ id: 'depleted', ...at('2026-09-01', 1) }), TODAY), // 10/1
    ];
    expect(views.sort(compareByUrgency).map((v) => v.record.id)).toEqual([
      'depleted',
      'soon',
      'no-remaining',
      'normal',
      'unset',
    ]);
  });

  it('同一級：預計用完日早的在前', () => {
    const soon = (id: string, date: string) =>
      toProductView(
        product({
          id,
          consumption_rate: 1,
          consumption_period: 'monthly',
          remaining_quantity: 1,
          remaining_updated_at: `${date} 00:00:00.000Z`,
        }),
        TODAY,
      );
    expect(
      [soon('later', '2026-10-08'), soon('earlier', '2026-10-03')]
        .sort(compareByUrgency)
        .map((v) => v.record.id),
    ).toEqual(['earlier', 'later']);
  });
});

describe('normalizeForCompare（AC-3.6）', () => {
  it.each([
    [' 春風 ', '春風'],
    ['ＫＬＥＥＮＥＸ', 'kleenex'],
    ['Kleenex', 'kleenex'],
    ['　舒潔衛生紙　', '舒潔衛生紙'],
  ])('「%s」→「%s」', (input, expected) => {
    expect(normalizeForCompare(input)).toBe(expected);
  });

  it('屬性：任意英數字串，全形版本與半形版本正規化後相同', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[A-Za-z0-9]{1,20}$/), (s) => {
        const fullWidth = [...s].map((c) => String.fromCharCode(c.charCodeAt(0) + 0xfee0)).join('');
        expect(normalizeForCompare(fullWidth)).toBe(normalizeForCompare(s));
      }),
    );
  });
});

// task 7.3：商品列表第二行（design.md v3.2 商品管理、設計稿 Prod-List；AC-7.3 剩餘數量以消耗單位計）
describe('formatQuantity / formatMonthDay', () => {
  it.each([
    [2, '2'],
    [0.5, '0.5'],
    [0.1 + 0.2, '0.3'], // 不顯示浮點誤差
    [1.234, '1.23'], // 最多 2 位小數
    [0, '0'],
  ])('formatQuantity(%s) → %s', (n, text) => expect(formatQuantity(n)).toBe(text));

  it.each([
    ['2026-11-08', '11/8'],
    ['2026-01-05', '1/5'],
    ['2026-12-31', '12/31'],
  ])('formatMonthDay(%s) → %s', (d, text) => expect(formatMonthDay(d)).toBe(text));
});

describe('productSummary：商品列表第二行', () => {
  const summary = (over: Partial<ProductRecord>) =>
    productSummary(toProductView(product(over), TODAY));
  const tracked = { consumption_rate: 1, consumption_period: 'monthly' as const };

  it('已耗盡：剩餘數量 · 用完日（設計稿 Prod-List；BDD：昨天 = 已耗盡）', () => {
    expect(
      summary({
        ...tracked,
        remaining_quantity: 1,
        remaining_updated_at: '2026-10-01 00:00:00.000Z',
      }),
    ).toBe('剩 1 包 · 10/31 已用完');
  });

  it('今天用完：顯示「今天」而不是「剩 0 天」', () => {
    expect(
      summary({
        ...tracked,
        remaining_quantity: 1,
        remaining_updated_at: '2026-10-02 00:00:00.000Z',
      }),
    ).toBe('剩 1 包 · 預計 11/1（今天）');
  });

  it('即將耗盡 / 正常：剩餘數量 · 預計日期（剩 N 天）', () => {
    expect(
      summary({
        consumption_rate: 1,
        consumption_period: 'weekly',
        remaining_quantity: 1,
        remaining_updated_at: '2026-10-30 00:00:00.000Z',
      }),
    ).toBe('剩 1 包 · 預計 11/6（剩 5 天）');
    expect(
      summary({
        ...tracked,
        remaining_quantity: 0.5,
        remaining_updated_at: '2026-10-28 00:00:00.000Z',
      }),
    ).toBe('剩 0.5 包 · 預計 11/12（剩 11 天）');
  });

  it('未設定剩餘數量：顯示消耗速率（每月 / 每週）', () => {
    expect(summary({ consumption_rate: 2, consumption_period: 'monthly' })).toBe('每月用 2 包');
    expect(summary({ consumption_rate: 0.5, consumption_period: 'weekly' })).toBe('每週用 0.5 包');
  });

  it('未設定消耗速率：顯示計價單位；有剩餘數量時一併顯示', () => {
    expect(summary({})).toBe('計價單位：抽');
    expect(
      summary({ remaining_quantity: 3, remaining_updated_at: '2026-10-30 00:00:00.000Z' }),
    ).toBe('剩 3 包 · 計價單位：抽');
  });

  it('沒有消耗單位時只顯示數字', () => {
    expect(
      summary({
        consumption_unit: '',
        remaining_quantity: 3,
        remaining_updated_at: '2026-10-30 00:00:00.000Z',
      }),
    ).toBe('剩 3 · 計價單位：抽');
  });
});
