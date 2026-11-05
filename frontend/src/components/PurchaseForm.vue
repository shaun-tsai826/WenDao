<!--
  購買記錄表單（task 8.4 新增；task 8.6 編輯會共用）
  設計：設計稿 Pur-New、Pur-New-Error、Pur-New-Qty；design.md v4.0「購買記錄」
  - 商品（依分類分組、左側分類圖塊；預設「請選擇商品」）、購入日期（預設今天、不能選未來）、購買地點＋常去的地點、總價
  - 自訂欄位用 CustomFieldInput；分類沒有數量組成欄位時，數量欄位（直接輸入、選填）放在同一張卡片最前面
  - 下方「自動計算結果」即時顯示總數量與單位均價（lib/purchaseForm.ts 的 computePurchase，與 store 存檔時相同）
  - 送出前用 validatePurchase 檢查：每個錯誤顯示在欄位下方；表單上方加錯誤摘要（連到各欄位、取得焦點；使用者同意提案 4）
  - 檢查通過才呼叫 onSubmit；store 回傳的欄位錯誤（FieldsValidationError）同樣顯示，其他錯誤（例如連線）顯示在按鈕上方
-->
<template>
  <form class="form" novalidate @submit.prevent="submit">
    <div
      v-if="showSummary && summaryItems.length"
      ref="summaryRef"
      role="alert"
      tabindex="-1"
      aria-labelledby="form-summary-title"
      class="form-summary"
    >
      <AppIcon name="alert" :size="18" class="form-summary__icon" />
      <div class="form-summary__body">
        <span id="form-summary-title" class="form-summary__title">
          有 {{ summaryItems.length }} 個欄位需要修正
        </span>
        <a
          v-for="item in summaryItems"
          :key="item.key"
          :href="`#${item.target}`"
          class="form-summary__link"
          @click.prevent="focusField(item.target)"
        >
          {{ item.label }}：{{ item.message }}
        </a>
      </div>
    </div>

    <section class="card group">
      <div class="field">
        <label for="p-product" class="field__label">商品</label>
        <div class="product" :class="{ 'product--invalid': errors.productId }">
          <span
            v-if="product"
            class="product-tile"
            :style="{ background: tone.bg, color: tone.ink }"
            aria-hidden="true"
          >
            {{ categoryLabel(categoryName) }}
          </span>
          <select
            id="p-product"
            v-model="form.productId"
            class="product__select"
            :class="{ 'product__select--placeholder': !form.productId }"
            :aria-invalid="ariaInvalid('productId')"
            :aria-describedby="describedBy('productId', 'p-product')"
            @change="clearError('productId')"
          >
            <option value="" disabled>請選擇商品</option>
            <optgroup v-for="group in productGroups" :key="group.id" :label="group.name">
              <option v-for="p in group.products" :key="p.id" :value="p.id">
                {{ p.brand }} {{ p.name }}
              </option>
            </optgroup>
          </select>
        </div>
        <span v-if="errors.productId" id="p-product-error" class="field__error">
          {{ errors.productId }}
        </span>
      </div>

      <div class="field-pair">
        <div class="field">
          <label for="p-date" class="field__label">購入日期</label>
          <input
            id="p-date"
            v-model="form.purchaseDate"
            type="date"
            :min="DATE_MIN"
            :max="today"
            class="control"
            :aria-invalid="ariaInvalid('purchaseDate')"
            :aria-describedby="describedBy('purchaseDate', 'p-date')"
            @input="clearError('purchaseDate')"
          />
          <span v-if="errors.purchaseDate" id="p-date-error" class="field__error">
            {{ errors.purchaseDate }}
          </span>
        </div>
        <div class="field">
          <label for="p-store" class="field__label">購買地點</label>
          <input
            id="p-store"
            v-model="form.store"
            type="text"
            autocomplete="off"
            :maxlength="STORE_MAX"
            class="control"
            :aria-invalid="ariaInvalid('store')"
            :aria-describedby="describedBy('store', 'p-store')"
            @input="clearError('store')"
          />
          <span v-if="errors.store" id="p-store-error" class="field__error">
            {{ errors.store }}
          </span>
        </div>
      </div>

      <div
        v-if="purchaseStore.recentStores.length"
        role="group"
        aria-label="常去的地點"
        class="store-chips"
      >
        <button
          v-for="name in purchaseStore.recentStores"
          :key="name"
          type="button"
          class="store-chip touch-target"
          :aria-pressed="form.store.trim() === name ? 'true' : 'false'"
          @click="pickStore(name)"
        >
          {{ name }}
        </button>
      </div>

      <div class="field">
        <label for="p-price" class="field__label">總價（元）</label>
        <input
          id="p-price"
          :value="form.totalPrice"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          class="control control--price"
          :aria-invalid="ariaInvalid('totalPrice')"
          :aria-describedby="describedBy('totalPrice', 'p-price')"
          @input="onDecimal('totalPrice', $event, true)"
        />
        <span v-if="errors.totalPrice" id="p-price-error" class="field__error">
          {{ errors.totalPrice }}
        </span>
      </div>
    </section>

    <CustomFieldInput
      v-if="product"
      :fields="fields"
      :model-value="form.fieldValues"
      :title="hasComponents ? `${categoryName}的包裝規格` : '數量與其他資訊'"
      :errors="errors"
      @update:model-value="onFieldValues"
    >
      <template v-if="!hasComponents" #leading>
        <div class="qty">
          <label for="p-qty" class="qty__label">
            數量（{{ product.unit }}）<span class="qty__optional">選填</span>
          </label>
          <input
            id="p-qty"
            :value="form.quantity"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            class="qty__input"
            aria-describedby="p-qty-hint"
            @input="onDecimal('quantity', $event, false)"
          />
        </div>
      </template>
      <template v-if="!hasComponents" #footer>
        <p id="p-qty-hint" class="qty-hint">
          「{{ categoryName }}」沒有設定包裝規格，直接填買了幾{{
            product.unit
          }}；沒填數量時，單位均價會顯示「無法計算」
        </p>
      </template>
    </CustomFieldInput>

    <section
      aria-label="自動計算結果"
      role="status"
      class="preview"
      :class="{ 'preview--muted': preview.muted }"
    >
      <p v-if="!product" class="preview__hint">選擇商品後自動計算總數量與單位均價</p>
      <template v-else>
        <div class="preview__item">
          <span class="preview__label">總數量</span>
          <span class="preview__value preview__qty-value">{{ preview.qtyValue }}</span>
          <span class="preview__formula preview__qty-formula">{{ preview.qtyFormula }}</span>
        </div>
        <div class="preview__item">
          <span class="preview__label">單位均價</span>
          <span class="preview__value preview__price-value">{{ preview.priceValue }}</span>
          <span v-if="preview.priceFormula" class="preview__formula preview__price-formula">
            {{ preview.priceFormula }}
          </span>
        </div>
      </template>
    </section>

    <div v-if="formError" role="alert" class="form-alert">{{ formError }}</div>

    <div class="actions">
      <router-link :to="cancelTo" class="cancel">取消</router-link>
      <button type="submit" class="submit" :disabled="saving">
        {{ saving ? '儲存中…' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import CustomFieldInput from '@/components/CustomFieldInput.vue';
import { localToday } from '@/composables/dates';
import { categoryLabel, categoryTone } from '@/lib/categoryTone';
import { apiErrorMessage, FieldsValidationError } from '@/lib/errors';
import { parseDecimal, sanitizeDecimal } from '@/lib/numberInput';
import {
  computePurchase,
  validatePurchase,
  type PurchaseErrors,
  type PurchaseFormData,
  type PurchaseFormInitial,
} from '@/lib/purchaseForm';
import { formatAmount, formatUnitPrice } from '@/lib/purchaseView';
import { useCategoryStore } from '@/stores/category';
import { useCustomFieldStore } from '@/stores/customField';
import { useProductStore } from '@/stores/product';
import { usePurchaseStore } from '@/stores/purchase';
import type { CustomFieldRecord } from '@/types/models';

const DATE_MIN = '2000-01-01';
/** 購買地點長度上限（與 migration purchase_records.store 的 max 100 一致） */
const STORE_MAX = 100;

const props = defineProps<{
  initial?: Partial<PurchaseFormInitial>;
  submitLabel: string;
  cancelTo: string;
  /** 檢查通過後呼叫；被拒時丟出錯誤（FieldsValidationError 會顯示在欄位旁） */
  onSubmit: (data: PurchaseFormData) => Promise<void>;
}>();

const categoryStore = useCategoryStore();
const productStore = useProductStore();
const purchaseStore = usePurchaseStore();
const customFieldStore = useCustomFieldStore();

const today = localToday();
const form = reactive<PurchaseFormInitial>({
  productId: props.initial?.productId ?? '',
  purchaseDate: props.initial?.purchaseDate ?? today,
  store: props.initial?.store ?? '',
  totalPrice: props.initial?.totalPrice ?? '',
  quantity: props.initial?.quantity ?? '',
  fieldValues: { ...(props.initial?.fieldValues ?? {}) },
});
const fields = ref<CustomFieldRecord[]>([]);
const errors = ref<PurchaseErrors>({});
const showSummary = ref(false);
const formError = ref('');
const saving = ref(false);
const summaryRef = ref<HTMLElement | null>(null);

// ---- 商品 ----
const product = computed(() => productStore.getById(form.productId) ?? null);
const categoryIndex = computed(() =>
  categoryStore.categories.findIndex((c) => c.id === product.value?.category),
);
const categoryName = computed(() => categoryStore.categories[categoryIndex.value]?.name ?? '');
const tone = computed(() => categoryTone(categoryIndex.value));

/** 下拉選單：依分類（建立順序）分組，組內依品牌＋品名 */
const productGroups = computed(() =>
  categoryStore.categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      products: productStore.products
        .filter((p) => p.category === c.id)
        .sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, 'zh-Hant')),
    }))
    .filter((g) => g.products.length),
);

const hasComponents = computed(() => fields.value.some((f) => f.is_quantity_component));

// 換商品 → 讀取該分類的自訂欄位；分類變了就清掉上一個分類填的值（第一次載入保留編輯時帶入的值）
let loadedCategory: string | null = null;
watch(
  () => product.value?.category ?? '',
  async (categoryId) => {
    if (loadedCategory !== null && categoryId !== loadedCategory) {
      form.fieldValues = {};
      form.quantity = '';
    }
    loadedCategory = categoryId;
    fields.value = categoryId ? await customFieldStore.listFields(categoryId) : [];
  },
  { immediate: true },
);

// ---- 輸入 ----
function clearError(key: string) {
  if (!(key in errors.value)) return;
  const rest = { ...errors.value };
  delete rest[key];
  errors.value = rest;
}

function onDecimal(key: 'totalPrice' | 'quantity', event: Event, allowNegative: boolean) {
  const input = event.target as HTMLInputElement;
  const clean = sanitizeDecimal(input.value, { allowNegative });
  form[key] = clean;
  if (input.value !== clean) input.value = clean;
  clearError(key);
}

function onFieldValues(values: Record<string, string>) {
  for (const id of Object.keys(values)) {
    if (values[id] !== form.fieldValues[id]) clearError(id);
  }
  form.fieldValues = values;
}

function pickStore(name: string) {
  form.store = name;
  clearError('store');
}

// ---- 錯誤顯示 ----
const ariaInvalid = (key: string) => (errors.value[key] ? 'true' : undefined);
const describedBy = (key: string, id: string) => (errors.value[key] ? `${id}-error` : undefined);

const BASE_FIELDS: { key: string; label: string; target: string }[] = [
  { key: 'productId', label: '商品', target: 'p-product' },
  { key: 'purchaseDate', label: '購入日期', target: 'p-date' },
  { key: 'store', label: '購買地點', target: 'p-store' },
  { key: 'totalPrice', label: '總價', target: 'p-price' },
];

/** 錯誤摘要：依畫面順序列出還沒修正的欄位 */
const summaryItems = computed(() => [
  ...BASE_FIELDS.filter((f) => errors.value[f.key]).map((f) => ({
    ...f,
    message: errors.value[f.key]!,
  })),
  ...fields.value
    .filter((f) => errors.value[f.id])
    .map((f) => ({
      key: f.id,
      label: f.field_name,
      target: `cf-${f.id}`,
      message: errors.value[f.id]!,
    })),
]);

function focusField(id: string) {
  document.getElementById(id)?.focus();
}

async function showErrors(next: PurchaseErrors) {
  errors.value = next;
  showSummary.value = true;
  await nextTick();
  summaryRef.value?.focus();
}

// ---- 自動計算結果 ----
function buildData(): PurchaseFormData {
  return {
    productId: form.productId,
    purchaseDate: form.purchaseDate,
    store: form.store,
    totalPrice: parseDecimal(form.totalPrice),
    quantity: hasComponents.value ? null : parseDecimal(form.quantity),
    customFields: fields.value,
    fieldValues: form.fieldValues,
  };
}

const preview = computed(() => {
  const unit = product.value?.unit ?? '';
  const data = buildData();
  const { quantity, unitPrice } = computePurchase(data);
  const total = data.totalPrice;

  let qtyFormula: string;
  if (hasComponents.value) {
    qtyFormula =
      quantity === null
        ? '「算數量」的欄位都填了、而且大於 0 才能計算'
        : fields.value
            .filter((f) => f.is_quantity_component)
            .map((f) => formatAmount(Number(form.fieldValues[f.id])))
            .join(' × ');
  } else {
    qtyFormula = quantity === null ? '沒填數量時無法計算單位均價' : '直接輸入';
  }

  let priceValue: string;
  let priceFormula = '';
  if (total === null || total <= 0) {
    priceValue = '—';
    priceFormula = '填入總價後計算';
  } else if (quantity === null || unitPrice === null) {
    priceValue = '無法計算';
  } else {
    priceValue = `${formatUnitPrice(unitPrice)} 元/${unit}`;
    priceFormula = `${formatAmount(total)} ÷ ${formatAmount(quantity)}`;
  }

  return {
    muted:
      !product.value || quantity === null || unitPrice === null || total === null || total <= 0,
    qtyValue: quantity === null ? '—' : `${formatAmount(quantity)} ${unit}`,
    qtyFormula,
    priceValue,
    priceFormula,
  };
});

// ---- 送出 ----
async function submit() {
  if (saving.value) return;
  formError.value = '';
  const data = buildData();
  const found = validatePurchase(data, localToday());
  if (Object.keys(found).length) {
    await showErrors(found);
    return;
  }
  errors.value = {};
  showSummary.value = false;
  saving.value = true;
  try {
    await props.onSubmit(data);
  } catch (err) {
    if (err instanceof FieldsValidationError) await showErrors(err.fieldErrors);
    else formError.value = apiErrorMessage(err);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.form {
  display: flex;
  flex-direction: column;
  gap: var(--card-gap);
}

.card {
  background: var(--surface);
  border-radius: var(--radius-card);
}

.group {
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.field__label {
  font-size: 14px;
}

.field__error {
  font-size: 13px;
  line-height: 1.4;
  color: var(--status-depleted-ink);
}

.control {
  width: 100%;
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  padding: 0 12px;
  font: inherit;
  font-size: 16px; // 不小於 16px，iOS 才不會自動放大畫面
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

.control--price {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

// 商品：左側分類圖塊＋下拉選單，放在同一個框裡
.product {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  padding-left: 10px;
  background: var(--surface);

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
}

.product.product--invalid {
  border-color: var(--status-depleted-ink);
  box-shadow: 0 0 0 2px var(--status-depleted-bg);
}

.product-tile {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.product__select {
  flex: 1 1 auto;
  min-width: 0;
  height: 46px;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 16px;
  color: var(--text);
  outline: none;
}

// 還沒選商品時，「請選擇商品」用提示字的灰色
.product__select--placeholder {
  color: var(--muted);

  option {
    color: var(--text);
  }
}

.store-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: -4px;
}

.store-chip {
  min-width: 44px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--control);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 13px;
  cursor: pointer;

  &[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent-ink);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

// 沒有包裝規格時的數量欄位（放在 CustomFieldInput 的 leading 插槽）
.qty {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.qty__label {
  font-size: 13px;
}

.qty__optional {
  margin-left: 4px;
  color: var(--muted);
}

.qty__input {
  width: 100%;
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  padding: 0 10px;
  font: inherit;
  font-size: 17px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  background: var(--surface);
  outline: none;

  &:focus-visible {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
}

.qty-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted);
}

.preview {
  background: var(--accent-soft);
  color: var(--accent-ink);
  border-radius: var(--radius-card);
  padding: 14px 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.preview--muted {
  background: var(--status-neutral-bg);
  color: var(--status-neutral-ink);
}

.preview__hint {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 14px;
}

.preview__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.preview__label {
  font-size: 13px;
}

.preview__value {
  font-size: 22px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
}

.preview__formula {
  font-size: 12px;
  line-height: 1.4;
}

.form-summary {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: var(--status-depleted-bg);
  color: var(--status-depleted-ink);
  border-radius: var(--radius-inner);
  padding: 12px 14px;
  outline: none;

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--status-depleted-ink);
  }
}

.form-summary__icon {
  flex: none;
  margin-top: 2px;
}

.form-summary__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-summary__title {
  font-size: 14px;
}

.form-summary__link {
  font-size: 13px;
  color: var(--status-depleted-ink);
  min-height: 24px;
}

.form-alert {
  background: var(--status-depleted-bg);
  color: var(--status-depleted-ink);
  border-radius: var(--radius-inner);
  padding: 12px 14px;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 12px;
}

.cancel,
.submit {
  height: 50px;
  box-sizing: border-box;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: inherit;
  font-size: 16px;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.cancel {
  flex: 1 1 0;
  border: 1px solid var(--control);
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
}

.submit {
  flex: 2 1 0;
  border: none;
  background: var(--accent);
  color: #ffffff;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--accent-ink);
  }

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
}
</style>
