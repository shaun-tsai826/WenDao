<!--
  分類管理（task 6.2，AC-2.1）
  設計：設計稿「分類管理 · 列表與新增」（使用者 2026-11-02 確認）
  - 每列：分類圖塊（依建立順序配色）、名稱、商品數與自訂欄位數，點選進入編輯分類
  - 載入中、載入失敗（可重試）、沒有分類時都有對應畫面
-->
<template>
  <q-page class="page">
    <div class="page__head">
      <h1 class="page__title">分類管理</h1>
      <span v-if="!categoryStore.loading && !loadError" class="page__meta">
        共 {{ categoryStore.categories.length }} 個分類
      </span>
    </div>

    <section aria-label="分類清單" class="card list">
      <p v-if="categoryStore.loading && !categoryStore.categories.length" class="list__state">
        載入中…
      </p>

      <div v-else-if="loadError" role="alert" class="list__state list__state--error">
        <span>{{ loadError }}</span>
        <button type="button" class="link-button" @click="load">重新載入</button>
      </div>

      <p v-else-if="!categoryStore.categories.length" class="list__state">
        還沒有分類，先在上面新增一個吧（例如「衛生紙」）
      </p>

      <router-link
        v-for="(category, index) in categoryStore.categories"
        v-else
        :key="category.id"
        :to="`/categories/${category.id}/edit`"
        class="list__row"
      >
        <span
          class="tile"
          :style="{ background: categoryTone(index).bg, color: categoryTone(index).ink }"
          aria-hidden="true"
        >
          {{ categoryLabel(category.name) }}
        </span>
        <span class="list__text">
          <span class="list__name">{{ category.name }}</span>
          <span class="list__sub">{{ summary(category.id) }}</span>
        </span>
        <AppIcon name="chevron" :size="18" class="list__chevron" />
      </router-link>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { apiErrorMessage } from '@/lib/errors';
import { categoryLabel, categoryTone } from '@/lib/categoryTone';
import { useCategoryStore } from '@/stores/category';

const categoryStore = useCategoryStore();
const loadError = ref('');

/** 「1 項商品 · 3 個自訂欄位」 */
function summary(id: string): string {
  const { products, fields } = categoryStore.statsOf(id);
  return `${products} 項商品 · ${fields ? `${fields} 個自訂欄位` : '沒有自訂欄位'}`;
}

async function load() {
  loadError.value = '';
  try {
    await Promise.all([categoryStore.fetchCategories(), categoryStore.fetchStats()]);
  } catch (err) {
    loadError.value = apiErrorMessage(err);
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
  flex-direction: column;
  gap: 2px;
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

.card {
  background: var(--surface);
  border-radius: var(--radius-card);
}

.list {
  padding: 4px var(--card-pad);
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

.list__chevron {
  flex: none;
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
