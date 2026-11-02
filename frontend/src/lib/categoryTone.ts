// 分類圖塊的顏色與文字（task 6.2）
// design.md「UI 設計規範 › 分類圖塊」：依分類建立順序輪流使用 6 組顏色，第 7 個起重複；
// 圖塊內放分類名稱前 2 個字。

export interface CategoryTone {
  bg: string;
  ink: string;
}

export const CATEGORY_TONES: readonly CategoryTone[] = [
  { bg: '#dcf1ff', ink: '#0a3a80' }, // 藍
  { bg: '#def5f1', ink: '#0b4a42' }, // 青綠
  { bg: '#fdf0d9', ink: '#6b3d06' }, // 琥珀
  { bg: '#fde7ee', ink: '#7a1f44' }, // 玫瑰
  { bg: '#e3f4dc', ink: '#24501a' }, // 綠
  { bg: '#eef1f4', ink: '#3a3d40' }, // 灰
];

/** 第 index 個分類（從 0 開始，依建立順序）的顏色 */
export function categoryTone(index: number): CategoryTone {
  const i = ((index % CATEGORY_TONES.length) + CATEGORY_TONES.length) % CATEGORY_TONES.length;
  return CATEGORY_TONES[i]!;
}

/** 圖塊文字：名稱前 2 個字（以「字」計算，不會把中文或 emoji 切壞） */
export function categoryLabel(name: string): string {
  return Array.from(name.trim()).slice(0, 2).join('');
}
