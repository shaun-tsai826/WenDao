// 首頁（儀表板）的畫面用資料（task 9.1，REQ-7 / AC-7.4、7.5、7.6；design.md v4.3「首頁（儀表板）」）
import { describe, it, expect } from 'vitest';
import { dashboardOf, formatDayWithWeekday, NORMAL_MAX } from '@/lib/dashboardView';
import { compareByUrgency, toProductView } from '@/lib/productView';
import type { ProductRecord } from '@/types/models';

const TODAY = '2026-11-03';

/** 每月用 30 → 一天 1 個：剩幾個就再幾天用完（從更新日起算） */
function product(id: string, over: Partial<ProductRecord> = {}): ProductRecord {
  return {
    id,
    collectionId: 'products',
    collectionName: 'products',
    category: 'c',
    brand: '品牌',
    name: id,
    unit: '個',
    consumption_unit: '個',
    consumption_rate: 30,
    consumption_period: 'monthly',
    remaining_quantity: 0,
    remaining_updated_at: '2026-11-01 00:00:00.000Z',
    consumption_note: '',
    ...over,
  };
}
const left = (id: string, remaining: number) => product(id, { remaining_quantity: remaining });
const views = (records: ProductRecord[]) =>
  records.map((r) => toProductView(r, TODAY)).sort(compareByUrgency);

describe('dashboardOf', () => {
  const all = views([
    left('n-19', 18), // 11/19 正常
    left('soon-8', 7), // 11/8 即將耗盡
    product('dep', { remaining_quantity: 0.5, remaining_updated_at: '2026-10-24 00:00:00.000Z' }), // 10/25 已耗盡
    left('soon-4', 3), // 11/4 即將耗盡
    left('n-12', 11), // 11/12 正常
    product('unset-1', { consumption_rate: 0, consumption_period: '' }),
    product('unset-2', { consumption_rate: 0, consumption_period: '' }),
    product('no-remaining', { remaining_updated_at: '' }),
  ]);

  it('BDD：需要補貨的清單 = 所有已耗盡與即將耗盡，已耗盡在前、再依預計用完日（AC-7.6）', () => {
    const d = dashboardOf(all);
    expect(d.reminders.map((v) => v.record.id)).toEqual(['dep', 'soon-4', 'soon-8']);
    expect(d.depletedCount).toBe(1);
    expect(d.soonCount).toBe(2);
  });

  it('追蹤中 = 算得出預計用完日的商品（不含未設定速率、未設定剩餘數量）', () => {
    expect(dashboardOf(all).trackedCount).toBe(5);
  });

  it('庫存正常：依預計用完日早的在前；下一個預計用完 = 第一個', () => {
    const d = dashboardOf(all);
    expect(d.normal.map((v) => v.record.id)).toEqual(['n-12', 'n-19']);
    expect(d.next?.record.id).toBe('n-12');
  });

  it(`庫存正常最多 ${NORMAL_MAX} 項（使用者決定）`, () => {
    // 剩 10 個 = 11/11（第 8 天，正常）；剩 9 個會是第 7 天（即將耗盡）
    const many = views([20, 10, 30, 12, 15, 25, 40].map((n) => left(`n-${n}`, n)));
    const d = dashboardOf(many);
    expect(NORMAL_MAX).toBe(5);
    expect(d.normal.map((v) => v.record.id)).toEqual(['n-10', 'n-12', 'n-15', 'n-20', 'n-25']);
  });

  it('未設定消耗速率的商品數（沒有需要補貨時的提示用）', () => {
    expect(dashboardOf(all).unsetCount).toBe(2);
  });

  it('BDD 邊界：今天用完、第 7 天 = 即將耗盡；第 8 天 = 正常；昨天 = 已耗盡（AC-7.4、7.5）', () => {
    const d = dashboardOf(
      views([
        left('today', 2), // 11/3
        left('day-7', 9), // 11/10
        left('day-8', 10), // 11/11
        left('yesterday', 1), // 11/2
      ]),
    );
    expect(d.reminders.map((v) => [v.record.id, v.status])).toEqual([
      ['yesterday', 'depleted'],
      ['today', 'soon'],
      ['day-7', 'soon'],
    ]);
    expect(d.normal.map((v) => v.record.id)).toEqual(['day-8']);
  });

  it('沒有商品 → 全部是空的、0', () => {
    expect(dashboardOf([])).toEqual({
      reminders: [],
      depletedCount: 0,
      soonCount: 0,
      trackedCount: 0,
      normal: [],
      next: null,
      unsetCount: 0,
    });
  });
});

describe('formatDayWithWeekday', () => {
  it('「11/3（二）」', () => {
    expect(formatDayWithWeekday('2026-11-03')).toBe('11/3（二）');
    expect(formatDayWithWeekday('2026-11-08')).toBe('11/8（日）');
  });
});
