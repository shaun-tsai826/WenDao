// 日曆日期工具（task 3）
//
// 本專案的日期只關心「哪一天」，不關心幾點幾分（design.md「日期處理規則」）：
// 資料庫存 `2026-10-02 00:00:00.000Z`，前 10 碼就是那一天，不做時區轉換。
// 所以這裡一律用 'YYYY-MM-DD' 字串，計算時當成 UTC 的日期，結果不受電腦時區影響。

/** 'YYYY-MM-DD' 格式的日期字串 */
export type DateOnly = string;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}/;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 取出日期部分。接受 'YYYY-MM-DD' 或資料庫格式 'YYYY-MM-DD 00:00:00.000Z'。
 * 空字串、null、格式不對都回傳 null（PocketBase 的 date 欄位沒填時是 ''）。
 */
export function toDateOnly(value: string | null | undefined): DateOnly | null {
  if (!value) return null;
  const m = value.match(DATE_ONLY);
  return m ? m[0] : null;
}

function toUtcMs(date: DateOnly): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): DateOnly {
  return new Date(ms).toISOString().slice(0, 10);
}

/** 加天數（可為負數） */
export function addDays(date: DateOnly, days: number): DateOnly {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** to − from 相差幾天（to 比較晚就是正數） */
export function diffDays(from: DateOnly, to: DateOnly): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** 使用者裝置的「本地今天」（design.md：以裝置本地日期為準，台灣為 Asia/Taipei） */
export function localToday(now: Date = new Date()): DateOnly {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 四捨五入到小數 4 位（單位均價、歷史均價共用） */
export function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
