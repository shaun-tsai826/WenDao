// 使用者代表色與頭像文字（task 7.5）
// design.md「UI 設計規範 › 使用者代表色」：依使用者建立順序，第 1 位藍、第 2 位玫瑰（色相相差 60 度以上）；
// 頭像內放名稱的最後一個字（老皮 →「皮」）。
import type { CategoryTone } from './categoryTone';

export const PERSON_TONES: readonly CategoryTone[] = [
  { bg: '#dcf1ff', ink: '#0a3a80' }, // 第 1 位（同 --person-1-*）
  { bg: '#fde7ee', ink: '#7a1f44' }, // 第 2 位（同 --person-2-*）
];

/** 第 index 位使用者（從 0 開始，依建立順序）的顏色；找不到（-1）時用第 1 組 */
export function personTone(index: number): CategoryTone {
  return PERSON_TONES[Math.max(index, 0) % PERSON_TONES.length]!;
}

/** 頭像文字：名稱最後一個字（以「字」計算，不會切壞中文或 emoji）；沒有名稱時用「?」 */
export function personInitial(name: string): string {
  return Array.from(name.trim()).at(-1) ?? '?';
}
