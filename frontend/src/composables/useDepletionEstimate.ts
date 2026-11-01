// 預計耗盡日期（task 3.7，REQ-7 / AC-7.2）
import { addDays, toDateOnly, type DateOnly } from './dates';
import type { ConsumptionPeriod } from '@/types/models';

/** 每個消耗週期的天數 */
export const PERIOD_DAYS = { monthly: 30, weekly: 7 } as const;

/**
 * 耗盡日期 = 剩餘數量更新日 + (剩餘數量 ÷ 消耗速率) × 週期天數（monthly=30、weekly=7）
 * 天數四捨五入到整天。
 *
 * 回傳 null 的情況（不計算耗盡日期）：
 * - 消耗速率未設定、為 0 或負數，或沒有消耗週期
 * - 剩餘數量為 null，或更新日為空（design.md：remaining_updated_at 為空 = 剩餘數量未設定）
 *
 * @param remainingUpdatedAt 'YYYY-MM-DD' 或資料庫值 'YYYY-MM-DD 00:00:00.000Z'
 * @example calculateDepletionDate(1, '2026-10-02', 1, 'monthly') // '2026-11-01'
 */
export function calculateDepletionDate(
  remainingQty: number | null,
  remainingUpdatedAt: string | null,
  consumptionRate: number | null,
  period: ConsumptionPeriod | null,
): DateOnly | null {
  if (!consumptionRate || consumptionRate <= 0 || !period) return null;
  const updatedAt = toDateOnly(remainingUpdatedAt);
  if (remainingQty === null || updatedAt === null) return null;

  const days = (remainingQty / consumptionRate) * PERIOD_DAYS[period];
  return addDays(updatedAt, Math.round(days));
}
