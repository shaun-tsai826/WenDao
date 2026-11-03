// 購買記錄的畫面用資料（task 7.5，REQ-6 / AC-6.4、AC-6.5，REQ-8 / AC-8.2、AC-8.4）
import { describe, it, expect } from 'vitest';
import {
  formatAmount,
  formatShortDate,
  formatUnitPrice,
  purchaseAmountLine,
  historicalAverageOf,
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
