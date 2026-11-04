// 價格趨勢圖的資料（task 10.1，REQ-8 / AC-8.8；design.md v4.4「價格趨勢圖」）
import { describe, it, expect } from 'vitest';
import { comparisonShort, trendOf, TREND_MIN_POINTS } from '@/lib/trendView';
import { toPurchaseView } from '@/lib/purchaseView';
import type { PurchaseRecordRecord } from '@/types/models';

const TODAY = '2026-11-04';

function record(
  id: string,
  date: string,
  unitPrice: number,
  over: Partial<PurchaseRecordRecord> = {},
): PurchaseRecordRecord {
  return {
    id,
    collectionId: 'purchase_records',
    collectionName: 'purchase_records',
    product: 'p',
    purchase_date: `${date} 00:00:00.000Z`,
    store: '全聯',
    total_price: 599,
    quantity: 1200,
    unit_price: unitPrice,
    user: 'u',
    ...over,
  };
}

// 設計稿 Prod-Trend：fetchByProduct 的順序（新到舊）
const VIEWS = [
  record('r-3', '2026-10-20', 0.4992),
  record('r-2', '2026-09-05', 0.4575, { store: '蝦皮' }),
  record('r-1', '2026-07-12', 0.5242, { store: '家樂福' }),
].map(toPurchaseView);

describe('trendOf', () => {
  it('BDD：依日期由舊到新，橫軸 = 距第一筆的天數（7/12 → 9/5 隔 55 天 → 10/20 再隔 45 天）', () => {
    const t = trendOf(VIEWS, '抽', TODAY);
    expect(t.points.map((p) => [p.x, p.y, p.label])).toEqual([
      [0, 0.5242, '7/12'],
      [55, 0.4575, '9/5'],
      [100, 0.4992, '10/20'],
    ]);
    expect(t.enough).toBe(true);
    expect(t.count).toBe(3);
  });

  it('歷史均價 = 所有可計算的記錄（與商品詳情資訊塊同一個值）', () => {
    expect(trendOf(VIEWS, '抽', TODAY).average).toBe(0.4936);
  });

  it('提示框：「0.4992 元/抽」與「10/20 · 全聯 · 比均價高 1.1%」', () => {
    const t = trendOf(VIEWS, '抽', TODAY);
    expect(t.points.map((p) => [p.value, p.note])).toEqual([
      ['0.5242 元/抽', '7/12 · 家樂福 · 比均價高 6.2%'],
      ['0.4575 元/抽', '9/5 · 蝦皮 · 比均價低 7.3%'],
      ['0.4992 元/抽', '10/20 · 全聯 · 比均價高 1.1%'],
    ]);
  });

  it('無障礙說明寫出每一點與歷史均價', () => {
    expect(trendOf(VIEWS, '抽', TODAY).ariaLabel).toBe(
      '單位均價趨勢：7/12 0.5242、9/5 0.4575、10/20 0.4992 元/抽；歷史均價 0.4936 元/抽',
    );
  });

  it('數量沒填的記錄不畫（也不算筆數）', () => {
    const views = [...VIEWS, toPurchaseView(record('r-x', '2026-10-30', 0, { quantity: 0 }))];
    const t = trendOf(views, '抽', TODAY);
    expect(t.points.map((p) => p.label)).toEqual(['7/12', '9/5', '10/20']);
    expect(t.count).toBe(3);
  });

  it('同一天多筆：各畫一點，先建立的在前', () => {
    const views = [
      record('b', '2026-10-01', 0.6, { created: '2026-10-01 10:00:00.000Z' }),
      record('a', '2026-10-01', 0.5, { created: '2026-10-01 09:00:00.000Z' }),
    ].map(toPurchaseView);
    expect(trendOf(views, '抽', TODAY).points.map((p) => [p.x, p.y])).toEqual([
      [0, 0.5],
      [0, 0.6],
    ]);
  });

  it(`少於 ${TREND_MIN_POINTS} 筆可計算的記錄 → enough 為 false（STATUS-005，使用者決定）`, () => {
    expect(TREND_MIN_POINTS).toBe(2);
    const one = trendOf([VIEWS[0]!], '抽', TODAY);
    expect(one.enough).toBe(false);
    expect(one.count).toBe(1);
    const none = trendOf(
      [toPurchaseView(record('r-x', '2026-10-30', 0, { quantity: 0 }))],
      '抽',
      TODAY,
    );
    expect(none.enough).toBe(false);
    expect(none.count).toBe(0);
    expect(trendOf([], '抽', TODAY)).toMatchObject({ enough: false, count: 0, average: null });
  });

  it('不是今年的記錄，日期加上年份', () => {
    const views = [record('n', '2026-01-05', 0.5), record('o', '2025-12-20', 0.4)].map(
      toPurchaseView,
    );
    expect(trendOf(views, '抽', TODAY).points.map((p) => p.label)).toEqual(['2025/12/20', '1/5']);
  });

  it('橫軸刻度：距第一筆幾天 → 日期（M/D）', () => {
    const t = trendOf(VIEWS, '抽', TODAY);
    expect([0, 55, 100, 30].map(t.xLabel)).toEqual(['7/12', '9/5', '10/20', '8/11']);
  });
});

describe('comparisonShort（提示框的比較文字）', () => {
  it('高 / 低 / 相同 / 差很少', () => {
    expect(comparisonShort(0.4992, 0.4936)).toBe('比均價高 1.1%');
    expect(comparisonShort(0.4575, 0.4936)).toBe('比均價低 7.3%');
    expect(comparisonShort(0.5, 0.5)).toBe('和均價相同');
    expect(comparisonShort(5.0001, 5)).toBe('比均價高不到 0.1%');
  });
});
