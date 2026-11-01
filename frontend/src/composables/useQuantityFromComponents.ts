// 數量組成欄位（task 3.3，REQ-4 / AC-4.3、AC-4.6）
import { ERR } from '@/constants/messages';
import type { CustomFieldRecord } from '@/types/models';

type ComponentField = Pick<CustomFieldRecord, 'id' | 'is_quantity_component'>;

/**
 * 總數量 = 所有「數量組成欄位」的值相乘（AC-4.3）。
 * - 分類沒有數量組成欄位 → 回傳 null，表單改成讓使用者直接輸入數量（AC-4.4）
 * - 某個數量組成欄位沒填 → 當成 0，總數量為 0（單位均價會顯示「無法計算」）
 * - 一般資訊欄位（例如「層數」）不參與計算
 *
 * @example 抽數(單包)=100、包數=12、層數=2 → 1200
 */
export function calculateQuantityFromComponents(
  fieldValues: Record<string, number>,
  customFields: ComponentField[],
): number | null {
  const componentFields = customFields.filter((f) => f.is_quantity_component);
  if (componentFields.length === 0) return null;
  return componentFields.reduce((acc, field) => acc * (fieldValues[field.id] ?? 0), 1);
}

/**
 * 檢查單一數量組成欄位：必須大於 0（AC-4.6）。
 * 通過回傳 null；不通過回傳 ERR-008「數量組成欄位必須大於 0」。
 */
export function validateQuantityComponent(value: number): string | null {
  return Number.isFinite(value) && value > 0 ? null : ERR.quantityComponentNotPositive;
}

/**
 * 檢查所有數量組成欄位，回傳「欄位 id → 錯誤訊息」；全部通過時回傳空物件。
 * 只檢查有填的值；沒填（必填）的檢查由表單負責（ERR-009）。
 */
export function validateQuantityComponents(
  fieldValues: Record<string, number>,
  customFields: ComponentField[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of customFields) {
    if (!field.is_quantity_component) continue;
    const value = fieldValues[field.id];
    if (value === undefined) continue;
    const error = validateQuantityComponent(value);
    if (error) errors[field.id] = error;
  }
  return errors;
}
