<!--
  更新消耗設定（task 7.6，REQ-7 / AC-7.1、7.8、7.9、7.10、7.11）
  設計：設計稿 Prod-Edit（使用者 2026-11-02 確認）、design.md v3.4「商品管理」
  - 剩餘數量（儲存時更新日自動為當天；清空代表不追蹤）、每月 / 每週、用掉多少、消耗單位、備註
  - 表單下方即時顯示預估用完日（depletionPreview，直接套用 calculateDepletionDate）
  - 數字欄位 inputmode="decimal"，輸入時整理成數字（lib/numberInput.ts）
  - 驗證在 useProductStore.updateProduct：負數 ERR-015、有速率沒單位 ERR-016
  - 成功顯示 MSG-007，回到商品詳情
-->
<template>
  <q-page class="page">
    <div class="back-row">
      <router-link :to="detailPath" class="back-row__link" aria-label="返回商品詳情">
        <AppIcon name="back" />
      </router-link>
      <div class="back-row__text">
        <h1 class="back-row__title">更新消耗設定</h1>
        <span v-if="record" class="back-row__sub">{{ record.brand }} {{ record.name }}</span>
      </div>
    </div>

    <p v-if="loading" class="card state">載入中…</p>

    <div v-else-if="loadError" role="alert" class="card state state--error">
      <span>{{ loadError }}</span>
      <button type="button" class="link-button" @click="load">重新載入</button>
    </div>

    <p v-else-if="!record" class="card state">
      找不到這個商品，可能已被刪除。
      <router-link to="/products">回到商品列表</router-link>
    </p>

    <form v-else class="form" novalidate @submit.prevent="submit">
      <section class="card group">
        <label for="e-remain" class="field__label">現在還剩多少</label>
        <div class="remain" :class="{ 'remain--invalid': invalid.has('e-remain') }">
          <input
            id="e-remain"
            ref="remainInput"
            :value="form.remaining"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            class="remain__input"
            aria-describedby="e-remain-hint"
            :aria-invalid="ariaInvalid('e-remain')"
            @input="onDecimal('remaining', $event, true)"
          />
          <span v-if="form.consumption_unit.trim()" class="remain__unit">
            {{ form.consumption_unit.trim() }}
          </span>
        </div>
        <span id="e-remain-hint" class="field__hint">{{ remainHint }}</span>
      </section>

      <section class="card group group--gap">
        <div class="field">
          <span id="e-rate-label" class="field__label">平常多久用掉多少</span>
          <div class="period" role="radiogroup" aria-labelledby="e-rate-label">
            <label
              v-for="option in PERIODS"
              :key="option.value"
              class="period__option"
              :class="{ 'period__option--checked': form.period === option.value }"
            >
              <input v-model="form.period" type="radio" name="period" :value="option.value" />
              {{ option.label }}
            </label>
          </div>
        </div>

        <div class="field-pair">
          <div class="field">
            <label for="e-rate" class="field__label">用掉</label>
            <input
              id="e-rate"
              :value="form.rate"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              class="control control--number"
              @input="onDecimal('rate', $event, false)"
            />
          </div>
          <div class="field">
            <label for="e-cunit" class="field__label">消耗單位</label>
            <input
              id="e-cunit"
              ref="unitInput"
              v-model="form.consumption_unit"
              type="text"
              autocomplete="off"
              class="control"
              placeholder="例如：包"
              :aria-invalid="ariaInvalid('e-cunit')"
              @input="clearInvalid('e-cunit')"
            />
          </div>
        </div>

        <div class="field">
          <label for="e-note" class="field__label">
            備註<span class="field__optional">（選填）</span>
          </label>
          <textarea
            id="e-note"
            v-model="form.note"
            rows="2"
            class="control control--textarea"
            placeholder="例如：2026 年預計消耗 48 包"
          ></textarea>
        </div>
      </section>

      <div class="preview" role="status">
        <template v-if="estimate">
          <span class="preview__label">依這個設定</span>
          <span class="preview__headline">{{ estimate.headline }}</span>
          <span class="preview__formula">{{ estimate.formula }}</span>
        </template>
        <span v-else class="preview__hint">{{ previewHint }}</span>
      </div>

      <div v-if="error" role="alert" class="form-alert">
        <AppIcon name="alert" :size="18" class="form-alert__icon" />
        <span>{{ error }}</span>
      </div>

      <div class="actions">
        <router-link :to="detailPath" class="cancel">取消</router-link>
        <button type="submit" class="submit" :disabled="saving">
          {{ saving ? '儲存中…' : '儲存' }}
        </button>
      </div>
    </form>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { ERR, MSG } from '@/constants/messages';
import { localToday, toDateOnly } from '@/composables/dates';
import { apiErrorMessage } from '@/lib/errors';
import { notifySuccess } from '@/lib/feedback';
import { parseDecimal, sanitizeDecimal } from '@/lib/numberInput';
import { depletionPreview, formatMonthDay, formatQuantity } from '@/lib/productView';
import { useProductStore } from '@/stores/product';
import type { ProductRecord } from '@/types/models';

type Period = 'monthly' | 'weekly';
type FieldId = 'e-remain' | 'e-cunit';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'monthly', label: '每月' },
  { value: 'weekly', label: '每週' },
];

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();

const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const error = ref('');
const invalid = ref(new Set<FieldId>());
const today = ref(localToday());
const record = ref<ProductRecord | null>(null);
/** 表單（數字欄位先存文字，送出前才轉成數字） */
interface EditForm {
  remaining: string;
  period: Period;
  rate: string;
  consumption_unit: string;
  note: string;
}

const form = reactive<EditForm>({
  remaining: '',
  period: 'monthly',
  rate: '',
  consumption_unit: '',
  note: '',
});

const remainInput = ref<HTMLInputElement | null>(null);
const unitInput = ref<HTMLInputElement | null>(null);

const productId = computed(() => String(route.params.id ?? ''));
const detailPath = computed(() => `/products/${productId.value}`);

/** 「儲存時記為今天（11/2）更新；上次更新 10/24。清空代表不追蹤剩餘數量」 */
const remainHint = computed(() => {
  const last = toDateOnly(record.value?.remaining_updated_at);
  const lastText = last ? `；上次更新 ${formatMonthDay(last)}` : '';
  return `儲存時記為今天（${formatMonthDay(today.value)}）更新${lastText}。清空代表不追蹤剩餘數量`;
});

const estimate = computed(() =>
  depletionPreview(parseDecimal(form.remaining), parseDecimal(form.rate), form.period, today.value),
);

const previewHint = computed(() => {
  if ((parseDecimal(form.remaining) ?? 0) < 0) return '修正剩餘數量後，就能預估用完日';
  if ((parseDecimal(form.rate) ?? 0) <= 0) return '填入「用掉」多少，就能預估用完日';
  return '填入現在還剩多少，就能預估用完日';
});

const ariaInvalid = (id: FieldId) => (invalid.value.has(id) ? 'true' : undefined);

function clearInvalid(id: FieldId) {
  if (invalid.value.has(id)) {
    const next = new Set(invalid.value);
    next.delete(id);
    invalid.value = next;
  }
}

/** 數字欄位：輸入時整理（去掉文字、全形轉半形），畫面上的值同步改成整理後的結果 */
function onDecimal(field: 'remaining' | 'rate', event: Event, allowNegative: boolean) {
  const input = event.target as HTMLInputElement;
  const clean = sanitizeDecimal(input.value, { allowNegative });
  form[field] = clean;
  if (input.value !== clean) input.value = clean;
  if (field === 'remaining') clearInvalid('e-remain');
}

function fillForm(p: ProductRecord) {
  const hasRemaining = Boolean(toDateOnly(p.remaining_updated_at));
  form.remaining = hasRemaining ? formatQuantity(p.remaining_quantity) : '';
  form.period = p.consumption_period || 'monthly';
  form.rate = p.consumption_rate > 0 ? formatQuantity(p.consumption_rate) : '';
  form.consumption_unit = p.consumption_unit;
  form.note = p.consumption_note;
}

async function submit() {
  if (saving.value || !record.value) return;
  error.value = '';
  invalid.value = new Set();
  saving.value = true;
  const rate = parseDecimal(form.rate);
  try {
    await productStore.updateProduct(record.value.id, {
      remaining_quantity: parseDecimal(form.remaining),
      consumption_rate: rate,
      consumption_period: rate ? form.period : null,
      consumption_unit: form.consumption_unit,
      consumption_note: form.note,
    });
    notifySuccess(MSG.productUpdated);
    // 從商品詳情進來的就回上一頁（不多一筆紀錄），否則換成商品詳情
    if (router.options.history.state.back === detailPath.value) router.back();
    else await router.replace(detailPath.value);
  } catch (err) {
    error.value = apiErrorMessage(err);
    const field: FieldId | null =
      error.value === ERR.remainingNegative
        ? 'e-remain'
        : error.value === ERR.consumptionUnitRequired
          ? 'e-cunit'
          : null;
    if (field) {
      invalid.value = new Set([field]);
      await nextTick();
      (field === 'e-remain' ? remainInput : unitInput).value?.focus();
    }
  } finally {
    saving.value = false;
  }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  today.value = localToday();
  try {
    await productStore.fetchProducts();
    record.value = productStore.getById(productId.value) ?? null;
    if (record.value) fillForm(record.value);
  } catch (err) {
    loadError.value = apiErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped lang="scss">
.page {
  padding: 0 var(--page-margin) 24px;
  display: flex;
  flex-direction: column;
  gap: var(--card-gap);
}

.back-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: -10px;
}

.back-row__link {
  flex: none;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  border-radius: var(--radius-control);

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
}

.back-row__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.back-row__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
}

.back-row__sub {
  font-size: 13px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card {
  background: var(--surface);
  border-radius: var(--radius-card);
}

.state {
  margin: 0;
  padding: 20px var(--card-pad);
  font-size: 15px;
  color: var(--muted);
  text-align: center;
  line-height: 1.6;

  a {
    color: var(--accent);
  }
}

.state--error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--status-depleted-ink);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--card-gap);
}

.group {
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group--gap {
  gap: 12px;
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
}

.field__label {
  font-size: 14px;
}

.field__optional {
  color: var(--muted);
}

.field__hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}

// 剩餘數量：輸入框＋單位放在同一個框裡
.remain {
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  background: var(--surface);

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }
}

// 有錯誤時即使聚焦也維持紅框（不被上面的藍色聚焦外框蓋掉）
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

.period {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.period__option {
  height: 44px;
  border-radius: var(--radius-control);
  border: 1px solid var(--control);
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 15px;
  cursor: pointer;

  input {
    margin: 0;
    accent-color: var(--accent);
  }

  &:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.period__option--checked {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.control {
  width: 100%;
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  padding: 0 12px;
  font: inherit;
  font-size: 16px; // 小於 16px 時 iOS 會自動放大畫面
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

.control--number {
  font-variant-numeric: tabular-nums;
}

.control--textarea {
  height: auto;
  padding: 10px 12px;
  resize: none;
  line-height: 1.5;
}

.preview {
  background: var(--accent-soft);
  color: var(--accent-ink);
  border-radius: var(--radius-inner);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview__label {
  font-size: 13px;
}

.preview__headline {
  font-size: 17px;
}

.preview__formula {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.preview__hint {
  font-size: 14px;
}

.form-alert {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: var(--status-depleted-bg);
  color: var(--status-depleted-ink);
  border-radius: var(--radius-inner);
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.5;
}

.form-alert__icon {
  flex: none;
  margin-top: 2px;
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

.link-button {
  min-height: 44px;
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--accent);
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}
</style>
