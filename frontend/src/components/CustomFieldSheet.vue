<!--
  新增 / 編輯自訂欄位的下方面板（task 6.5，AC-4.1、4.2、4.7～4.11）
  設計：設計稿「編輯自訂欄位（下方面板）」（使用者 2026-11-02 確認）
  - 欄位已被購買記錄使用：型別與計算方式提前鎖定、刪除停用，並寫出原因（store 仍會檢查 ERR-018 / 019）
  - 刪除前 CONFIRM-004；成功訊息由頁面顯示（透過 emit）
-->
<template>
  <q-dialog v-model="open" position="bottom" @hide="emit('closed')">
    <section class="sheet" aria-labelledby="field-sheet-title">
      <span class="sheet__handle" aria-hidden="true" />
      <h2 id="field-sheet-title" class="sheet__title">{{ field ? '編輯欄位' : '新增欄位' }}</h2>

      <form class="sheet__form" novalidate @submit.prevent="save">
        <div class="field">
          <label for="field-name" class="field__label">欄位名稱</label>
          <input
            id="field-name"
            v-model="name"
            type="text"
            class="field__input"
            :maxlength="FIELD_NAME_MAX"
            placeholder="例如：抽數(單包)"
            autocomplete="off"
            :aria-invalid="nameError ? 'true' : undefined"
            :aria-describedby="nameError ? 'field-name-error' : undefined"
          />
          <span v-if="nameError" id="field-name-error" class="field__error">{{ nameError }}</span>
        </div>

        <div v-if="locked" role="note" class="lock-note">
          <AppIcon name="alert" :size="18" />
          <span>
            已有
            {{ usage }}
            筆購買記錄使用這個欄位，只能修改名稱與順序；型別與計算方式不能改，也不能刪除。
          </span>
        </div>

        <fieldset class="choice" :disabled="locked">
          <legend class="field__label">型別</legend>
          <div class="choice__grid">
            <label v-for="option in TYPE_OPTIONS" :key="option.value" class="choice__item">
              <input v-model="fieldType" type="radio" name="field-type" :value="option.value" />
              <span>{{ option.label }}</span>
            </label>
          </div>
        </fieldset>

        <fieldset class="choice" :disabled="locked">
          <legend class="field__label">計算方式</legend>
          <label
            v-for="option in CALC_OPTIONS"
            :key="option.label"
            class="choice__item choice__item--wide"
          >
            <input v-model="isQuantity" type="radio" name="field-calc" :value="option.value" />
            <span class="choice__text">
              {{ option.label }}
              <span class="choice__hint">{{ option.hint }}</span>
            </span>
          </label>
        </fieldset>

        <div v-if="formError" role="alert" class="form-alert">{{ formError }}</div>

        <div class="sheet__actions">
          <button
            v-if="field"
            type="button"
            class="sheet__delete"
            :disabled="locked || busy"
            @click="remove"
          >
            刪除欄位
          </button>
          <button type="button" class="sheet__cancel" @click="open = false">取消</button>
          <button type="submit" class="sheet__save" :disabled="busy">
            {{ busy ? '儲存中…' : '儲存' }}
          </button>
        </div>
      </form>
    </section>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { CONFIRM, ERR, withName } from '@/constants/messages';
import { ValidationError, apiErrorMessage } from '@/lib/errors';
import { confirmDelete } from '@/lib/feedback';
import { FIELD_NAME_MAX, useCustomFieldStore } from '@/stores/customField';
import type { CustomFieldRecord, CustomFieldType } from '@/types/models';

const props = defineProps<{
  categoryId: string;
  /** 要編輯的欄位；null 代表新增 */
  field: CustomFieldRecord | null;
}>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{
  saved: [kind: 'created' | 'updated'];
  deleted: [];
  closed: [];
}>();

const TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: 'number', label: '數字' },
  { value: 'text', label: '文字' },
];
const CALC_OPTIONS = [
  { value: true, label: '算進數量', hint: '和其他「算數量」欄位相乘成總數量（數量組成欄位）' },
  { value: false, label: '只記錄', hint: '例如層數，不影響數量與單價（一般資訊欄位）' },
];

const store = useCustomFieldStore();
const name = ref('');
const fieldType = ref<CustomFieldType>('number');
const isQuantity = ref(true);
const nameError = ref('');
const formError = ref('');
const busy = ref(false);

const usage = computed(() => (props.field ? store.usageOf(props.field.id) : 0));
const locked = computed(() => usage.value > 0);

// 每次打開都從欄位目前的值開始
watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    name.value = props.field?.field_name ?? '';
    fieldType.value = props.field?.field_type ?? 'number';
    isQuantity.value = props.field?.is_quantity_component ?? true;
    nameError.value = '';
    formError.value = '';
  },
  { immediate: true },
);

/** 名稱相關的錯誤顯示在欄位下方，其他顯示在表單下方 */
function showError(err: unknown) {
  const message = apiErrorMessage(err);
  const isNameError =
    err instanceof ValidationError &&
    (message === ERR.required || message === ERR.fieldNameDuplicate);
  if (isNameError) nameError.value = message;
  else formError.value = message;
}

async function save() {
  if (busy.value) return;
  nameError.value = '';
  formError.value = '';
  busy.value = true;
  const input = {
    field_name: name.value,
    field_type: fieldType.value,
    is_quantity_component: isQuantity.value,
  };
  try {
    if (props.field) await store.updateField(props.field.id, input);
    else await store.createField(props.categoryId, input);
    emit('saved', props.field ? 'updated' : 'created');
    open.value = false;
  } catch (err) {
    showError(err);
  } finally {
    busy.value = false;
  }
}

async function remove() {
  const target = props.field;
  if (!target || locked.value) return;
  if (!(await confirmDelete(withName(CONFIRM.deleteField, target.field_name)))) return;
  busy.value = true;
  formError.value = '';
  try {
    await store.deleteField(target.id);
    emit('deleted');
    open.value = false;
  } catch (err) {
    showError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped lang="scss">
.sheet {
  width: 100%;
  max-width: 640px;
  box-sizing: border-box;
  background: var(--surface);
  color: var(--text);
  font-family: var(--font);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  padding: 10px var(--card-pad) 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sheet__handle {
  align-self: center;
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: var(--control);
}

.sheet__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
}

.sheet__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field__label {
  font-size: 14px;
  padding: 0;
  margin-bottom: 8px;
}

.field > .field__label {
  margin-bottom: 0;
}

.field__input {
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  padding: 0 12px;
  font: inherit;
  font-size: 16px;
  color: var(--text);
  outline: none;

  &:focus-visible {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }

  &[aria-invalid='true'] {
    border-color: var(--status-depleted-ink);
  }
}

.field__error {
  font-size: 13px;
  color: var(--status-depleted-ink);
}

.lock-note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: var(--status-neutral-bg);
  color: var(--status-neutral-ink);
  border-radius: var(--radius-inner);
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;

  svg {
    flex: none;
    margin-top: 1px;
  }
}

.choice {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.choice__item {
  min-height: 44px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 15px;
  cursor: pointer;

  &:has(input:checked) {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent-ink);
  }

  &:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  input {
    margin: 0;
    accent-color: var(--accent);
  }
}

.choice__item--wide {
  justify-content: flex-start;
  min-height: 52px;
}

.choice__text {
  display: flex;
  flex-direction: column;
}

.choice__hint {
  font-size: 12px;
  color: var(--muted);
}

.choice:disabled .choice__item {
  cursor: not-allowed;
  color: #8a8f94;
  background: #f6f7f8;
  border-color: var(--border);

  &:has(input:checked) {
    color: var(--muted);
    background: #eef4fd;
    border-color: #a9c4ef;
  }
}

.form-alert {
  padding: 10px 12px;
  border-radius: var(--radius-inner);
  background: var(--status-depleted-bg);
  color: var(--status-depleted-ink);
  font-size: 14px;
}

.sheet__actions {
  display: flex;
  gap: 12px;
  padding-top: 4px;
}

.sheet__delete,
.sheet__cancel,
.sheet__save {
  height: 50px;
  border-radius: 999px;
  font: inherit;
  font-size: 16px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.sheet__delete {
  flex: none;
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--status-depleted-ink);

  &:disabled {
    color: #8a8f94;
    cursor: not-allowed;
  }
}

.sheet__cancel {
  flex: 1 1 0;
  border: 1px solid var(--control);
  background: var(--surface);
  color: var(--text);
}

.sheet__save {
  flex: 1 1 0;
  border: none;
  background: var(--accent);
  color: #ffffff;

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
}
</style>
