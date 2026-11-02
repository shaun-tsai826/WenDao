// 訊息常數（task 2.7）
// 對照 design.md「提示訊息與錯誤訊息集中表」。所有提示、錯誤、確認、狀態文字都從這裡取用，
// 不要在頁面裡直接寫字串（個人守則：錯誤訊息、提示文字集中管理）。
//
// 用法：
//   import { MSG, ERR } from '@/constants/messages';
//   $q.notify({ type: 'positive', message: MSG.categoryCreated });
//
// 每個訊息後面的註解是規格編號與對應需求，修改文字時請同步更新 design.md 與 requirements.md。

/** 成功訊息 */
export const MSG = {
  categoryCreated: '分類建立成功', // MSG-001 · REQ-2.2
  categoryDeleted: '分類刪除成功', // MSG-002 · REQ-2.6
  productCreated: '商品建立成功', // MSG-003 · REQ-3.1（設計補充）
  recordCreated: '記錄新增成功', // MSG-004 · REQ-5.2
  recordUpdated: '記錄更新成功', // MSG-005 · REQ-5.7
  recordDeleted: '記錄刪除成功', // MSG-006 · REQ-5.9
  productUpdated: '商品更新成功', // MSG-007 · REQ-7.1（設計補充）
  categoryUpdated: '分類更新成功', // MSG-008 · REQ-2.7
  fieldDeleted: '欄位刪除成功', // MSG-009 · REQ-4.9
  fieldUpdated: '欄位更新成功', // MSG-010 · REQ-4.11
} as const;

/** 錯誤訊息 */
export const ERR = {
  loginFailed: '帳號或密碼錯誤，請重新輸入', // ERR-001 · REQ-1.2
  categoryNameEmpty: '分類名稱不可為空', // ERR-002 · REQ-2.3、2.8
  categoryNameDuplicate: '此分類名稱已存在，請使用其他名稱', // ERR-003 · REQ-2.4、2.9
  categoryHasProducts: '此分類下仍有商品，無法刪除', // ERR-004 · REQ-2.5
  brandNameEmpty: '品牌與品名不可為空', // ERR-005 · REQ-3.3
  unitRequired: '請設定計量單位', // ERR-006 · REQ-3.4
  productDuplicate: '此品牌與品名已存在於此分類', // ERR-007 · REQ-3.6
  quantityComponentNotPositive: '數量組成欄位必須大於 0', // ERR-008 · REQ-4.6
  required: '此欄位為必填', // ERR-009 · REQ-5.3
  totalPriceNotPositive: '總價必須大於 0', // ERR-010 · REQ-5.4、5.11
  purchaseDateInFuture: '購入日期不可為未來日期', // ERR-011 · REQ-5.5
  dateRangeInvalid: '結束日期不可早於開始日期', // ERR-012 · REQ-8.7
  serverError: '系統暫時無法使用，請稍後再試', // ERR-013 · 設計補充（PocketBase 5xx）
  networkError: '無法連線至伺服器，請確認 Tailscale 連線狀態', // ERR-014 · 設計補充（連不上伺服器）
  remainingNegative: '剩餘數量不可為負數', // ERR-015 · REQ-7.10
  consumptionUnitRequired: '請設定消耗單位', // ERR-016 · REQ-7.11
  fieldNameDuplicate: '此欄位名稱已存在於此分類', // ERR-017 · REQ-4.7
  fieldInUseCannotDelete: '此欄位已有購買記錄使用，無法刪除', // ERR-018 · REQ-4.8
  fieldInUseCannotChangeType: '此欄位已有購買記錄使用，無法修改型別或計算設定', // ERR-019 · REQ-4.10
} as const;

/** 確認對話框 */
export const CONFIRM = {
  deleteRecord: '確定要刪除此筆記錄嗎？', // CONFIRM-001 · REQ-5.8
  updateRemaining: '是否更新此商品的剩餘數量？', // CONFIRM-002 · REQ-7.13
  deleteCategory: '確定要刪除分類「{name}」嗎？', // CONFIRM-003 · REQ-2.6（設計補充）
  deleteField: '確定要刪除欄位「{name}」嗎？', // CONFIRM-004 · REQ-4.9（設計補充）
} as const;

/** 系統狀態訊息（畫面上的狀態文字、標籤） */
export const STATUS = {
  cannotCalculate: '無法計算', // STATUS-001 · REQ-6.5
  rateNotSet: '未設定消耗速率', // STATUS-002 · REQ-7.7
  soon: '即將耗盡', // STATUS-003 · REQ-7.4（0–7 天，含今天）
  depleted: '已耗盡', // STATUS-004 · REQ-7.5
  notEnoughTrendData: '尚無足夠資料顯示趨勢圖', // STATUS-005 · 設計補充
  cannotCompare: '無法比較', // STATUS-006 · REQ-8.10
  remainingNotSet: '未設定剩餘數量', // STATUS-007 · REQ-7.12
  remainingStale: '剩餘數量已久未更新', // STATUS-008 · REQ-7.14（超過 30 天）
} as const;

/** 把訊息裡的 {name} 換成實際名稱，例如 withName(CONFIRM.deleteCategory, '蔬菜') */
export function withName(message: string, name: string): string {
  return message.replace('{name}', name);
}

export type MessageText =
  | (typeof MSG)[keyof typeof MSG]
  | (typeof ERR)[keyof typeof ERR]
  | (typeof CONFIRM)[keyof typeof CONFIRM]
  | (typeof STATUS)[keyof typeof STATUS];
