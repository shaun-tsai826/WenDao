<!--
  動態自訂欄位輸入（task 8.2，REQ-4 / AC-4.5、AC-4.6）
  設計：設計稿 Pur-New、Pur-New-Error、Pur-New-Qty；design.md v4.0「購買記錄 › CustomFieldInput」
  - 依商品所屬分類的自訂欄位（依 display_order）產生輸入欄位，三欄並排
  - 數字欄位 inputmode="decimal"，輸入時整理成數字（lib/numberInput.ts，不收負號）；文字欄位原樣保留
  - 每欄下方標示「算數量」（數量組成欄位）或「只記錄」
  - 數量組成欄位離開時檢查：有填但不大於 0 → ERR-008 顯示在該欄位下方（沒填不算錯，數量當 0）
  - 頁面送出時算出的錯誤由 errors 傳入，同樣顯示在欄位下方
  - leading 插槽：沒有包裝規格的分類，把「數量」欄位放在同一個格線的最前面（設計稿 Pur-New-Qty）
  v-model 的值是「自訂欄位 id → 文字」，與 lib/purchaseForm.ts 的 fieldValues 相同
-->
<template>
  <section v-if="sorted.length || $slots.leading" class="cf" :aria-labelledby="titleId">
    <div class="cf__head">
      <h2 :id="titleId" class="cf__title">{{ title }}</h2>
      <span v-if="hasComponents" class="cf__hint">「算數量」的欄位相乘＝總數量</span>
    </div>

    <div class="cf__grid">
      <slot name="leading" />
      <div v-for="field in sorted" :key="field.id" class="cf__field">
        <label :for="inputId(field.id)" class="cf__label">{{ field.field_name }}</label>
        <input
          :id="inputId(field.id)"
          :value="modelValue[field.id] ?? ''"
          type="text"
          :inputmode="field.field_type === 'number' ? 'decimal' : undefined"
          autocomplete="off"
          :maxlength="FIELD_VALUE_MAX"
          class="cf__input"
          :class="{ 'cf__input--number': field.field_type === 'number' }"
          :aria-invalid="errorOf(field.id) ? 'true' : undefined"
          :aria-describedby="errorOf(field.id) ? errorId(field.id) : undefined"
          @input="onInput(field, $event)"
          @blur="onBlur(field)"
        />
        <span v-if="errorOf(field.id)" :id="errorId(field.id)" class="cf__error">
          {{ errorOf(field.id) }}
        </span>
        <span v-else class="cf__tag" :class="{ 'cf__tag--component': field.is_quantity_component }">
          {{ field.is_quantity_component ? '算數量' : '只記錄' }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { validateQuantityComponent } from '@/composables/useQuantityFromComponents';
import { sanitizeDecimal } from '@/lib/numberInput';
import type { CustomFieldRecord } from '@/types/models';

type Field = Pick<
  CustomFieldRecord,
  'id' | 'field_name' | 'field_type' | 'is_quantity_component' | 'display_order'
>;

/** 欄位值長度上限（與 migration purchase_record_field_values.field_value 的 max 255 一致） */
const FIELD_VALUE_MAX = 255;

const props = withDefaults(
  defineProps<{
    fields: Field[];
    modelValue: Record<string, string>;
    title: string;
    /** 頁面送出時算出的錯誤：自訂欄位 id → 訊息 */
    errors?: Record<string, string>;
  }>(),
  { errors: () => ({}) },
);

const emit = defineEmits<{ 'update:modelValue': [value: Record<string, string>] }>();

const uid = useId();
const titleId = `${uid}-title`;
const inputId = (fieldId: string) => `cf-${fieldId}`;
const errorId = (fieldId: string) => `cf-${fieldId}-error`;

const sorted = computed(() =>
  [...props.fields].sort(
    (a, b) => a.display_order - b.display_order || a.field_name.localeCompare(b.field_name),
  ),
);
const hasComponents = computed(() => props.fields.some((f) => f.is_quantity_component));

/** 離開欄位時檢查出的錯誤（改了內容就先拿掉） */
const blurErrors = ref<Record<string, string>>({});
const errorOf = (fieldId: string) => props.errors[fieldId] ?? blurErrors.value[fieldId] ?? '';

function onInput(field: Field, event: Event) {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  if (field.field_type === 'number') {
    value = sanitizeDecimal(value);
    if (input.value !== value) input.value = value;
  }
  if (blurErrors.value[field.id]) {
    const rest = { ...blurErrors.value };
    delete rest[field.id];
    blurErrors.value = rest;
  }
  emit('update:modelValue', { ...props.modelValue, [field.id]: value });
}

function onBlur(field: Field) {
  const value = (props.modelValue[field.id] ?? '').trim();
  if (!field.is_quantity_component || !value) return;
  const error = validateQuantityComponent(Number(value));
  if (error) blurErrors.value = { ...blurErrors.value, [field.id]: error };
}
</script>

<style scoped lang="scss">
.cf {
  background: var(--surface);
  border-radius: var(--radius-card);
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cf__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.cf__title {
  margin: 0;
  font-size: 15px;
  line-height: 1.5; // Quasar 預設 h2 行高很大，要蓋掉
}

.cf__hint {
  font-size: 12px;
  color: var(--muted);
}

// 三欄並排；欄位多時自動換到下一行
.cf__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}

.cf__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.cf__label {
  font-size: 13px;
  overflow-wrap: anywhere;
}

.cf__input {
  width: 100%;
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  padding: 0 10px;
  font: inherit;
  font-size: 17px; // 不小於 16px，iOS 才不會自動放大畫面
  color: var(--text);
  background: var(--surface);
  outline: none;

  &:focus-visible {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }

  &[aria-invalid='true'] {
    border-color: var(--status-depleted-ink);
    box-shadow: 0 0 0 2px var(--status-depleted-bg);
  }
}

.cf__input--number {
  font-variant-numeric: tabular-nums;
}

.cf__tag {
  font-size: 12px;
  color: var(--muted);
}

.cf__tag--component {
  color: var(--accent-ink);
}

.cf__error {
  font-size: 12px;
  line-height: 1.4;
  color: var(--status-depleted-ink);
}
</style>
