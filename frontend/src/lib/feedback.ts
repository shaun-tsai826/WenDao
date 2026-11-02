// 操作回饋：底部提示與刪除確認（task 6.2）
// 頁面一律透過這裡顯示，文字一律來自 constants/messages.ts。
// 測試時可以用 vi.spyOn 換掉，不必真的彈出 Quasar 元件。
import { Dialog, Notify } from 'quasar';

/** 成功提示（例如 MSG-001「分類建立成功」） */
export function notifySuccess(message: string): void {
  Notify.create({ message, icon: 'none' });
}

/** 錯誤提示（用在沒有對應欄位可以顯示錯誤的情況，例如刪除失敗） */
export function notifyError(message: string): void {
  Notify.create({ message, icon: 'none', color: 'negative' });
}

/**
 * 刪除前確認（例如 CONFIRM-003「確定要刪除分類「蔬菜」嗎？」）。
 * 使用者按「刪除」回傳 true；按「取消」、點背景或按 Esc 回傳 false。
 */
export function confirmDelete(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Dialog.create({
      message,
      persistent: false,
      ok: { label: '刪除', color: 'negative', unelevated: true, rounded: true, noCaps: true },
      cancel: { label: '取消', flat: true, rounded: true, noCaps: true, textColor: 'dark' },
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false));
  });
}
