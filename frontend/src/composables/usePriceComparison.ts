// 當次單位均價與歷史均價比較（task 3.11，REQ-8 / AC-8.9、AC-8.10）

/** higher「高於」、lower「低於」、equal「等於」、na：無法比較（STATUS-006） */
export type PriceComparison = 'higher' | 'lower' | 'equal' | 'na';

/** 任一方為 null（無法計算）時回傳 'na' */
export function compareWithHistoricalAverage(
  unitPrice: number | null,
  historicalAverage: number | null,
): PriceComparison {
  if (unitPrice === null || historicalAverage === null) return 'na';
  if (unitPrice > historicalAverage) return 'higher';
  if (unitPrice < historicalAverage) return 'lower';
  return 'equal';
}
