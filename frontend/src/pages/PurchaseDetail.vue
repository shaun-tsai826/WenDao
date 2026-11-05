<!--
  購買記錄詳情（task 8.5，REQ-5 / AC-5.6，REQ-6 / AC-6.2、AC-6.5，REQ-8 / AC-8.9、AC-8.10）
  設計：設計稿 Pur-Detail（使用者 2026-11-03 確認）、design.md v4.0「購買記錄 › 購買記錄詳情」
  - 商品卡：分類圖塊、商品名稱（連到商品詳情）、分類、總價
  - 購入日期、購買地點、新增者（頭像＋名稱＋新增時間）
  - 包裝規格欄位值（依欄位順序，只列有填的）
  - 總數量與單位均價（缺失時「未填」/ STATUS-001「無法計算」）
  - 價格比較：圖示＋文字＋顏色（高於↑琥珀、低於↓綠、相同＝灰、無法比較灰＋原因），
    另寫每單位差額與百分比、歷史均價用了幾筆（含這一筆）
  - 底部「編輯這筆記錄」（task 8.6）、「刪除這筆記錄」（紅字，task 8.7）：
    CONFIRM-001 對話框寫出是哪一筆 → 刪除 → MSG-006 → 回購買記錄列表（保留篩選）；失敗時提示錯誤、留在詳情
-->
<template>
  <q-page class="page">
    <div class="back-row">
      <router-link :to="backTo" class="back-row__link" aria-label="返回購買記錄">
        <AppIcon name="back" />
      </router-link>
      <h1 class="back-row__title">購買記錄詳情</h1>
    </div>

    <p v-if="loading" class="card state">載入中…</p>

    <div v-else-if="loadError" role="alert" class="card state state--error">
      <span>{{ loadError }}</span>
      <button type="button" class="link-button" @click="load">重新載入</button>
    </div>

    <p v-else-if="!view" class="card state">
      找不到這筆記錄，可能已被刪除。
      <router-link to="/purchases">回到購買記錄</router-link>
    </p>

    <template v-else>
      <section class="card record" aria-labelledby="record-product">
        <div class="record__head">
          <span class="tile" :style="{ background: tone.bg, color: tone.ink }" aria-hidden="true">
            {{ categoryLabel(categoryName) }}
          </span>
          <div class="record__title">
            <h2 id="record-product" class="record__product">
              <router-link v-if="product" :to="`/products/${product.id}`" class="touch-target">
                {{ product.brand }} {{ product.name }}
              </router-link>
              <template v-else>（商品不存在）</template>
            </h2>
            <span v-if="categoryName" class="record__category">{{ categoryName }}</span>
          </div>
          <span class="record__total">
            {{ formatAmount(view.record.total_price) }}<small> 元</small>
          </span>
        </div>

        <dl class="facts">
          <dt>購入日期</dt>
          <dd class="facts__date">{{ view.date ? formatLongDate(view.date) : '—' }}</dd>
          <dt>購買地點</dt>
          <dd class="facts__store">{{ view.record.store || '—' }}</dd>
          <dt>新增者</dt>
          <dd class="facts__creator">
            <span
              class="avatar"
              aria-hidden="true"
              :style="{ background: creatorTone.bg, color: creatorTone.ink }"
            >
              {{ personInitial(creatorName) }}
            </span>
            <span class="facts__name">{{ creatorName || '未知' }}</span>
            <span v-if="createdAt" class="facts__time">· {{ createdAt }} 新增</span>
          </dd>
        </dl>

        <div v-if="fieldTiles.length" class="fields" aria-label="包裝規格">
          <div v-for="f in fieldTiles" :key="f.id" class="field">
            <span class="field__label">{{ f.label }}</span>
            <span class="field__value">{{ f.value }}</span>
          </div>
        </div>

        <div class="summary">
          <div class="summary__item">
            <span class="summary__label">總數量</span>
            <span class="summary__value">
              <template v-if="view.quantity !== null">
                {{ formatAmount(view.quantity) }}<small>{{ ` ${unit}` }}</small>
              </template>
              <template v-else>未填</template>
            </span>
          </div>
          <div class="summary__item">
            <span class="summary__label">單位均價</span>
            <span class="summary__value">
              <template v-if="view.unitPrice !== null">
                {{ formatUnitPrice(view.unitPrice) }}<small> 元/{{ unit }}</small>
              </template>
              <template v-else>{{ STATUS.cannotCalculate }}</template>
            </span>
          </div>
        </div>

        <div
          v-if="comparison"
          class="compare"
          :class="`compare--${comparison.kind}`"
          aria-labelledby="compare-title"
        >
          <AppIcon :name="COMPARISON_ICON[comparison.kind]" :size="20" class="compare__icon" />
          <div class="compare__text">
            <span id="compare-title" class="compare__title">{{ comparison.title }}</span>
            <span v-if="comparison.detail" class="compare__detail">{{ comparison.detail }}</span>
            <span v-if="comparison.basis" class="compare__basis">{{ comparison.basis }}</span>
          </div>
        </div>
      </section>

      <div class="actions">
        <router-link :to="`/purchases/${view.record.id}/edit`" class="edit-link">
          編輯這筆記錄
        </router-link>
        <button type="button" class="delete-button" :disabled="busy" @click="remove">
          {{ deleting ? '刪除中…' : '刪除這筆記錄' }}
        </button>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon, { type IconName } from '@/components/AppIcon.vue';
import { MSG, STATUS } from '@/constants/messages';
import { localToday } from '@/composables/dates';
import type { PriceComparison } from '@/composables/usePriceComparison';
import { apiErrorMessage } from '@/lib/errors';
import { categoryLabel, categoryTone } from '@/lib/categoryTone';
import { confirmDeleteRecord, notifyError, notifySuccess } from '@/lib/feedback';
import { personInitial, personTone } from '@/lib/personTone';
import {
  formatAmount,
  formatCreatedAt,
  formatLongDate,
  formatUnitPrice,
  priceComparisonOf,
  purchaseSummary,
  toPurchaseView,
  type PurchaseView,
} from '@/lib/purchaseView';
import { useCategoryStore } from '@/stores/category';
import { useCustomFieldStore } from '@/stores/customField';
import { useProductStore } from '@/stores/product';
import { usePurchaseStore } from '@/stores/purchase';
import type { CustomFieldRecord, FieldValueRecord, PurchaseRecordRecord } from '@/types/models';

const COMPARISON_ICON: Record<PriceComparison, IconName> = {
  higher: 'arrow-up',
  lower: 'arrow-down',
  equal: 'equal',
  na: 'not-comparable',
};

const route = useRoute();
const router = useRouter();
const categoryStore = useCategoryStore();
const customFieldStore = useCustomFieldStore();
const productStore = useProductStore();
const purchaseStore = usePurchaseStore();

const loading = ref(true);
const loadError = ref('');
/** 確認對話框開著或刪除進行中（停用按鈕，避免重複開對話框、重複送出） */
const busy = ref(false);
/** 已按「刪除」、等待伺服器回應（按鈕寫「刪除中…」；對話框還開著時不寫，以免誤會已經在刪） */
const deleting = ref(false);
const today = ref(localToday());
const record = ref<PurchaseRecordRecord | null>(null);
/** 同一商品的全部購買記錄（含這一筆），算歷史均價用（AC-8.4） */
const history = ref<PurchaseView[]>([]);
const fieldValues = ref<FieldValueRecord[]>([]);
const fields = ref<CustomFieldRecord[]>([]);

const recordId = computed(() => String(route.params.id ?? ''));

/** 從購買記錄列表（可能帶篩選）進來時，返回到同一個網址；其他情況回購買記錄列表 */
const previous = router.options.history.state.back;
const backTo =
  typeof previous === 'string' && /^\/purchases(\?|$)/.test(previous) ? previous : '/purchases';

const view = computed(() => (record.value ? toPurchaseView(record.value) : null));
const product = computed(() =>
  record.value ? productStore.getById(record.value.product) : undefined,
);
const unit = computed(() => product.value?.unit ?? '');

const categoryIndex = computed(() =>
  categoryStore.categories.findIndex((c) => c.id === product.value?.category),
);
const categoryName = computed(() => categoryStore.categories[categoryIndex.value]?.name ?? '');
const tone = computed(() => categoryTone(categoryIndex.value));

const creatorName = computed(() => purchaseStore.userName(record.value?.user ?? ''));
const creatorTone = computed(() => personTone(purchaseStore.userIndex(record.value?.user ?? '')));
const createdAt = computed(() => formatCreatedAt(record.value?.created ?? '', today.value));

/** 包裝規格：依欄位順序，只列有填值的欄位；數字欄位加千分位 */
const fieldTiles = computed(() =>
  fields.value.flatMap((f) => {
    const raw = fieldValues.value.find((v) => v.custom_field === f.id)?.field_value.trim() ?? '';
    if (!raw) return [];
    const n = Number(raw);
    const value = f.field_type === 'number' && Number.isFinite(n) ? formatAmount(n) : raw;
    return [{ id: f.id, label: f.field_name, value }];
  }),
);

const comparison = computed(() =>
  view.value ? priceComparisonOf(view.value, history.value, unit.value) : null,
);

/** 刪除這筆記錄（AC-5.8、5.9）：先確認，刪除後回列表 */
async function remove() {
  const current = view.value;
  if (!current || busy.value) return;
  busy.value = true;
  try {
    const name = product.value ? `${product.value.brand} ${product.value.name}` : '';
    if (!(await confirmDeleteRecord(purchaseSummary(current, name, today.value)))) return;
    deleting.value = true;
    await purchaseStore.deleteRecord(current.record.id);
    notifySuccess(MSG.recordDeleted);
    await router.replace(backTo);
  } catch (err) {
    notifyError(apiErrorMessage(err));
  } finally {
    busy.value = false;
    deleting.value = false;
  }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  today.value = localToday();
  try {
    const [found] = await Promise.all([
      purchaseStore.fetchRecord(recordId.value),
      purchaseStore.fetchUsers(),
      categoryStore.fetchCategories(),
      productStore.fetchProducts(),
    ]);
    record.value = found;
    if (!found) return;
    const categoryId = productStore.getById(found.product)?.category;
    const [all, values, defs] = await Promise.all([
      purchaseStore.fetchByProduct(found.product),
      purchaseStore.fetchFieldValues(found.id),
      categoryId ? customFieldStore.listFields(categoryId) : Promise.resolve([]),
    ]);
    history.value = all;
    fieldValues.value = values;
    fields.value = defs;
  } catch (err) {
    loadError.value = apiErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(recordId, load);
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

.back-row__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
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

.record {
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.record__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tile {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-control);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.record__title {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record__product {
  margin: 0;
  font-size: 18px;
  line-height: 1.4; // Quasar 預設 h2 行高很大，要蓋掉
  overflow-wrap: anywhere;

  a {
    color: var(--text);

    &:hover {
      color: var(--accent);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }
}

.record__category {
  font-size: 13px;
  color: var(--muted);
}

.record__total {
  flex: none;
  font-size: 22px;
  font-variant-numeric: tabular-nums;

  small {
    font-size: 14px;
  }
}

.facts {
  margin: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 10px;
  font-size: 15px;

  dt {
    color: var(--muted);
    font-size: 14px;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
}

.facts__creator {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 8px;
}

.facts__time {
  font-size: 13px;
  color: var(--muted);
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.field {
  background: var(--ground);
  border-radius: var(--radius-inner);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.field__label {
  font-size: 12px;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.field__value {
  font-size: 17px;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.summary {
  background: var(--accent-soft);
  color: var(--accent-ink);
  border-radius: var(--radius-inner);
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.summary__label {
  font-size: 13px;
}

.summary__value {
  font-size: 22px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;

  small {
    font-size: 14px;
  }
}

// 價格比較：圖示＋文字＋顏色，不只靠顏色
.compare {
  border-radius: var(--radius-inner);
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: var(--status-neutral-bg);
  color: var(--status-neutral-ink);
}

.compare--higher {
  background: var(--status-soon-bg);
  color: var(--status-soon-ink);
}

.compare--lower {
  background: var(--price-lower-bg);
  color: var(--price-lower-ink);
}

.compare__icon {
  flex: none;
  margin-top: 2px;
}

.compare__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.compare__title {
  font-size: 16px;
}

.compare__detail {
  font-size: 13px;
}

.compare__basis {
  font-size: 12px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-link {
  min-height: 48px;
  border-radius: 999px;
  border: 1px solid var(--control);
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  text-decoration: none;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.delete-button {
  min-height: 48px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--danger);
  font: inherit;
  font-size: 15px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--danger);
    outline-offset: 2px;
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
