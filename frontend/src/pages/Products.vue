<!--
  商品列表（task 7.3，REQ-7 / AC-7.3、AC-7.4、AC-7.5、AC-7.7、AC-7.12）
  設計：設計稿 Prod-List（使用者 2026-11-02 確認）、design.md v3.2「商品管理」
  - 依急迫程度排序：已耗盡 → 即將耗盡 → 未設定剩餘數量 → 正常 → 未設定消耗速率
  - 每列：分類圖塊、品牌＋品名、第二行（剩餘數量與預計用完日）、狀態標籤（DepletionBadge）
  - 上方依分類篩選，放不下時換行
  - 久未更新提醒（STATUS-008）在 task 7.8 加入
-->
<template>
  <q-page class="page">
    <div class="page__head">
      <div class="page__heading">
        <h1 class="page__title">商品</h1>
        <span v-if="ready" class="page__meta">共 {{ views.length }} 項 · 最需要補的排在前面</span>
      </div>
      <router-link to="/products/new" class="add-link">
        <AppIcon name="plus" :size="18" />新增商品
      </router-link>
    </div>

    <div
      v-if="categoryStore.categories.length"
      role="radiogroup"
      aria-label="依分類篩選"
      class="filter"
    >
      <button
        v-for="option in filterOptions"
        :key="option.id"
        type="button"
        role="radio"
        class="filter__chip"
        :aria-checked="selected === option.id ? 'true' : 'false'"
        @click="selected = option.id"
      >
        {{ option.label }}
      </button>
    </div>

    <section aria-label="商品清單" class="card list">
      <p v-if="loading && !productStore.products.length" class="list__state">載入中…</p>

      <div v-else-if="loadError" role="alert" class="list__state list__state--error">
        <span>{{ loadError }}</span>
        <button type="button" class="link-button" @click="load">重新載入</button>
      </div>

      <p v-else-if="!views.length" class="list__state">{{ emptyText }}</p>

      <router-link
        v-for="view in views"
        v-else
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
        <DepletionBadge :status="view.status" />
      </router-link>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import DepletionBadge from '@/components/DepletionBadge.vue';
import { apiErrorMessage } from '@/lib/errors';
import { categoryLabel, categoryTone } from '@/lib/categoryTone';
import { productSummary, type ProductView } from '@/lib/productView';
import { localToday } from '@/composables/dates';
import { useCategoryStore } from '@/stores/category';
import { useProductStore } from '@/stores/product';

const ALL = '';

const categoryStore = useCategoryStore();
const productStore = useProductStore();

const loading = ref(true);
const loadError = ref('');
const ready = computed(() => !loading.value && !loadError.value);
/** 目前選的分類 id；'' = 全部 */
const selected = ref(ALL);
/** 載入時的「今天」，整頁用同一天計算 */
const today = ref(localToday());

const filterOptions = computed(() => [
  { id: ALL, label: '全部' },
  ...categoryStore.categories.map((c) => ({ id: c.id, label: c.name })),
]);

const views = computed(() => productStore.views(selected.value || undefined, today.value));

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

const emptyText = computed(() =>
  selected.value === ALL
    ? '還沒有商品，按右上角「新增商品」開始記錄'
    : `「${categoryName(selected.value)}」還沒有商品`,
);

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

// 放不下時換行（design.md：不橫向捲動、不裁切）
.filter {
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

.card {
  background: var(--surface);
  border-radius: var(--radius-card);
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
}

.list__state--error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--status-depleted-ink);
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
