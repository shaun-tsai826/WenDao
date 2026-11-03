// 購買記錄的「畫面用資料」（task 7.5）
//
// 資料庫原始值 → 畫面使用的值，依 design.md「PocketBase 的 required 與 null 語意」：
// - quantity 為 0 → 數量缺失（null），此時 unit_price 沒有意義（null，畫面顯示 STATUS-001「無法計算」）
import { STATUS } from '@/constants/messages';
import { calculateHistoricalAverage } from '@/composables/useHistoricalAverage';
import {
  compareWithHistoricalAverage,
  type PriceComparison,
} from '@/composables/usePriceComparison';
import { localToday, round4, toDateOnly, type DateOnly } from '@/composables/dates';
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

/**
 * 「1,200 抽 · 0.4992 元/抽」；數量缺失時「數量未填 · 無法計算」（STATUS-001）。
 * 購買記錄列表（task 8.3）與商品詳情的購買記錄（task 7.5）共用。
 * @param unit 商品的計價單位
 */
export function purchaseAmountLine(view: PurchaseView, unit: string): string {
  if (view.quantity === null || view.unitPrice === null) {
    return `數量未填 · ${STATUS.cannotCalculate}`;
  }
  return `${formatAmount(view.quantity)} ${unit} · ${formatUnitPrice(view.unitPrice)} 元/${unit}`;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 購入日期的完整寫法：「2026/10/31（六）」（購買記錄詳情，task 8.5） */
export function formatLongDate(date: DateOnly): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  // 用 UTC 算星期，不受裝置時區影響
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}/${m}/${d}（${weekday}）`;
}

/**
 * 新增時間（PocketBase 的 created，UTC）→ 裝置本地時間「10/31 21:03」；不是今年時加上年份。
 * 格式不對時回傳空字串。
 */
export function formatCreatedAt(created: string, today: DateOnly): string {
  const time = new Date(created.replace(' ', 'T'));
  if (!created || Number.isNaN(time.getTime())) return '';
  const hm = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
  return `${formatShortDate(localToday(time), today)} ${hm}`;
}

/** 價格比較的畫面文字（AC-8.9、8.10；設計稿 Pur-Detail） */
export interface PriceComparisonView {
  kind: PriceComparison;
  /** 「比歷史均價高」「比歷史均價低」「和歷史均價相同」或 STATUS-006「無法比較」 */
  title: string;
  /** 高 / 低：「每抽多 0.0056 元（+1.1%）」；無法比較：原因；相同：'' */
  detail: string;
  /** 「歷史均價 0.4936 元/抽 · 3 筆，含這一筆」；沒有歷史均價時 '' */
  basis: string;
}

const COMPARISON_TITLE: Record<PriceComparison, string> = {
  higher: '比歷史均價高',
  lower: '比歷史均價低',
  equal: '和歷史均價相同',
  na: STATUS.cannotCompare,
};

/** 差額占歷史均價的百分比：「+1.1%」「−7.3%」（用減號 −）；四捨五入後是 0 時寫「不到 0.1%」 */
function formatPercent(diff: number, average: number): string {
  const percent = Math.round((Math.abs(diff) / average) * 1000) / 10;
  if (percent === 0) return '不到 0.1%';
  return `${diff > 0 ? '+' : '−'}${percent.toFixed(1)}%`;
}

/**
 * 這筆購買記錄和商品歷史均價的比較（AC-8.9、8.10）。
 * 歷史均價依 AC-8.4 計算「所有」購買記錄（含這一筆），所以 history 要傳入同一商品的全部記錄。
 * @param unit 商品的計價單位
 */
export function priceComparisonOf(
  current: PurchaseView,
  history: PurchaseView[],
  unit: string,
): PriceComparisonView {
  const { average, count } = historicalAverageOf(history);
  const kind = compareWithHistoricalAverage(current.unitPrice, average);
  const counted =
    current.unitPrice !== null && history.some((v) => v.record.id === current.record.id);
  const basis =
    average === null
      ? ''
      : `歷史均價 ${formatUnitPrice(average)} 元/${unit} · ${count} 筆${counted ? '，含這一筆' : ''}`;

  let detail = '';
  if (kind === 'na') {
    detail = current.unitPrice === null ? '這筆沒有填數量' : '沒有可以比較的歷史均價';
  } else if (kind !== 'equal' && current.unitPrice !== null && average !== null) {
    const diff = round4(current.unitPrice - average);
    detail = `每${unit}${diff > 0 ? '多' : '少'} ${formatUnitPrice(Math.abs(diff))} 元（${formatPercent(diff, average)}）`;
  }
  return { kind, title: COMPARISON_TITLE[kind], detail, basis };
}
