// 消耗狀態分類（task 3.9，REQ-7 / AC-7.4、AC-7.5、AC-7.7、AC-7.12）
import { diffDays, localToday, toDateOnly, type DateOnly } from './dates';

/**
 * - unset：未設定消耗速率（STATUS-002「未設定消耗速率」）
 * - no_remaining：有速率但沒有剩餘數量（STATUS-007「未設定剩餘數量」）
 * - normal：距耗盡超過 7 天（不提醒）
 * - soon：距耗盡 0–7 天，含今天（STATUS-003「即將耗盡」）
 * - depleted：耗盡日已過（STATUS-004「已耗盡」）
 */
export type DepletionStatus = 'unset' | 'no_remaining' | 'normal' | 'soon' | 'depleted';

/** 「即將耗盡」的天數上限（含） */
export const SOON_DAYS = 7;

/**
 * @param depletionDate calculateDepletionDate 的結果
 * @param today 今天（'YYYY-MM-DD'）；不傳時用裝置本地日期。測試時可傳固定日期。
 * @example getDepletionStatus('2026-11-01', 1, 1, '2026-11-01') // 'soon'（今天耗盡）
 */
export function getDepletionStatus(
  depletionDate: string | null,
  consumptionRate: number | null,
  remainingQty: number | null,
  today: DateOnly = localToday(),
): DepletionStatus {
  if (!consumptionRate || consumptionRate <= 0) return 'unset';
  if (remainingQty === null) return 'no_remaining';
  const depletion = toDateOnly(depletionDate);
  if (depletion === null) return 'unset';

  const days = diffDays(today, depletion);
  if (days > SOON_DAYS) return 'normal';
  if (days >= 0) return 'soon'; // 0 ≤ days ≤ 7（含今天）
  return 'depleted'; // days < 0
}
