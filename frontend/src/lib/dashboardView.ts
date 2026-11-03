// 首頁（儀表板）的畫面用資料（task 9.1，REQ-7 / AC-7.4、7.5、7.6）
// design.md v4.3「首頁（儀表板）」：設計稿 Dash、Dash-Clear、Dash-First（使用者 2026-11-03 確認）
import type { DateOnly } from '@/composables/dates';
import type { ProductView } from '@/lib/productView';

/** 「庫存正常」最多列幾項（使用者決定） */
export const NORMAL_MAX = 5;

export interface Dashboard {
  /** 需要補貨：所有已耗盡與即將耗盡（AC-7.6），依傳入的順序（compareByUrgency） */
  reminders: ProductView[];
  depletedCount: number;
  soonCount: number;
  /** 追蹤中 = 算得出預計用完日的商品 */
  trackedCount: number;
  /** 庫存正常：依預計用完日早的在前，最多 NORMAL_MAX 項 */
  normal: ProductView[];
  /** 下一個預計用完的正常商品（沒有需要補貨時的說明用） */
  next: ProductView | null;
  /** 未設定消耗速率的商品數（沒有需要補貨時的提示用） */
  unsetCount: number;
}

/** @param views 已依急迫程度排序的商品（productStore.views()） */
export function dashboardOf(views: ProductView[]): Dashboard {
  const reminders = views.filter((v) => v.status === 'depleted' || v.status === 'soon');
  const normal = views.filter((v) => v.status === 'normal');
  return {
    reminders,
    depletedCount: reminders.filter((v) => v.status === 'depleted').length,
    soonCount: reminders.filter((v) => v.status === 'soon').length,
    trackedCount: views.filter((v) => v.depletionDate !== null).length,
    normal: normal.slice(0, NORMAL_MAX),
    next: normal[0] ?? null,
    unsetCount: views.filter((v) => v.status === 'unset').length,
  };
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 'YYYY-MM-DD' → 「11/3（二）」 */
export function formatDayWithWeekday(date: DateOnly): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return `${m}/${d}（${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}）`;
}
