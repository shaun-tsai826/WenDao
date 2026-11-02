<!--
  編輯分類（task 6.4 刪除分類；task 6.5 補上名稱編輯與自訂欄位管理）
  設計：設計稿「編輯分類」（使用者 2026-11-02 確認）
  - 刪除放在頁面最下方；分類下有商品時停用並寫出原因；可刪除時先跳 CONFIRM-003
  - 頂欄維持品牌與使用者（AC-1.5），返回列放在內容區上方
-->
<template>
  <q-page class="page">
    <div class="back-row">
      <router-link to="/categories" class="back-row__link" aria-label="返回分類管理">
        <AppIcon name="back" />
      </router-link>
      <h1 class="back-row__title">編輯分類</h1>
    </div>

    <p v-if="loading" class="state">載入中…</p>

    <div v-else-if="loadError" role="alert" class="state state--error">
      <span>{{ loadError }}</span>
      <button type="button" class="link-button" @click="load">重新載入</button>
    </div>

    <div v-else-if="!category" class="state">
      <span>找不到這個分類，可能已經被刪除</span>
      <router-link to="/categories" class="link-button">回到分類管理</router-link>
    </div>

    <template v-else>
      <p class="current">{{ category.name }}</p>

      <section class="card danger" aria-labelledby="delete-title">
        <div class="danger__text">
          <h2 id="delete-title" class="danger__title">刪除這個分類</h2>
          <span class="danger__hint">{{ deleteHint }}</span>
        </div>
        <button
          type="button"
          class="danger__button"
          :disabled="!canDelete || deleting"
          @click="remove"
        >
          {{ deleting ? '刪除中…' : '刪除' }}
        </button>
      </section>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { CONFIRM, MSG, withName } from '@/constants/messages';
import { apiErrorMessage } from '@/lib/errors';
import { confirmDelete, notifyError, notifySuccess } from '@/lib/feedback';
import { useCategoryStore } from '@/stores/category';

const route = useRoute();
const router = useRouter();
const categoryStore = useCategoryStore();

const id = computed(() => String(route.params.id));
const category = computed(() => categoryStore.getById(id.value));
const productCount = computed(() => categoryStore.statsOf(id.value).products);
const canDelete = computed(() => productCount.value === 0);
const deleteHint = computed(() =>
  canDelete.value
    ? '分類和它的自訂欄位設定會一起刪除'
    : `此分類下仍有 ${productCount.value} 項商品，要先刪除或移走商品`,
);

const loading = ref(false);
const loadError = ref('');
const deleting = ref(false);

/** 每次進入都重新取得，確保商品數是最新的（另一人可能剛新增商品） */
async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    await Promise.all([categoryStore.fetchCategories(), categoryStore.fetchStats()]);
  } catch (err) {
    loadError.value = apiErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

/** 刪除分類（AC-2.5、2.6）：先確認（CONFIRM-003），成功顯示 MSG-002 並回到列表 */
async function remove() {
  const target = category.value;
  if (!target || !canDelete.value) return;
  if (!(await confirmDelete(withName(CONFIRM.deleteCategory, target.name)))) return;
  deleting.value = true;
  try {
    await categoryStore.deleteCategory(target.id);
    notifySuccess(MSG.categoryDeleted);
    await router.replace('/categories');
  } catch (err) {
    notifyError(apiErrorMessage(err)); // 例如另一人剛好新增商品 → ERR-004
    await categoryStore.fetchStats().catch(() => undefined);
  } finally {
    deleting.value = false;
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

.current {
  margin: 0;
  font-size: 16px;
}

.card {
  background: var(--surface);
  border-radius: var(--radius-card);
}

.state {
  margin: 0;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: var(--muted);
  text-align: center;
}

.state--error {
  color: var(--status-depleted-ink);
}

.danger {
  padding: 14px var(--card-pad);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.danger__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.danger__title {
  margin: 0;
  font-size: 15px;
}

.danger__hint {
  font-size: 13px;
  color: var(--muted);
}

.danger__button {
  flex: none;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--status-depleted-ink);
  border-radius: 999px;
  background: var(--surface);
  color: var(--status-depleted-ink);
  font: inherit;
  font-size: 14px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--status-depleted-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--status-depleted-ink);
    outline-offset: 2px;
  }

  &:disabled {
    border-color: var(--border);
    background: #f6f7f8;
    color: #8a8f94;
    cursor: not-allowed;
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
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
</style>
