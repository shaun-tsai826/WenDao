// 數字輸入欄位的整理與解析（task 7.6）
//
// 欄位用 <input inputmode="decimal">（手機跳出數字鍵盤），但仍可能打進其他字元或全形數字，
// 所以輸入時就整理成「數字＋一個小數點」，不另外需要「格式錯誤」的訊息。
// 剩餘數量要保留負號：BDD 情境「輸入 -5 並儲存 → 剩餘數量不可為負數」（ERR-015）由 store 判斷。

/**
 * @example sanitizeDecimal('１２．５') // '12.5'
 * @example sanitizeDecimal('-5', { allowNegative: true }) // '-5'
 */
export function sanitizeDecimal(raw: string, options: { allowNegative?: boolean } = {}): string {
  const text = raw.normalize('NFKC');
  const negative = options.allowNegative === true && /^\s*-/.test(text);
  const [whole = '', ...rest] = text.replace(/[^\d.]/g, '').split('.');
  const body = rest.length ? `${whole}.${rest.join('')}` : whole;
  return negative ? `-${body}` : body;
}

/** 文字 → 數字；沒有填（空白、只有「.」或「-」）回傳 null */
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim();
  if (!/\d/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
