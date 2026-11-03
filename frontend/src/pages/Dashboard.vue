<!--
  首頁 / 儀表板：補貨提醒（task 9.1，REQ-7 / AC-7.4、7.5、7.6）
  設計：設計稿 Dash、Dash-Clear、Dash-First（使用者 2026-11-03 確認，選 A）；design.md v4.3「首頁（儀表板）」
  - 標題「補貨提醒」＋「記一筆」；標題下「11/3（二）· 追蹤中 N 項」
  - 兩格摘要：已耗盡 N 項 / 即將耗盡（7 天內）N 項（0 項改白底灰字）
  - 需要補貨的清單：與商品列表同樣的列（排序、第二行、狀態標籤共用 lib/productView.ts）
  - 庫存正常：最多 5 項（lib/dashboardView.ts 的 NORMAL_MAX），附「全部商品」
  - 沒有需要補貨：說明＋下一個預計用完；有未設定消耗速率的商品時加提示（使用者同意）
  - 還沒有商品：引導新增商品
-->
<template>
  <q-page class="page">
    <div class="page__head">
      <div class="page__heading">
        <h1 class="page__title">補貨提醒</h1>
        <span class="page__meta">{{ meta }}</span>
      </div>
      <router-link v-if="hasProducts" to="/purchases/new" class="add-link">
        <AppIcon name="plus" :size="18" />記一筆
      </router-link>
    </div>

    <p v-if="loading && !productStore.products.length" class="card state">載入中…</p>

    <div v-else-if="loadError" role="alert" class="card state state--error">
      <span>{{ loadError }}</span>
      <button type="button" class="link-button" @click="load">重新載入</button>
    </div>

    <section v-else-if="!hasProducts" class="card first" aria-labelledby="first-title">
      <h2 id="first-title" class="first__title">還沒有任何商品</h2>
      <p class="first__text">新增商品並設定每月或每週用量，快用完的商品就會出現在這裡。</p>
      <router-link to="/products/new" class="first__add">
        <AppIcon name="plus" :size="18" />新增商品
      </router-link>
      <router-link to="/categories" class="first__categories">先整理分類</router-link>
    </section>

    <template v-else>
      <section class="card summary" aria-label="補貨摘要">
        <div
          v-for="item in summary"
          :key="item.key"
          class="summary__item"
          :class="item.count ? `summary__item--${item.key}` : 'summary__item--zero'"
        >
          <span class="summary__label">{{ item.label }}</span>
          <span class="summary__value">{{ item.count }}<small> 項</small></span>
        </div>
      </section>

      <section
        v-if="dashboard.reminders.length"
        class="card list reminders"
        aria-label="需要補貨的商品"
      >
        <router-link
          v-for="view in dashboard.reminders"
          :key="view.record.id"
          :to="`/products/${view.record.id}`"
          class="list__row"
        >
          <span
            class="tile"
            :style="{ background: toneOf(view).bg, color: toneOf(view).ink }"
            aria-hidden="true"
          >
            {{ categoryLabel(categoryName(view.record.category)) }}
          </span>
          <span class="list__text">
            <span class="list__name">{{ view.record.brand }} {{ view.record.name }}</span>
            <span class="list__sub">{{ productSummary(view) }}</span>
          </span>
          <DepletionBadge :status="view.status" :stale="view.stale" />
        </router-link>
      </section>

      <section v-else class="card clear" aria-label="需要補貨的商品">
        <p class="clear__title">目前沒有需要補貨的商品</p>
        <p v-if="nextText" class="clear__next">{{ nextText }}</p>
      </section>

      <section v-if="dashboard.normal.length" class="card normal" aria-labelledby="normal-title">
        <div class="normal__head">
          <h2 id="normal-title" class="normal__title">庫存正常</h2>
          <router-link to="/products" class="normal__all">全部商品</router-link>
        </div>
        <router-link
          v-for="view in dashboard.normal"
          :key="view.record.id"
          :to="`/products/${view.record.id}`"
          class="normal__row"
        >
          <span class="normal__name">{{ view.record.brand }} {{ view.record.name }}</span>
          <span class="normal__when">{{ normalWhen(view) }}</span>
        </router-link>
      </section>

      <p v-if="!dashboard.reminders.length && dashboard.unsetCount" class="unset-note">
        另有 {{ dashboard.unsetCount }} 項商品還沒設定消耗速率，設定後才會出現在這裡。<router-link
          to="/products"
          >到商品頁設定</router-link
        >
      </p>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import DepletionBadge from '@/components/DepletionBadge.vue';
import { localToday } from '@/composables/dates';
import { apiErrorMessage } from '@/lib/errors';
import { categoryLabel, categoryTone } from '@/lib/categoryTone';
import { dashboardOf, formatDayWithWeekday } from '@/lib/dashboardView';
import { formatMonthDay, productSummary, type ProductView } from '@/lib/productView';
import { useCategoryStore } from '@/stores/category';
import { useProductStore } from '@/stores/product';

const categoryStore = useCategoryStore();
const productStore = useProductStore();

const loading = ref(true);
const loadError = ref('');
/** 載入時的「今天」，整頁用同一天計算 */
const today = ref(localToday());

const hasProducts = computed(() => productStore.products.length > 0);
const dashboard = computed(() => dashboardOf(productStore.views(undefined, today.value)));

/** 「11/3（二）· 追蹤中 5 項」（全形括號後不加空格，同設計稿）；還沒有商品時只寫日期 */
const meta = computed(() => {
  const day = formatDayWithWeekday(today.value);
  return hasProducts.value && !loadError.value
    ? `${day}· 追蹤中 ${dashboard.value.trackedCount} 項`
    : day;
});

const summary = computed(() => [
  { key: 'depleted', label: '已耗盡', count: dashboard.value.depletedCount },
  { key: 'soon', label: '即將耗盡（7 天內）', count: dashboard.value.soonCount },
]);

/** 「剩 9 天 · 11/12」 */
function normalWhen(view: ProductView): string {
  if (!view.depletionDate || view.daysLeft === null) return '';
  return `剩 ${view.daysLeft} 天 · ${formatMonthDay(view.depletionDate)}`;
}

/** 「下一個預計用完：黑人 牙膏，11/12（剩 9 天）」 */
const nextText = computed(() => {
  const next = dashboard.value.next;
  if (!next?.depletionDate || next.daysLeft === null) return '';
  return `下一個預計用完：${next.record.brand} ${next.record.name}，${formatMonthDay(next.depletionDate)}（剩 ${next.daysLeft} 天）`;
});

/** 分類 id → 建立順序（決定圖塊顏色） */
const categoryIndex = computed(
  () => new Map(categoryStore.categories.map((c, i) => [c.id, i] as const)),
);

function categoryName(id: string): string {
  return categoryStore.categories.find((c) => c.id === id)?.name ?? '';
}

function toneOf(view: ProductView) {
  return categoryTone(categoryIndex.value.get(view.record.category) ?? -1);
}

async function load() {
  loading.value = true;
  loadError.value = '';
  today.value = localToday();
  try {
    await Promise.all([categoryStore.fetchCategories(), productStore.fetchProducts()]);
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

.add-link,
.first__add {
  height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  background: var(--accent);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.add-link {
  flex: none;
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
}

.state--error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--status-depleted-ink);
}

// ---- 摘要 ----
.summary {
  padding: var(--card-pad);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary__item {
  border-radius: var(--radius-inner);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.summary__item--depleted {
  background: var(--status-depleted-bg);
  color: var(--status-depleted-ink);
}

.summary__item--soon {
  background: var(--status-soon-bg);
  color: var(--status-soon-ink);
}

// 0 項：不用狀態色（沒有東西要提醒）
.summary__item--zero {
  background: var(--ground);
  color: var(--text);

  .summary__label {
    color: var(--muted);
  }
}

.summary__label {
  font-size: 14px;
}

.summary__value {
  font-size: 32px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;

  small {
    font-size: 15px;
  }
}

// ---- 需要補貨的清單（與商品列表相同） ----
.list {
  padding: 2px var(--card-pad);
  display: flex;
  flex-direction: column;
}

.list__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
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

.tile {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-control);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.list__text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.list__name {
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list__sub {
  font-size: 13px;
  color: var(--muted);
}

// ---- 沒有需要補貨 ----
.clear {
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 4px;

  p {
    margin: 0;
  }
}

.clear__title {
  font-size: 16px;
}

.clear__next {
  font-size: 14px;
  line-height: 1.5;
  color: var(--muted);
}

// ---- 庫存正常 ----
.normal {
  padding: 6px var(--card-pad);
  display: flex;
  flex-direction: column;
}

.normal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.normal__title {
  margin: 0;
  font-size: 15px;
  line-height: 1.5; // Quasar 預設 h2 行高很大，要蓋掉
}

.normal__all {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  color: var(--accent);
  text-decoration: none;
}

.normal__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  color: var(--text);
  text-decoration: none;
  border-top: 1px solid var(--rule);

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    border-radius: var(--radius-control);
  }
}

.normal__name {
  font-size: 15px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.normal__when {
  flex: none;
  font-size: 14px;
  color: var(--status-neutral-ink);
  font-variant-numeric: tabular-nums;
}

.unset-note {
  margin: 0;
  padding: 0 4px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);

  a {
    color: var(--accent);
  }
}

// ---- 還沒有商品 ----
.first {
  padding: 20px var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.first__title {
  margin: 0;
  font-size: 18px;
  line-height: 1.4;
}

.first__text {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--muted);
}

.first__add {
  height: 48px;
}

.first__categories {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--accent);
  text-decoration: none;
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
