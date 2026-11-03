// 操作回饋：底部提示與刪除確認（task 6.2）、更新剩餘數量對話框（task 8.4）、刪除購買記錄確認（task 8.7）
// 頁面一律透過這裡顯示，文字一律來自 constants/messages.ts。
// 測試時可以用 vi.spyOn 換掉，不必真的彈出 Quasar 元件。
import { Dialog, Notify } from 'quasar';
import DeleteRecordDialog from '@/components/DeleteRecordDialog.vue';
import RemainingDialog from '@/components/RemainingDialog.vue';

/** 成功提示（例如 MSG-001「分類建立成功」） */
export function notifySuccess(message: string): void {
  Notify.create({ message });
}

/** 錯誤提示（用在沒有對應欄位可以顯示錯誤的情況，例如刪除失敗） */
export function notifyError(message: string): void {
  Notify.create({ message, color: 'negative' });
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

/** 「是否更新此商品的剩餘數量？」對話框的資料（task 8.4，AC-7.13） */
export interface RemainingDialogOptions {
  productName: string;
  /** 「剛記錄了 1,200 抽」 */
  purchased: string;
  /** 目前的剩餘數量；未設定為 null（欄位留空） */
  remaining: number | null;
  /** 消耗單位 */
  unit: string;
  /** 目前剩餘數量的更新日 'YYYY-MM-DD'；未設定為 null */
  updatedAt: string | null;
  /** 今天 'YYYY-MM-DD' */
  today: string;
  /** 儲存；被拒時丟出錯誤，訊息顯示在對話框裡 */
  onSave: (remaining: number | null) => Promise<void>;
}

/**
 * 新增購買記錄後詢問是否更新剩餘數量（CONFIRM-002）。
 * 用全域 Dialog 開啟，頁面換到別頁後仍會顯示。儲存成功回傳 true；按「先不用」、點背景或 Esc 回傳 false。
 */
export function askUpdateRemaining(options: RemainingDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Dialog.create({ component: RemainingDialog, componentProps: { ...options } })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false));
  });
}

/**
 * 刪除購買記錄前確認（CONFIRM-001，設計稿 Pur-Delete）。
 * @param summary 是哪一筆（lib/purchaseView.ts 的 purchaseSummary）
 * 按「刪除」回傳 true；按「取消」、點背景或 Esc 回傳 false。
 */
export function confirmDeleteRecord(summary: string): Promise<boolean> {
  return new Promise((resolve) => {
    Dialog.create({ component: DeleteRecordDialog, componentProps: { summary } })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false));
  });
}
