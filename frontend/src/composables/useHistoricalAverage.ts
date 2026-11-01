// 歷史均價（task 3.5，REQ-6 / AC-6.3）
import { round4 } from './dates';

/**
 * 歷史均價 = 所有「有效」單位均價的算術平均，四捨五入到小數 4 位。
 * null（無法計算的記錄，例如數量缺失）會被略過；全部都是 null 或沒有記錄時回傳 null。
 */
export function calculateHistoricalAverage(unitPrices: (number | null)[]): number | null {
  const valid = unitPrices.filter((p): p is number => p !== null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, p) => acc + p, 0);
  return round4(sum / valid.length);
}
