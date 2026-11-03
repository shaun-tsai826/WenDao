<!--
  新增購買記錄後「是否更新此商品的剩餘數量？」對話框（task 8.4，REQ-7 / AC-7.13，CONFIRM-002）
  設計：設計稿 Pur-Remain；design.md v4.0「購買記錄 › 存檔後」
  - 由 lib/feedback.ts 的 askUpdateRemaining 用 Quasar Dialog 開啟（全域），所以頁面換到購買記錄列表後仍會顯示
  - 剩餘數量預先帶入目前的值（未設定時留空，不預設 0，避免直接按儲存就變成「即將耗盡」）
  - 按「更新剩餘數量」時呼叫 onSave；被拒（例如負數 ERR-015）就把錯誤顯示在欄位下方、對話框不關
  - 最外層一定要是 <div>：Quasar 只讓 .q-dialog__inner 底下直接的 div 接收點擊（task 6.5 的教訓）
-->
<template>
  <q-dialog ref="dialogRef" @show="focusInput" @hide="onDialogHide">
    <div class="remain-dialog" aria-labelledby="remain-dialog-title">
      <div class="remain-dialog__head">
        <h2 id="remain-dialog-title" class="remain-dialog__title">{{ CONFIRM.updateRemaining }}</h2>
        <span class="remain-dialog__desc">{{ productName }} · {{ purchased }}</span>
      </div>

      <div class="remain-dialog__field">
        <label for="remain-dialog-input" class="remain-dialog__label">現在還剩多少</label>
        <div class="remain" :class="{ 'remain--invalid': error }">
          <input
            id="remain-dialog-input"
            ref="inputRef"
            :value="value"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            class="remain__input"
            :aria-invalid="error ? 'true' : undefined"
            :aria-describedby="
              error ? 'remain-dialog-error remain-dialog-hint' : 'remain-dialog-hint'
            "
            @input="onInput"
            @keydown.enter.prevent="save"
          />
          <span v-if="unit" class="remain__unit">{{ unit }}</span>
        </div>
        <span v-if="error" id="remain-dialog-error" role="alert" class="remain-dialog__error">
          {{ error }}
        </span>
        <span id="remain-dialog-hint" class="remain-dialog__hint">{{ hint }}</span>
      </div>

      <div class="remain-dialog__actions">
        <button type="button" class="btn btn--secondary" :disabled="saving" @click="onDialogCancel">
          先不用
        </button>
        <button type="button" class="btn btn--primary" :disabled="saving" @click="save">
          {{ saving ? '儲存中…' : '更新剩餘數量' }}
        </button>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { CONFIRM } from '@/constants/messages';
import { apiErrorMessage } from '@/lib/errors';
import { parseDecimal, sanitizeDecimal } from '@/lib/numberInput';
import { formatMonthDay, formatQuantity } from '@/lib/productView';

const props = defineProps<{
  productName: string;
  /** 「剛記錄了 1,200 抽」 */
  purchased: string;
  /** 目前的剩餘數量；未設定為 null（欄位留空） */
  remaining: number | null;
  /** 消耗單位（例如「包」）；沒有就不顯示 */
  unit: string;
  /** 目前剩餘數量的更新日 'YYYY-MM-DD'；未設定為 null */
  updatedAt: string | null;
  /** 今天 'YYYY-MM-DD'（說明「儲存時記為今天更新」用） */
  today: string;
  /** 儲存；被拒時丟出錯誤（訊息會顯示在欄位下方） */
  onSave: (remaining: number | null) => Promise<void>;
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const value = ref(props.remaining === null ? '' : formatQuantity(props.remaining));
const error = ref('');
const saving = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const hint = computed(() => {
  const today = `儲存時記為今天（${formatMonthDay(props.today)}）更新`;
  if (props.remaining === null || !props.updatedAt) {
    return `還沒設定過剩餘數量；填入現在實際還剩多少，${today}`;
  }
  const current = `${formatQuantity(props.remaining)}${props.unit ? ` ${props.unit}` : ''}`;
  return `已先填入目前的 ${current}（${formatMonthDay(props.updatedAt)} 更新），請改成加上這次買的之後、實際還剩的數量；${today}`;
});

/** 輸入時整理成數字（保留開頭負號，讓 ERR-015 可以顯示） */
function onInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const clean = sanitizeDecimal(input.value, { allowNegative: true });
  value.value = clean;
  if (input.value !== clean) input.value = clean;
  error.value = '';
}

async function save() {
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    await props.onSave(parseDecimal(value.value));
    onDialogOK();
  } catch (err) {
    error.value = apiErrorMessage(err);
    inputRef.value?.focus();
  } finally {
    saving.value = false;
  }
}

// 對話框完全顯示後（開啟動畫結束）才聚焦；元件一掛上就 focus 會因為還看不到而失效（e2e 發現）
function focusInput() {
  inputRef.value?.focus();
}
</script>

<style scoped lang="scss">
.remain-dialog {
  width: min(350px, calc(100vw - 40px));
  box-sizing: border-box;
  background: var(--surface);
  border-radius: var(--radius-card);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--text);
}

.remain-dialog__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.remain-dialog__title {
  margin: 0;
  font-size: 18px;
  line-height: 1.4; // Quasar 預設 h2 行高很大，要蓋掉
}

.remain-dialog__desc {
  font-size: 13px;
  color: var(--muted);
}

.remain-dialog__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.remain-dialog__label {
  font-size: 14px;
}

.remain {
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
}

// 有錯誤時即使聚焦也維持紅框
.remain.remain--invalid {
  border-color: var(--status-depleted-ink);

  &:focus-within {
    box-shadow: 0 0 0 2px var(--status-depleted-bg);
  }
}

.remain__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 18px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  background: transparent;
  outline: none;
}

.remain__unit {
  flex: none;
  font-size: 15px;
  color: var(--muted);
}

.remain-dialog__error {
  font-size: 13px;
  color: var(--status-depleted-ink);
}

.remain-dialog__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted);
}

.remain-dialog__actions {
  display: flex;
  gap: 10px;
}

.btn {
  height: 48px;
  border-radius: 999px;
  font: inherit;
  font-size: 15px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
}

.btn--secondary {
  flex: 1 1 0;
  border: 1px solid var(--control);
  background: var(--surface);
  color: var(--text);
}

.btn--primary {
  flex: 1.4 1 0;
  border: none;
  background: var(--accent);
  color: #ffffff;
}
</style>
