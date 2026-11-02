// 商品的「畫面用資料」（task 7.1）
//
// 資料庫原始值 → 畫面使用的值，依 design.md「PocketBase 的 required 與 null 語意」：
// - consumption_rate 為 0 → 未設定（null）
// - remaining_updated_at 為空 → 剩餘數量未設定（null），此時 remaining_quantity 的 0 沒有意義
// 再用 task 3 的 composables 算出耗盡日期、狀態，以及 AC-7.14 的「久未更新」。
import { diffDays, localToday, toDateOnly, type DateOnly } from '@/composables/dates';
import { calculateDepletionDate } from '@/composables/useDepletionEstimate';
import { getDepletionStatus, type DepletionStatus } from '@/composables/useDepletionStatus';
import type { ProductRecord } from '@/types/models';

/** 剩餘數量超過幾天沒更新就提醒（AC-7.14：超過 30 天；剛好 30 天不提醒） */
export const STALE_DAYS = 30;

export interface ProductView {
  record: ProductRecord;
  /** 消耗速率，未設定為 null */
  rate: number | null;
  period: 'monthly' | 'weekly' | null;
  /** 剩餘數量，未設定為 null */
  remaining: number | null;
  /** 剩餘數量更新日（YYYY-MM-DD），未設定為 null */
  remainingUpdatedAt: DateOnly | null;
  /** 預計耗盡日（YYYY-MM-DD），無法計算為 null */
  depletionDate: DateOnly | null;
  /** 距今還有幾天（負數 = 已過幾天），無法計算為 null */
  daysLeft: number | null;
  status: DepletionStatus;
  /** 剩餘數量超過 30 天沒更新（AC-7.14） */
  stale: boolean;
}

export function toProductView(record: ProductRecord, today: DateOnly = localToday()): ProductView {
  const rate = record.consumption_rate > 0 ? record.consumption_rate : null;
  const period = record.consumption_period || null;
  const remainingUpdatedAt = toDateOnly(record.remaining_updated_at);
  const remaining = remainingUpdatedAt === null ? null : record.remaining_quantity;
  const depletionDate = calculateDepletionDate(remaining, remainingUpdatedAt, rate, period);
  return {
    record,
    rate,
    period,
    remaining,
    remainingUpdatedAt,
    depletionDate,
    daysLeft: depletionDate === null ? null : diffDays(today, depletionDate),
    status: getDepletionStatus(depletionDate, rate, remaining, today),
    stale: remainingUpdatedAt !== null && diffDays(remainingUpdatedAt, today) > STALE_DAYS,
  };
}

/** 列表排序的急迫程度（數字小的排前面）：已耗盡 → 即將耗盡 → 未設定剩餘數量 → 正常 → 未設定消耗速率 */
const URGENCY: Record<DepletionStatus, number> = {
  depleted: 0,
  soon: 1,
  no_remaining: 2,
  normal: 3,
  unset: 4,
};

/** 商品列表排序（design.md v3.2）：急迫程度 → 預計用完日（早的在前）→ 品牌與品名 */
export function compareByUrgency(a: ProductView, b: ProductView): number {
  return (
    URGENCY[a.status] - URGENCY[b.status] ||
    (a.depletionDate ?? '9999').localeCompare(b.depletionDate ?? '9999') ||
    `${a.record.brand} ${a.record.name}`.localeCompare(
      `${b.record.brand} ${b.record.name}`,
      'zh-Hant',
    )
  );
}

/**
 * AC-3.6 重複判斷用的正規化：全形轉半形（NFKC）、去前後空白、轉小寫。
 * 例：「 ＫＬＥＥＮＥＸ 」→「kleenex」
 */
export function normalizeForCompare(text: string): string {
  return text.normalize('NFKC').trim().toLowerCase();
}
