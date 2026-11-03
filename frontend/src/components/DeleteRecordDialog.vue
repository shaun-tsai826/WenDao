<!--
  刪除購買記錄確認對話框（task 8.7，REQ-5 / AC-5.8，CONFIRM-001）
  設計：設計稿 Pur-Delete；design.md v4.0「購買記錄 › 刪除確認」
  - 由 lib/feedback.ts 的 confirmDeleteRecord 用 Quasar Dialog 開啟；只負責確認，真正刪除由頁面做
  - role="alertdialog"：標題是 CONFIRM-001，說明寫出是哪一筆，並提醒刪除後無法復原、歷史均價會重算
  - 打開時焦點放在「取消」（危險操作預設不刪）；按「取消」、點背景或 Esc 都不刪除
  - 最外層一定要是 <div>：Quasar 只讓 .q-dialog__inner 底下直接的 div 接收點擊（task 6.5 的教訓）
-->
<template>
  <q-dialog ref="dialogRef" @show="focusCancel" @hide="onDialogHide">
    <div
      class="delete-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
    >
      <div class="delete-dialog__head">
        <h2 id="delete-dialog-title" class="delete-dialog__title">{{ CONFIRM.deleteRecord }}</h2>
        <p id="delete-dialog-desc" class="delete-dialog__desc">
          <span class="delete-dialog__summary">{{ summary }}</span>
          <span>{{ WARNING }}</span>
        </p>
      </div>
      <div class="delete-dialog__actions">
        <button ref="cancelRef" type="button" class="btn btn--secondary" @click="onDialogCancel">
          取消
        </button>
        <button type="button" class="btn btn--danger" @click="onDialogOK()">刪除</button>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { CONFIRM } from '@/constants/messages';

/** 設計稿 Pur-Delete 的提醒文字 */
const WARNING = '刪除後無法復原，商品的歷史均價會重新計算';

defineProps<{
  /** 是哪一筆：「10/31 全聯 · 春風 抽取式衛生紙 · 599 元」（lib/purchaseView.ts 的 purchaseSummary） */
  summary: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const cancelRef = ref<HTMLButtonElement | null>(null);

/** 開啟動畫結束後才聚焦（掛上時 focus 會失效，task 8.4 的教訓） */
function focusCancel() {
  cancelRef.value?.focus();
}
</script>

<style scoped lang="scss">
.delete-dialog {
  width: min(350px, calc(100vw - 40px));
  box-sizing: border-box;
  background: var(--surface);
  border-radius: var(--radius-card);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--text);
}

.delete-dialog__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.delete-dialog__title {
  margin: 0;
  font-size: 18px;
  line-height: 1.4; // Quasar 預設 h2 行高很大，要蓋掉
}

.delete-dialog__desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--muted);
  display: flex;
  flex-direction: column;
}

.delete-dialog__summary {
  overflow-wrap: anywhere;
}

.delete-dialog__actions {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1 1 0;
  height: 48px;
  border-radius: 999px;
  font: inherit;
  font-size: 15px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.btn--secondary {
  border: 1px solid var(--control);
  background: var(--surface);
  color: var(--text);
}

.btn--danger {
  border: none;
  background: var(--danger);
  color: #ffffff;
}
</style>
