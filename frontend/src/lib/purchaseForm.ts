// 購買記錄表單的檢查與計算（task 8.1）
//
// 純函數：store 存檔前用來檢查與算出要寫入的數量、單位均價；
// 新增 / 編輯頁（task 8.4、8.6）也用同一套函數做即時檢查與預覽，規則只寫一次。
//
// 規則（REQ-4、REQ-5、REQ-6）：
// - 商品、購入日期、購買地點、總價必填 → ERR-009（每個欄位各自回報，頁面顯示在欄位旁，AC-5.3）
// - 總價 0 或負數 → 只回報 ERR-010，不同時出現 ERR-009（AC-5.4、5.11）
// - 購入日期晚於今天 → ERR-011（AC-5.5）
// - 數量組成欄位有填但不大於 0 → 該欄位 ERR-008（AC-4.6）；沒填不算錯，數量當 0（task 4 使用者確認）
// - 數量 = 組成欄位相乘（AC-4.3）；分類沒有組成欄位時用直接輸入的數量（AC-4.4）
// - 數量為 0 / 負數 / 沒填 → 缺失（null），單位均價也是 null（畫面顯示「無法計算」，AC-6.5）
import { ERR } from '@/constants/messages';
import { calculateUnitPrice } from '@/composables/useUnitPrice';
import {
  calculateQuantityFromComponents,
  validateQuantityComponent,
} from '@/composables/useQuantityFromComponents';
import type { DateOnly } from '@/composables/dates';
import type { CustomFieldRecord } from '@/types/models';

/** 表單要用到的自訂欄位定義（商品所屬分類的欄位） */
export type PurchaseField = Pick<CustomFieldRecord, 'id' | 'field_type' | 'is_quantity_component'>;

/** 新增 / 編輯購買記錄的表單資料 */
export interface PurchaseFormData {
  productId: string;
  /** 購入日期 'YYYY-MM-DD' */
  purchaseDate: string;
  store: string;
  /** 總價；沒填為 null */
  totalPrice: number | null;
  /** 分類沒有數量組成欄位時直接輸入的數量；沒填為 null */
  quantity: number | null;
  /** 商品所屬分類的自訂欄位 */
  customFields: PurchaseField[];
  /** 自訂欄位 id → 輸入的文字 */
  fieldValues: Record<string, string>;
}

/** 欄位 → 錯誤訊息。key 是 productId / purchaseDate / store / totalPrice，或自訂欄位的 id */
export type PurchaseErrors = Record<string, string>;

/** 是不是真的存在的 'YYYY-MM-DD'（2026-02-30 不算） */
function isValidDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

/** 自訂欄位有沒有填（去掉空白後不是空字串） */
const filled = (value: string | undefined): value is string => (value ?? '').trim() !== '';

export function validatePurchase(data: PurchaseFormData, today: DateOnly): PurchaseErrors {
  const errors: PurchaseErrors = {};
  if (!data.productId) errors.productId = ERR.required;

  if (!isValidDate(data.purchaseDate)) errors.purchaseDate = ERR.required;
  else if (data.purchaseDate > today) errors.purchaseDate = ERR.purchaseDateInFuture;

  if (!data.store.trim()) errors.store = ERR.required;

  if (data.totalPrice === null || Number.isNaN(data.totalPrice)) errors.totalPrice = ERR.required;
  else if (!(data.totalPrice > 0)) errors.totalPrice = ERR.totalPriceNotPositive;

  for (const field of data.customFields) {
    const value = data.fieldValues[field.id];
    if (!field.is_quantity_component || !filled(value)) continue;
    const error = validateQuantityComponent(Number(value.trim()));
    if (error) errors[field.id] = error;
  }
  return errors;
}

/** 算出要寫入的數量與單位均價；缺失時都是 null（寫入資料庫時存 0） */
export function computePurchase(data: PurchaseFormData): {
  quantity: number | null;
  unitPrice: number | null;
} {
  const hasComponents = data.customFields.some((f) => f.is_quantity_component);
  let quantity: number | null;
  if (hasComponents) {
    const values: Record<string, number> = {};
    for (const field of data.customFields) {
      const value = data.fieldValues[field.id];
      if (field.is_quantity_component && filled(value)) values[field.id] = Number(value.trim());
    }
    quantity = calculateQuantityFromComponents(values, data.customFields);
  } else {
    quantity = data.quantity;
  }
  if (quantity === null || !Number.isFinite(quantity) || quantity <= 0) {
    return { quantity: null, unitPrice: null };
  }
  return { quantity, unitPrice: calculateUnitPrice(data.totalPrice ?? 0, quantity) };
}

/** 要寫進 purchase_record_field_values 的值：只留這個分類的欄位、去掉前後空白、沒填的不寫 */
export function fieldValuesToSave(data: PurchaseFormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of data.customFields) {
    const value = data.fieldValues[field.id];
    if (filled(value)) result[field.id] = value.trim();
  }
  return result;
}
