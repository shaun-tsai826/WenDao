// 單位均價（task 3.1，REQ-6 / AC-6.1、AC-6.5）
import { round4 } from './dates';

/**
 * 單位均價 = 總價 ÷ 數量，四捨五入到小數 4 位。
 * 數量為 0 或 null 時回傳 null（畫面顯示 STATUS-001「無法計算」）。
 *
 * @example calculateUnitPrice(599, 1200) // 0.4992（元/抽）
 */
export function calculateUnitPrice(totalPrice: number, quantity: number | null): number | null {
  if (quantity === null || quantity === 0) return null;
  return round4(totalPrice / quantity);
}
