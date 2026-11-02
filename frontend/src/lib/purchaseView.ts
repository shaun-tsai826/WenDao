// 購買記錄的「畫面用資料」（task 7.5）
//
// 資料庫原始值 → 畫面使用的值，依 design.md「PocketBase 的 required 與 null 語意」：
// - quantity 為 0 → 數量缺失（null），此時 unit_price 沒有意義（null，畫面顯示 STATUS-001「無法計算」）
import { calculateHistoricalAverage } from '@/composables/useHistoricalAverage';
import { toDateOnly, type DateOnly } from '@/composables/dates';
import type { PurchaseRecordRecord } from '@/types/models';

export interface PurchaseView {
  record: PurchaseRecordRecord;
  /** 購入日期（YYYY-MM-DD） */
  date: DateOnly;
  /** 數量，缺失為 null */
  quantity: number | null;
  /** 單位均價，無法計算為 null */
  unitPrice: number | null;
}

export function toPurchaseView(record: PurchaseRecordRecord): PurchaseView {
  const quantity = record.quantity > 0 ? record.quantity : null;
  return {
    record,
    date: toDateOnly(record.purchase_date) ?? '',
    quantity,
    unitPrice: quantity === null ? null : record.unit_price,
  };
}

/**
 * 歷史均價（AC-6.3、6.4、8.4）：所有可計算單位均價的平均；count = 實際用到幾筆。
 * 沒有可計算的記錄時 average 為 null（畫面顯示 STATUS-001「無法計算」）。
 */
export function historicalAverageOf(views: PurchaseView[]): {
  average: number | null;
  count: number;
} {
  return {
    average: calculateHistoricalAverage(views.map((v) => v.unitPrice)),
    count: views.filter((v) => v.unitPrice !== null).length,
  };
}

/** 金額、數量加上千分位（1200 → '1,200'；小數最多 4 位，與單位均價一致） */
export function formatAmount(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

/** 今年的日期寫「10/20」，其他年份寫「2025/7/12」 */
export function formatShortDate(date: DateOnly, today: DateOnly): string {
  const [y, m, d] = date.split('-');
  const md = `${Number(m)}/${Number(d)}`;
  return y === today.slice(0, 4) ? md : `${y}/${md}`;
}

/** 單位均價：固定 4 位小數（與計算時的四捨五入一致；BDD 寫作 0.5000） */
export function formatUnitPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}
