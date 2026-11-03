// 商品的「畫面用資料」（task 7.1）
//
// 資料庫原始值 → 畫面使用的值，依 design.md「PocketBase 的 required 與 null 語意」：
// - consumption_rate 為 0 → 未設定（null）
// - remaining_updated_at 為空 → 剩餘數量未設定（null），此時 remaining_quantity 的 0 沒有意義
// 再用 task 3 的 composables 算出耗盡日期、狀態，以及 AC-7.14 的「久未更新」。
import { diffDays, localToday, toDateOnly, type DateOnly } from '@/composables/dates';
import { calculateDepletionDate, PERIOD_DAYS } from '@/composables/useDepletionEstimate';
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

/** 數量顯示：最多 2 位小數、不顯示浮點誤差（0.1 + 0.2 → '0.3'） */
export function formatQuantity(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** 'YYYY-MM-DD' → 'M/D'（例：'2026-11-08' → '11/8'） */
export function formatMonthDay(date: DateOnly): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

const PERIOD_LABEL = { monthly: '每月', weekly: '每週' } as const;

/**
 * 商品列表第二行（task 7.3，design.md v3.2、設計稿 Prod-List）：
 * - 已耗盡：「剩 0.5 包 · 10/25 已用完」（依設計稿，不加已過天數，避免手機寬度斷成三行）
 * - 即將耗盡 / 正常：「剩 2 包 · 預計 11/8（剩 6 天）」，當天用完寫「（今天）」
 * - 未設定剩餘數量：「每月用 2 包」
 * - 未設定消耗速率：「計價單位：片」（有剩餘數量時前面加「剩 N 包 · 」）
 * - task 7.8：已耗盡 / 即將耗盡又久未更新時，開頭加「9/30 更新 · 」提醒數字可能不準
 *   （右側標籤只放一個，急迫狀態優先；使用者選擇）
 */
export function productSummary(view: ProductView): string {
  const urgent = view.status === 'depleted' || view.status === 'soon';
  const text = summaryBody(view);
  return view.stale && urgent && view.remainingUpdatedAt
    ? `${formatMonthDay(view.remainingUpdatedAt)} 更新 · ${text}`
    : text;
}

function summaryBody(view: ProductView): string {
  const unit = view.record.consumption_unit;
  const qty = (n: number) => (unit ? `${formatQuantity(n)} ${unit}` : formatQuantity(n));
  const remaining = view.remaining === null ? null : `剩 ${qty(view.remaining)}`;

  if (view.depletionDate !== null && view.daysLeft !== null && remaining !== null) {
    const date = formatMonthDay(view.depletionDate);
    if (view.daysLeft < 0) return `${remaining} · ${date} 已用完`;
    const left = view.daysLeft === 0 ? '今天' : `剩 ${view.daysLeft} 天`;
    return `${remaining} · 預計 ${date}（${left}）`;
  }
  if (view.status === 'no_remaining' && view.rate !== null && view.period) {
    return `${PERIOD_LABEL[view.period]}用 ${qty(view.rate)}`;
  }
  const unitText = `計價單位：${view.record.unit}`;
  return remaining === null ? unitText : `${remaining} · ${unitText}`;
}

/**
 * 更新消耗設定頁的即時預估（task 7.6，設計稿 Prod-Edit）。儲存時更新日會記為今天，所以用 today 當起點。
 * 缺少剩餘數量或消耗速率時回傳 null（畫面改顯示提示）。
 * @example depletionPreview(2, 4, 'monthly', '2026-11-02')
 *   // { headline: '預計 11/17 用完（剩 15 天）', formula: '2 ÷ 4 × 30 天 = 15 天' }
 */
export function depletionPreview(
  remaining: number | null,
  rate: number | null,
  period: 'monthly' | 'weekly',
  today: DateOnly,
): { headline: string; formula: string } | null {
  if (remaining === null || remaining < 0 || rate === null || rate <= 0) return null;
  const date = calculateDepletionDate(remaining, today, rate, period);
  if (date === null) return null;
  const days = diffDays(today, date);
  const exact = (remaining / rate) * PERIOD_DAYS[period];
  const equals = Math.abs(exact - days) < 1e-9 ? '=' : '≈';
  return {
    headline:
      days === 0
        ? `預計今天（${formatMonthDay(date)}）用完`
        : `預計 ${formatMonthDay(date)} 用完（剩 ${days} 天）`,
    formula: `${formatQuantity(remaining)} ÷ ${formatQuantity(rate)} × ${PERIOD_DAYS[period]} 天 ${equals} ${days} 天`,
  };
}
