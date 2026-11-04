// 價格趨勢圖的資料（task 10.1，REQ-8 / AC-8.8）
// design.md v4.4「價格趨勢圖」（設計稿 Prod-Trend、Prod-Trend-Empty，使用者 2026-11-04 確認）：
// - 只畫算得出單位均價的記錄（數量沒填的不畫），依購入日期由舊到新；同一天先建立的在前
// - 橫軸依實際日期遠近：x = 距第一筆的天數（數字軸，不另裝日期套件）
// - 少於 2 筆 → STATUS-005（使用者決定）
import { addDays, diffDays, round4, type DateOnly } from '@/composables/dates';
import { compareWithHistoricalAverage } from '@/composables/usePriceComparison';
import {
  formatPercent,
  formatShortDate,
  formatUnitPrice,
  historicalAverageOf,
  type PurchaseView,
} from '@/lib/purchaseView';

/** 至少幾筆才畫趨勢圖（使用者決定：1 個點畫不出趨勢） */
export const TREND_MIN_POINTS = 2;

export interface TrendPoint {
  /** 距第一筆的天數 */
  x: number;
  /** 單位均價 */
  y: number;
  /** 日期「10/20」（不是今年加上年份） */
  label: string;
  /** 提示框第一行「0.4992 元/抽」 */
  value: string;
  /** 提示框第二行「10/20 · 全聯 · 比均價高 1.1%」 */
  note: string;
}

export interface Trend {
  points: TrendPoint[];
  /** 歷史均價（AC-8.4，與商品詳情資訊塊相同）；沒有可計算的記錄為 null */
  average: number | null;
  /** 畫進圖的筆數 */
  count: number;
  /** 筆數夠不夠畫圖（>= TREND_MIN_POINTS） */
  enough: boolean;
  /** 圖的無障礙說明 */
  ariaLabel: string;
  /** 橫軸刻度：距第一筆幾天 → 日期文字 */
  xLabel: (days: number) => string;
  /** 橫軸範圍：左右各留一點，第一個與最後一個點不會被圖的邊界切掉 */
  xMin: number;
  xMax: number;
  /** 橫軸刻度位置：放在購買日上，最多 X_TICKS_MAX 個（含第一筆與最後一筆） */
  xTicks: number[];
}

/** 橫軸最多幾個刻度（手機寬度放得下的日期數） */
const X_TICKS_MAX = 4;

/** 從購買日（天數）中挑刻度：不重複、最多 X_TICKS_MAX 個、平均分布、含頭尾 */
function pickTicks(days: number[]): number[] {
  const unique = [...new Set(days)].sort((a, b) => a - b);
  if (unique.length <= X_TICKS_MAX) return unique;
  const first = unique[0]!;
  const last = unique.at(-1)!;
  const picked: number[] = [];
  for (let k = 0; k < X_TICKS_MAX; k++) {
    const target = first + ((last - first) * k) / (X_TICKS_MAX - 1);
    const nearest = unique
      .filter((d) => !picked.includes(d))
      .reduce((best, d) => (Math.abs(d - target) < Math.abs(best - target) ? d : best));
    picked.push(nearest);
  }
  return picked.sort((a, b) => a - b);
}

/** 提示框的比較文字：「比均價高 1.1%」「比均價低 7.3%」「和均價相同」「比均價高不到 0.1%」 */
export function comparisonShort(unitPrice: number, average: number): string {
  const kind = compareWithHistoricalAverage(unitPrice, average);
  if (kind === 'equal' || kind === 'na') return '和均價相同';
  const percent = formatPercent(round4(unitPrice - average), average).replace(/^[+−]/, '');
  return `比均價${kind === 'higher' ? '高' : '低'}${percent.startsWith('不到') ? '' : ' '}${percent}`;
}

/**
 * @param views 同一商品的購買記錄（purchaseStore.fetchByProduct，新到舊）
 * @param unit 計價單位
 */
export function trendOf(views: PurchaseView[], unit: string, today: DateOnly): Trend {
  const { average } = historicalAverageOf(views);
  // fetchByProduct 是「新到舊、同一天後建立的在前」，反過來就是舊到新、同一天先建立的在前
  const usable = [...views].reverse().filter((v) => v.unitPrice !== null && v.date);
  const first = usable[0]?.date ?? today;
  const xLabel = (days: number) => formatShortDate(addDays(first, Math.round(days)), today);

  const points = usable.map((v): TrendPoint => {
    const y = v.unitPrice!;
    const label = formatShortDate(v.date, today);
    const parts = [label, v.record.store.trim()].filter(Boolean);
    if (average !== null) parts.push(comparisonShort(y, average));
    return {
      x: diffDays(first, v.date),
      y,
      label,
      value: `${formatUnitPrice(y)} 元/${unit}`,
      note: parts.join(' · '),
    };
  });

  const lastX = points.at(-1)?.x ?? 0;
  // 左右各留範圍的 6%（至少 1 天），點的半徑才不會被切掉
  const margin = Math.max(1, Math.round(lastX * 0.06));

  const list = points.map((p) => `${p.label} ${formatUnitPrice(p.y)}`).join('、');
  const avgText = average === null ? '' : `；歷史均價 ${formatUnitPrice(average)} 元/${unit}`;
  return {
    points,
    average,
    count: points.length,
    enough: points.length >= TREND_MIN_POINTS,
    ariaLabel: `單位均價趨勢：${list} 元/${unit}${avgText}`,
    xLabel,
    xMin: -margin,
    xMax: lastX + margin,
    xTicks: pickTicks(points.map((p) => p.x)),
  };
}
