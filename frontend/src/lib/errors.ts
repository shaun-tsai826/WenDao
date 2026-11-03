// 共用錯誤處理（task 6.1）
import { ClientResponseError } from 'pocketbase';
import { ERR } from '@/constants/messages';

/**
 * 使用者輸入不符合規則（空白、重複…）。message 就是要顯示給使用者的訊息（來自 messages.ts）。
 * store 丟出、頁面接住後直接顯示 err.message。
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/** 商品重複（ERR-007）：附上已存在的那一筆，讓畫面可以寫出「已有『Kleenex 舒潔衛生紙』」（task 7.4） */
export class DuplicateProductError extends ValidationError {
  constructor(public readonly existing: { brand: string; name: string }) {
    super(ERR.productDuplicate);
    this.name = 'DuplicateProductError';
  }
}

/**
 * 表單有多個欄位不符合規則（task 8.1，AC-5.3「在未填寫的欄位旁顯示」）。
 * fieldErrors：欄位 → 訊息，頁面把訊息顯示在各自的欄位旁；message 是第一個錯誤（給只顯示一行的地方用）。
 */
export class FieldsValidationError extends ValidationError {
  constructor(public readonly fieldErrors: Record<string, string>) {
    super(Object.values(fieldErrors)[0] ?? '');
    this.name = 'FieldsValidationError';
  }
}

/** PocketBase 回傳「某欄位不符合規則」（400 且該欄位有錯誤代碼，例如 total_price 低於 min） */
export function hasFieldError(err: unknown, field: string): boolean {
  if (!(err instanceof ClientResponseError) || err.status !== 400) return false;
  const data = err.response?.data as Record<string, unknown> | undefined;
  return Boolean(data?.[field]);
}

/**
 * 把任何錯誤轉成要顯示的訊息：
 * - ValidationError → 它自己的訊息
 * - 連不上伺服器（status 0，例如沒開 Tailscale）→ ERR-014
 * - 伺服器錯誤（5xx）→ ERR-013
 * - 其他 → fallback（每個情境自己決定，例如登入失敗用 ERR-001）
 */
export function apiErrorMessage(err: unknown, fallback: string = ERR.serverError): string {
  if (err instanceof ValidationError) return err.message;
  if (err instanceof ClientResponseError) {
    if (err.status === 0) return ERR.networkError;
    if (err.status >= 500) return ERR.serverError;
  }
  return fallback;
}

/** PocketBase 回傳「某欄位違反 UNIQUE」（例如兩人同時新增同名分類，被資料庫的 UNIQUE INDEX 擋下） */
export function isUniqueViolation(err: unknown, field: string): boolean {
  if (!(err instanceof ClientResponseError) || err.status !== 400) return false;
  const fieldError = (err.response?.data as Record<string, { code?: string }> | undefined)?.[field];
  return fieldError?.code === 'validation_not_unique';
}

/** PocketBase 拒絕刪除：還有其他資料關聯到這筆（Restrict） */
export function isRestrictedDelete(err: unknown): boolean {
  return err instanceof ClientResponseError && err.status === 400;
}
