// 購買記錄的畫面用資料（task 7.5，REQ-6 / AC-6.4、AC-6.5，REQ-8 / AC-8.2、AC-8.4）
import { describe, it, expect } from 'vitest';
import {
  formatAmount,
  formatCreatedAt,
  formatLongDate,
  formatShortDate,
  formatUnitPrice,
  purchaseAmountLine,
  historicalAverageOf,
  priceComparisonOf,
  toPurchaseView,
} from '@/lib/purchaseView';
import { personInitial, personTone } from '@/lib/personTone';
import { STATUS } from '@/constants/messages';
import type { PurchaseRecordRecord } from '@/types/models';

function record(over: Partial<PurchaseRecordRecord> = {}): PurchaseRecordRecord {
  return {
    id: 'r',
    collectionId: 'purchase_records',
    collectionName: 'purchase_records',
    product: 'p',
    purchase_date: '2026-10-20 00:00:00.000Z',
    store: '全聯',
    total_price: 599,
    quantity: 1200,
    unit_price: 0.4992,
    user: 'u1',
    ...over,
  };
}

describe('toPurchaseView：資料庫原始值 → 畫面用資料', () => {
  it('日期轉成 YYYY-MM-DD，數量與單位均價照原值', () => {
    const v = toPurchaseView(record());
    expect(v).toMatchObject({ date: '2026-10-20', quantity: 1200, unitPrice: 0.4992 });
  });

  it('數量 0（缺失）→ 數量與單位均價都是 null（AC-6.5 無法計算）', () => {
    const v = toPurchaseView(record({ quantity: 0, unit_price: 0 }));
    expect(v.quantity).toBeNull();
    expect(v.unitPrice).toBeNull();
  });
});

describe('historicalAverageOf（AC-6.4、AC-8.4）', () => {
  it('BDD：0.4992 與 0.5008 → 0.5000，用了 2 筆', () => {
    const views = [record({ unit_price: 0.4992 }), record({ unit_price: 0.5008 })].map(
      toPurchaseView,
    );
    expect(historicalAverageOf(views)).toEqual({ average: 0.5, count: 2 });
  });

  it('略過無法計算的記錄；全部無法計算或沒有記錄 → null、0 筆', () => {
    const views = [record({ unit_price: 0.5 }), record({ quantity: 0, unit_price: 0 })].map(
      toPurchaseView,
    );
    expect(historicalAverageOf(views)).toEqual({ average: 0.5, count: 1 });
    expect(historicalAverageOf([toPurchaseView(record({ quantity: 0 }))])).toEqual({
      average: null,
      count: 0,
    });
    expect(historicalAverageOf([])).toEqual({ average: null, count: 0 });
  });
});

describe('formatAmount / formatShortDate', () => {
  it.each([
    [599, '599'],
    [1200, '1,200'],
    [0.4992, '0.4992'],
    [12345.5, '12,345.5'],
  ])('formatAmount(%s) → %s', (n, text) => expect(formatAmount(n)).toBe(text));

  it.each([
    [0.5, '0.5000'], // BDD：歷史均價 = 0.5000
    [0.4992, '0.4992'],
    [12.5, '12.5000'],
    [1234.5678, '1,234.5678'],
  ])('formatUnitPrice(%s) → %s（固定 4 位小數）', (n, text) =>
    expect(formatUnitPrice(n)).toBe(text),
  );

  it('今年只寫月/日，其他年份加上年份', () => {
    expect(formatShortDate('2026-10-20', '2026-11-02')).toBe('10/20');
    expect(formatShortDate('2025-07-12', '2026-11-02')).toBe('2025/7/12');
  });
});

describe('personTone / personInitial（design.md 使用者代表色）', () => {
  it('第 1 位藍、第 2 位玫瑰，之後輪流', () => {
    expect(personTone(0)).toEqual({ bg: '#dcf1ff', ink: '#0a3a80' });
    expect(personTone(1)).toEqual({ bg: '#fde7ee', ink: '#7a1f44' });
    expect(personTone(2)).toEqual(personTone(0));
  });

  it('頭像放名稱最後一個字（老皮 → 皮）；找不到人時用「?」', () => {
    expect(personInitial('老皮')).toBe('皮');
    expect(personInitial('Alice')).toBe('e');
    expect(personInitial('')).toBe('?');
  });
});

// task 8.3：購買記錄列表與商品詳情共用的「數量 · 單位均價」那一行
describe('purchaseAmountLine', () => {
  it('「1,200 抽 · 0.4992 元/抽」（單位用商品的計價單位）', () => {
    expect(purchaseAmountLine(toPurchaseView(record()), '抽')).toBe('1,200 抽 · 0.4992 元/抽');
  });

  it('數量缺失 →「數量未填 · 無法計算」（STATUS-001）', () => {
    expect(purchaseAmountLine(toPurchaseView(record({ quantity: 0, unit_price: 0 })), '抽')).toBe(
      `數量未填 · ${STATUS.cannotCalculate}`,
    );
  });

  it('單位均價固定 4 位小數（30 → 30.0000）', () => {
    expect(purchaseAmountLine(toPurchaseView(record({ quantity: 2, unit_price: 30 })), '顆')).toBe(
      '2 顆 · 30.0000 元/顆',
    );
  });
});

describe('formatLongDate / formatCreatedAt（購買記錄詳情，task 8.5）', () => {
  it('購入日期寫完整年月日與星期：2026/10/31（六）', () => {
    expect(formatLongDate('2026-10-31')).toBe('2026/10/31（六）');
    expect(formatLongDate('2026-11-02')).toBe('2026/11/2（一）');
  });

  it('新增時間轉成裝置本地時間（Asia/Taipei）；今年只寫月/日', () => {
    // 資料庫存 UTC：13:03Z = 台北 21:03
    expect(formatCreatedAt('2026-10-31 13:03:00.000Z', '2026-11-03')).toBe('10/31 21:03');
    // UTC 跨日：10/31 17:05Z = 台北 11/1 01:05
    expect(formatCreatedAt('2026-10-31 17:05:00.000Z', '2026-11-03')).toBe('11/1 01:05');
    expect(formatCreatedAt('2025-12-31 01:00:00.000Z', '2026-11-03')).toBe('2025/12/31 09:00');
  });

  it('新增時間格式不對時回傳空字串', () => {
    expect(formatCreatedAt('', '2026-11-03')).toBe('');
  });
});

describe('priceComparisonOf（AC-8.9、8.10，設計稿 Pur-Detail）', () => {
  const view = (id: string, unitPrice: number, quantity = 1200) =>
    toPurchaseView(record({ id, unit_price: unitPrice, quantity }));
  // 設計稿：0.4992、0.4575、0.5242 → 歷史均價 0.4936
  const history = [view('r-1', 0.4992), view('r-2', 0.4575), view('r-3', 0.5242)];

  it('高於：每單位差額、百分比、歷史均價用了幾筆（含這一筆）', () => {
    expect(priceComparisonOf(history[0]!, history, '抽')).toEqual({
      kind: 'higher',
      title: '比歷史均價高',
      detail: '每抽多 0.0056 元（+1.1%）',
      basis: '歷史均價 0.4936 元/抽 · 3 筆，含這一筆',
    });
  });

  it('低於：用減號（−）寫百分比', () => {
    expect(priceComparisonOf(history[1]!, history, '抽')).toMatchObject({
      kind: 'lower',
      title: '比歷史均價低',
      detail: '每抽少 0.0361 元（−7.3%）',
    });
  });

  it('相同：只有這一筆時，歷史均價就是它自己', () => {
    const only = [view('r-1', 0.4992)];
    expect(priceComparisonOf(only[0]!, only, '抽')).toEqual({
      kind: 'equal',
      title: '和歷史均價相同',
      detail: '',
      basis: '歷史均價 0.4992 元/抽 · 1 筆，含這一筆',
    });
  });

  it('差很少時百分比寫「不到 0.1%」，不寫 +0.0%', () => {
    const list = [view('a', 5.0001), view('b', 4.9999), view('c', 5)];
    expect(priceComparisonOf(list[0]!, list, '顆').detail).toBe('每顆多 0.0001 元（不到 0.1%）');
  });

  it('這筆沒有填數量 → STATUS-006 無法比較，寫出原因；其他筆的均價照樣列出（不含這一筆）', () => {
    const missing = view('r-4', 0, 0);
    expect(priceComparisonOf(missing, [...history, missing], '抽')).toEqual({
      kind: 'na',
      title: STATUS.cannotCompare,
      detail: '這筆沒有填數量',
      basis: '歷史均價 0.4936 元/抽 · 3 筆',
    });
  });

  it('所有記錄都沒有數量 → 無法比較，不顯示歷史均價', () => {
    const missing = view('r-4', 0, 0);
    expect(priceComparisonOf(missing, [missing], '抽')).toEqual({
      kind: 'na',
      title: STATUS.cannotCompare,
      detail: '這筆沒有填數量',
      basis: '',
    });
  });
});
