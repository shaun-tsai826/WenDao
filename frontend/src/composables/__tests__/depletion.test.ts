// 預計耗盡日期與消耗狀態（task 3.7～3.10）
// Property 5、6（design.md「Correctness Properties」）＋ BDD「消耗狀態邊界」4 個情境
import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { addDays, diffDays, localToday, toDateOnly } from '@/composables/dates';
import { calculateDepletionDate, PERIOD_DAYS } from '@/composables/useDepletionEstimate';
import { getDepletionStatus, type DepletionStatus } from '@/composables/useDepletionStatus';

// 2020-01-01 ～ 2035-12-31 之間的任意一天（'YYYY-MM-DD'）
const anyDate = fc
  .date({
    min: new Date('2020-01-01T00:00:00Z'),
    max: new Date('2035-12-31T00:00:00Z'),
    noInvalidDate: true,
  })
  .map((d) => d.toISOString().slice(0, 10));
const period = fc.constantFrom('monthly' as const, 'weekly' as const);
const positive = fc.double({ min: 0.01, max: 1000, noNaN: true });

// 獨立計算的「標準答案」：直接用毫秒相加，不經過 dates.ts
const oracleAddDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

afterEach(() => {
  vi.useRealTimers();
});

describe('日期工具', () => {
  it('toDateOnly：接受資料庫格式，空值回傳 null', () => {
    expect(toDateOnly('2026-10-02 00:00:00.000Z')).toBe('2026-10-02');
    expect(toDateOnly('2026-10-02')).toBe('2026-10-02');
    expect(toDateOnly('')).toBeNull();
    expect(toDateOnly(null)).toBeNull();
    expect(toDateOnly('abc')).toBeNull();
  });

  it('addDays / diffDays 跨月、跨年、閏年', () => {
    expect(addDays('2026-10-02', 30)).toBe('2026-11-01');
    expect(addDays('2026-12-25', 10)).toBe('2027-01-04');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(diffDays('2026-11-01', '2026-10-31')).toBe(-1);
  });

  it('addDays 與 diffDays 互為反運算', () => {
    fc.assert(
      fc.property(anyDate, fc.integer({ min: -3650, max: 3650 }), (d, n) => {
        expect(diffDays(d, addDays(d, n))).toBe(n);
      }),
    );
  });

  it('localToday：使用裝置本地日期', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 1, 23, 30)); // 本地 2026-11-01 23:30
    expect(localToday()).toBe('2026-11-01');
  });
});

describe('calculateDepletionDate（AC-7.2）', () => {
  it('BDD 範例：剩 1 包、每月 1 包、10/02 更新 → 11/01', () => {
    expect(calculateDepletionDate(1, '2026-10-02', 1, 'monthly')).toBe('2026-11-01');
    expect(calculateDepletionDate(1, '2026-10-02 00:00:00.000Z', 1, 'monthly')).toBe('2026-11-01');
  });

  it('每週：剩 4 顆、每週 10 顆 → 4 ÷ 10 × 7 = 2.8 天，四捨五入為 3 天', () => {
    expect(calculateDepletionDate(4, '2026-11-01', 10, 'weekly')).toBe('2026-11-04');
  });

  it('剩 0：耗盡日就是更新日', () => {
    expect(calculateDepletionDate(0, '2026-11-01', 2, 'monthly')).toBe('2026-11-01');
  });

  it.each([
    ['速率未設定（null）', 1, '2026-10-02', null, 'monthly'],
    ['速率為 0（PocketBase 沒填存 0）', 1, '2026-10-02', 0, 'monthly'],
    ['速率為負數', 1, '2026-10-02', -1, 'monthly'],
    ['沒有週期', 1, '2026-10-02', 1, null],
    ['沒有週期（PocketBase 沒填存 ""）', 1, '2026-10-02', 1, ''],
    ['剩餘數量為 null', null, '2026-10-02', 1, 'monthly'],
    ['更新日為空（剩餘數量未設定）', 1, '', 1, 'monthly'],
  ] as const)('%s → null', (_label, qty, updated, rate, p) => {
    expect(calculateDepletionDate(qty, updated, rate, p)).toBeNull();
  });

  it('Property 5：耗盡日期 = 更新日 + round(剩餘 ÷ 速率 × 週期天數)', () => {
    fc.assert(
      fc.property(positive, anyDate, positive, period, (qty, updated, rate, p) => {
        const expected = oracleAddDays(updated, Math.round((qty / rate) * PERIOD_DAYS[p]));
        expect(calculateDepletionDate(qty, updated, rate, p)).toBe(expected);
      }),
    );
  });

  it('Property 5：剩餘數量或更新日為 null → null', () => {
    fc.assert(
      fc.property(
        fc.option(positive),
        fc.option(anyDate),
        positive,
        period,
        (qty, updated, rate, p) => {
          fc.pre(qty === null || updated === null);
          expect(calculateDepletionDate(qty, updated, rate, p)).toBeNull();
        },
      ),
    );
  });
});

describe('getDepletionStatus（AC-7.4、7.5、7.7、7.12）', () => {
  const TODAY = '2026-11-01'; // BDD.md 的「今天」

  // BDD.md「消耗狀態邊界」：速率 1 包/每月、剩 1 包，只改更新日
  it.each([
    ['2026-10-02', '今天耗盡', 'soon'],
    ['2026-10-09', '第 7 天', 'soon'],
    ['2026-10-10', '第 8 天', 'normal'],
    ['2026-10-01', '昨天', 'depleted'],
  ] as const)('BDD：更新日 %s（%s）→ %s', (updated, _label, status) => {
    const depletion = calculateDepletionDate(1, updated, 1, 'monthly');
    expect(getDepletionStatus(depletion, 1, 1, TODAY)).toBe(status);
  });

  it('未設定消耗速率 → unset（AC-7.7）', () => {
    expect(getDepletionStatus(null, null, 1, TODAY)).toBe('unset');
    expect(getDepletionStatus(null, 0, 1, TODAY)).toBe('unset');
  });

  it('有速率但沒有剩餘數量 → no_remaining（AC-7.12）', () => {
    expect(getDepletionStatus(null, 1, null, TODAY)).toBe('no_remaining');
  });

  it('不傳 today 時用裝置本地日期', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 1, 9, 0));
    expect(getDepletionStatus('2026-11-01', 1, 1)).toBe('soon');
    expect(getDepletionStatus('2026-10-31', 1, 1)).toBe('depleted');
  });

  it('Property 6：任意今天與距離天數，分類正確（> 7 正常、0～7 即將耗盡、< 0 已耗盡）', () => {
    fc.assert(
      fc.property(
        anyDate,
        fc.integer({ min: -400, max: 400 }),
        positive,
        positive,
        (today, days, rate, qty) => {
          const expected: DepletionStatus = days > 7 ? 'normal' : days >= 0 ? 'soon' : 'depleted';
          expect(getDepletionStatus(oracleAddDays(today, days), rate, qty, today)).toBe(expected);
        },
      ),
    );
  });

  it('Property 6：邊界天數 -1、0、7、8 一定被測到', () => {
    fc.assert(
      fc.property(anyDate, fc.constantFrom(-1, 0, 7, 8), (today, days) => {
        const expected = { [-1]: 'depleted', 0: 'soon', 7: 'soon', 8: 'normal' }[days];
        expect(getDepletionStatus(oracleAddDays(today, days), 1, 1, today)).toBe(expected);
      }),
    );
  });

  it('Property 6：速率未設定（null、0、負數）一律 unset，不論其他值', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, 0, -1, -0.5),
        fc.option(anyDate),
        fc.option(positive),
        anyDate,
        (rate, depletion, qty, today) => {
          expect(getDepletionStatus(depletion, rate, qty, today)).toBe('unset');
        },
      ),
    );
  });

  it('Property 6：有速率、剩餘數量為 null 一律 no_remaining', () => {
    fc.assert(
      fc.property(positive, fc.option(anyDate), anyDate, (rate, depletion, today) => {
        expect(getDepletionStatus(depletion, rate, null, today)).toBe('no_remaining');
      }),
    );
  });
});
