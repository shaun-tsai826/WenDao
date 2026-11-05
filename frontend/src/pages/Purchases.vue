<!--
  購買記錄列表（task 8.3，REQ-8 / AC-8.1、8.3、8.5、8.6、8.7）
  設計：設計稿 Pur-List、Pur-List-Range；design.md v4.0「購買記錄」
  - 依購入日期由新至舊；每列：新增者頭像、商品名稱、「日期 · 地點 · 分類」、「數量 · 單位均價」、總價
  - 篩選：分類按鈕（放不下換行）＋開始 / 結束日期（含當天）；篩選記在網址 ?category=&start=&end=
    （用 replace，不多一筆瀏覽紀錄；從詳情按上一頁或重新整理都保留，沿用商品列表的做法）
  - 結束日期早於開始日期：ERR-012 顯示在結束日期下方，清單維持上一次的結果
  - 商品名稱、分類、新增者由已載入的清單對照（design.md v3.7：不使用 expand）
-->
<template>
  <q-page class="page">
    <div class="page__head">
      <div class="page__heading">
        <h1 class="page__title">購買記錄</h1>
        <span v-if="ready" class="page__meta"
          >共 {{ purchaseStore.records.length }} 筆 · 新到舊</span
        >
      </div>
      <router-link to="/purchases/new" class="add-link">
        <AppIcon name="plus" :size="18" />新增記錄
      </router-link>
    </div>

    <section aria-label="篩選" class="card filter">
      <div
        v-if="categoryStore.categories.length"
        role="radiogroup"
        aria-label="依分類篩選"
        class="filter__chips"
      >
        <button
          v-for="option in categoryOptions"
          :key="option.id"
          type="button"
          role="radio"
          class="filter__chip touch-target"
          :aria-checked="selected === option.id ? 'true' : 'false'"
          @click="replaceQuery({ category: option.id })"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="filter__dates">
        <div class="field">
          <label for="purchases-start" class="field__label">開始日期</label>
          <input
            id="purchases-start"
            v-model="startInput"
            type="date"
            :min="DATE_MIN"
            :max="DATE_MAX"
            class="control"
            @change="onDateChange"
          />
        </div>
        <div class="field">
          <label for="purchases-end" class="field__label">結束日期（含當天）</label>
          <input
            id="purchases-end"
            v-model="endInput"
            type="date"
            :min="DATE_MIN"
            :max="DATE_MAX"
            class="control"
            :aria-invalid="dateError ? 'true' : undefined"
            :aria-describedby="dateError ? 'purchases-end-error' : undefined"
            @change="onDateChange"
          />
          <span v-if="dateError" id="purchases-end-error" role="alert" class="field__error">
            <AppIcon name="alert" :size="16" class="field__error-icon" />{{ dateError }}
          </span>
        </div>
      </div>
    </section>

    <section aria-label="購買記錄清單" class="card list">
      <p v-if="loading && !purchaseStore.records.length" class="list__state">載入中…</p>

      <div v-else-if="loadError" role="alert" class="list__state list__state--error">
        <span>{{ loadError }}</span>
        <button type="button" class="link-button" @click="load">重新載入</button>
      </div>

      <div v-else-if="!purchaseStore.records.length" class="list__state">
        <template v-if="hasFilter">
          <span>沒有符合條件的記錄</span>
          <button type="button" class="link-button" @click="clearFilter">清除篩選</button>
        </template>
        <template v-else>還沒有購買記錄，按右上角「新增記錄」開始記錄</template>
      </div>

      <template v-else>
        <p v-if="dateError" class="list__note">日期修正前，先顯示上一次的結果</p>
        <router-link
          v-for="row in rows"
          :key="row.id"
          :to="`/purchases/${row.id}`"
          class="list__row"
        >
          <span
            class="avatar"
            role="img"
            :title="row.userName"
            :aria-label="`新增者：${row.userName || '未知'}`"
            :style="{ background: row.tone.bg, color: row.tone.ink }"
          >
            {{ row.initial }}
          </span>
          <span class="row__text">
            <span class="row__name">{{ row.productName }}</span>
            <span class="row__when">{{ row.when }}</span>
            <span class="row__amount">{{ row.amount }}</span>
          </span>
          <span class="row__total">{{ row.total }} 元</span>
        </router-link>
      </template>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { ERR } from '@/constants/messages';
import { localToday } from '@/composables/dates';
import { apiErrorMessage, FieldsValidationError } from '@/lib/errors';
import { personInitial, personTone } from '@/lib/personTone';
import { formatAmount, formatShortDate, purchaseAmountLine } from '@/lib/purchaseView';
import { useCategoryStore } from '@/stores/category';
import { useProductStore } from '@/stores/product';
import { usePurchaseStore, type PurchaseFilters } from '@/stores/purchase';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// 日期欄位的範圍：Chrome 依 max 把年份限制在 4 位數（不然用鍵盤可能打出 202610-03-01 這種年份）
const DATE_MIN = '2000-01-01';
const DATE_MAX = '9999-12-31';

const route = useRoute();
const router = useRouter();
const categoryStore = useCategoryStore();
const productStore = useProductStore();
const purchaseStore = usePurchaseStore();

const loading = ref(true);
const loadError = ref('');
const dateError = ref('');
const today = ref(localToday());
const ready = computed(() => !loading.value && !loadError.value);

// ---- 篩選條件：以網址為準 ----
const queryText = (key: string): string => {
  const value = route.query[key];
  return typeof value === 'string' ? value : '';
};

/** 目前的分類 id；'' = 全部（網址上的分類不存在時當作全部） */
const selected = computed(() => {
  const id = queryText('category');
  return categoryStore.categories.some((c) => c.id === id) ? id : '';
});
const queryStart = computed(() => (DATE_RE.test(queryText('start')) ? queryText('start') : ''));
const queryEnd = computed(() => (DATE_RE.test(queryText('end')) ? queryText('end') : ''));
const hasFilter = computed(() => Boolean(selected.value || queryStart.value || queryEnd.value));

/** 日期欄位目前的值（使用者還在改、可能還不合法，所以和網址分開） */
const startInput = ref('');
const endInput = ref('');

const categoryOptions = computed(() => [
  { id: '', label: '全部' },
  ...categoryStore.categories.map((c) => ({ id: c.id, label: c.name })),
]);

/** 改篩選：用 replace 寫進網址（空的條件不寫） */
function replaceQuery(patch: { category?: string; start?: string; end?: string }) {
  const next = { category: selected.value, start: queryStart.value, end: queryEnd.value, ...patch };
  const query = Object.fromEntries(Object.entries(next).filter(([, value]) => value));
  void router.replace({ query });
}

/** 日期欄位選完（change）：結束早於開始 → ERR-012，不更新篩選 */
function onDateChange() {
  // 年份不是 4 位數這類不合格式的值：先不動篩選（等使用者改好）
  const malformed = [startInput.value, endInput.value].some((v) => v && !DATE_RE.test(v));
  if (malformed) return;
  if (startInput.value && endInput.value && endInput.value < startInput.value) {
    dateError.value = ERR.dateRangeInvalid;
    return;
  }
  dateError.value = '';
  replaceQuery({ start: startInput.value, end: endInput.value });
}

function clearFilter() {
  void router.replace({ query: {} });
}

// ---- 每一列要顯示的資料 ----
const categoryIndex = computed(() => new Map(categoryStore.categories.map((c) => [c.id, c])));

const rows = computed(() =>
  purchaseStore.views.map((view) => {
    const product = productStore.getById(view.record.product);
    const category = product ? categoryIndex.value.get(product.category) : undefined;
    const userName = purchaseStore.userName(view.record.user);
    const when = [formatShortDate(view.date, today.value), view.record.store, category?.name]
      .filter(Boolean)
      .join(' · ');
    return {
      id: view.record.id,
      productName: product ? `${product.brand} ${product.name}` : '（找不到商品）',
      when,
      amount: purchaseAmountLine(view, product?.unit ?? ''),
      total: formatAmount(view.record.total_price),
      userName,
      initial: personInitial(userName),
      tone: personTone(purchaseStore.userIndex(view.record.user)),
    };
  }),
);

// ---- 載入 ----
async function loadRecords() {
  loadError.value = '';
  try {
    // 沒有的條件整個不放（PurchaseFilters 的屬性是選填，不能傳 undefined）
    const filters: PurchaseFilters = {};
    if (selected.value) filters.categoryId = selected.value;
    if (queryStart.value) filters.startDate = queryStart.value;
    if (queryEnd.value) filters.endDate = queryEnd.value;
    await purchaseStore.fetchRecords(filters);
  } catch (err) {
    // 網址上手動寫了結束早於開始：和在欄位裡選錯一樣，顯示在結束日期下方
    if (err instanceof FieldsValidationError && err.fieldErrors.endDate) {
      dateError.value = err.fieldErrors.endDate;
    } else {
      loadError.value = apiErrorMessage(err);
    }
  }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  today.value = localToday();
  try {
    await Promise.all([
      categoryStore.fetchCategories(),
      productStore.fetchProducts(),
      purchaseStore.fetchUsers(),
    ]);
    startInput.value = queryStart.value;
    endInput.value = queryEnd.value;
    await loadRecords();
  } catch (err) {
    loadError.value = apiErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

// 網址上的篩選改了（按分類、選日期、清除篩選、上一頁）→ 同步日期欄位並重新查詢
watch([selected, queryStart, queryEnd], () => {
  if (loading.value) return;
  startInput.value = queryStart.value;
  endInput.value = queryEnd.value;
  dateError.value = '';
  void loadRecords();
});

onMounted(load);
</script>

<style scoped lang="scss">
.page {
  padding: 4px var(--page-margin) 24px;
  display: flex;
  flex-direction: column;
  gap: var(--card-gap);
}

.page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.page__title {
  margin: 0;
  font-size: 26px;
  line-height: 1.3;
}

.page__meta {
  font-size: 14px;
  color: var(--muted);
}

.add-link {
  flex: none;
  height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  background: var(--accent);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  text-decoration: none;

  &:hover {
    background: var(--accent-ink);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.card {
  background: var(--surface);
  border-radius: var(--radius-card);
}

.filter {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 放不下時換行（不橫向捲動、不裁切）
.filter__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter__chip {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--control);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 14px;
  cursor: pointer;

  &[aria-checked='true'] {
    border-color: var(--accent);
    background: var(--accent);
    color: #ffffff;
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.filter__dates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field__label {
  font-size: 13px;
}

.control {
  width: 100%;
  height: 44px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  padding: 0 10px;
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

.field__error {
  display: flex;
  gap: 4px;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.4;
  color: var(--status-depleted-ink);
}

.field__error-icon {
  flex: none;
  margin-top: 1px;
}

.list {
  padding: 2px var(--card-pad);
  display: flex;
  flex-direction: column;
}

.list__state {
  margin: 0;
  padding: 20px 0;
  font-size: 15px;
  color: var(--muted);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.list__state--error {
  gap: 8px;
  color: var(--status-depleted-ink);
}

.list__note {
  margin: 10px 0 2px;
  font-size: 13px;
  color: var(--muted);
}

.list__row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 72px;
  color: var(--text);
  text-decoration: none;

  & + & {
    border-top: 1px solid var(--rule);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    border-radius: var(--radius-control);
  }
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.row__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row__name {
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row__when,
.row__amount {
  font-size: 12px;
  color: var(--muted);
}

.row__total {
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
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
