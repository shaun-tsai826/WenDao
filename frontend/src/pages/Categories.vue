<!--
  分類管理（task 6.2 列表 AC-2.1、task 6.3 新增 AC-2.2～2.4）
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

    <form class="card add" novalidate @submit.prevent="add">
      <label for="category-new" class="add__label">新增分類</label>
      <div class="add__row">
        <input
          id="category-new"
          ref="nameInput"
          v-model="newName"
          type="text"
          class="add__input"
          placeholder="例如：清潔用品"
          :maxlength="CATEGORY_NAME_MAX"
          autocomplete="off"
          :aria-invalid="addError ? 'true' : undefined"
          :aria-describedby="addError ? 'category-new-error' : undefined"
        />
        <button type="submit" class="add__submit" :disabled="adding">
          {{ adding ? '新增中…' : '新增' }}
        </button>
      </div>
      <span v-if="addError" id="category-new-error" role="alert" class="add__error">
        {{ addError }}
      </span>
    </form>

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
import { notifySuccess } from '@/lib/feedback';
import { MSG } from '@/constants/messages';
import { categoryLabel, categoryTone } from '@/lib/categoryTone';
import { CATEGORY_NAME_MAX, useCategoryStore } from '@/stores/category';

const categoryStore = useCategoryStore();
const loadError = ref('');

const newName = ref('');
const adding = ref(false);
const addError = ref('');
const nameInput = ref<HTMLInputElement | null>(null);

/** 新增分類：空白 ERR-002、重複 ERR-003（顯示在欄位下方）；成功顯示 MSG-001 */
async function add() {
  if (adding.value) return;
  addError.value = '';
  adding.value = true;
  try {
    await categoryStore.createCategory(newName.value);
    newName.value = '';
    notifySuccess(MSG.categoryCreated);
  } catch (err) {
    addError.value = apiErrorMessage(err);
  } finally {
    adding.value = false;
    nameInput.value?.focus();
  }
}

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

.add {
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.add__label {
  font-size: 14px;
}

.add__row {
  display: flex;
  gap: 8px;
}

.add__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 48px;
  box-sizing: border-box;
  border: 1px solid var(--control);
  border-radius: var(--radius-control);
  padding: 0 12px;
  font: inherit;
  font-size: 16px;
  color: var(--text);
  background: var(--surface);
  outline: none;

  &:focus-visible {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }

  &[aria-invalid='true'] {
    border-color: var(--status-depleted-ink);
  }
}

.add__submit {
  flex: none;
  height: 48px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #ffffff;
  font: inherit;
  font-size: 16px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--accent-ink);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
}

.add__error {
  font-size: 13px;
  color: var(--status-depleted-ink);
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
