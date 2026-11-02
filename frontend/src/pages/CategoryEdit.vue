<!--
  編輯分類（task 6.4 刪除分類；task 6.5 名稱編輯與自訂欄位管理）
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
      <form class="card name-form" novalidate @submit.prevent="saveName">
        <label for="category-name" class="name-form__label">分類名稱</label>
        <div class="name-form__row">
          <input
            id="category-name"
            v-model="name"
            type="text"
            class="input"
            :maxlength="CATEGORY_NAME_MAX"
            autocomplete="off"
            :aria-invalid="nameError ? 'true' : undefined"
            :aria-describedby="nameError ? 'category-name-error' : undefined"
          />
          <button type="submit" class="secondary-button" :disabled="savingName">
            {{ savingName ? '儲存中…' : '儲存' }}
          </button>
        </div>
        <span v-if="nameError" id="category-name-error" role="alert" class="error-text">
          {{ nameError }}
        </span>
      </form>

      <section class="card fields" aria-labelledby="fields-title">
        <div class="fields__head">
          <h2 id="fields-title" class="fields__title">自訂欄位</h2>
          <span class="fields__hint">記錄購買時要填的包裝規格；「算數量」的欄位會相乘成總數量</span>
        </div>

        <p v-if="!fieldStore.fields.length" class="fields__empty">
          還沒有自訂欄位。像衛生紙可以加「抽數(單包)」「包數」，系統會自動算出總抽數。
        </p>

        <div v-for="(field, index) in fieldStore.fields" :key="field.id" class="fields__row">
          <button type="button" class="fields__open" @click="openSheet(field)">
            <span class="fields__name">{{ field.field_name }}</span>
            <span class="fields__chips">
              <span class="chip">{{ field.field_type === 'number' ? '數字' : '文字' }}</span>
              <span class="chip" :class="{ 'chip--accent': field.is_quantity_component }">
                {{ field.is_quantity_component ? '算數量' : '只記錄' }}
              </span>
              <span class="fields__usage">{{ usageText(field.id) }}</span>
            </span>
          </button>
          <button
            type="button"
            class="icon-button"
            :disabled="index === 0 || moving"
            :aria-label="`上移「${field.field_name}」`"
            @click="move(field.id, -1)"
          >
            <AppIcon name="up" :size="20" />
          </button>
          <button
            type="button"
            class="icon-button"
            :disabled="index === fieldStore.fields.length - 1 || moving"
            :aria-label="`下移「${field.field_name}」`"
            @click="move(field.id, 1)"
          >
            <AppIcon name="down" :size="20" />
          </button>
        </div>

        <button type="button" class="fields__add" @click="openSheet(null)">
          <AppIcon name="plus" :size="18" />新增欄位
        </button>
      </section>

      <CustomFieldSheet
        v-model="sheetOpen"
        :category-id="id"
        :field="editingField"
        @saved="onFieldSaved"
        @deleted="onFieldDeleted"
      />

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
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import CustomFieldSheet from '@/components/CustomFieldSheet.vue';
import { CONFIRM, MSG, withName } from '@/constants/messages';
import { apiErrorMessage } from '@/lib/errors';
import { confirmDelete, notifyError, notifySuccess } from '@/lib/feedback';
import { CATEGORY_NAME_MAX, useCategoryStore } from '@/stores/category';
import { useCustomFieldStore } from '@/stores/customField';
import type { CustomFieldRecord } from '@/types/models';

const route = useRoute();
const router = useRouter();
const categoryStore = useCategoryStore();
const fieldStore = useCustomFieldStore();

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

// ---- 分類名稱（AC-2.7～2.9）----
const name = ref('');
const nameError = ref('');
const savingName = ref(false);

watch(
  category,
  (c) => {
    if (c) name.value = c.name;
  },
  { immediate: true },
);

async function saveName() {
  if (!category.value || savingName.value) return;
  nameError.value = '';
  savingName.value = true;
  try {
    await categoryStore.updateCategory(category.value.id, name.value);
    notifySuccess(MSG.categoryUpdated); // MSG-008
  } catch (err) {
    nameError.value = apiErrorMessage(err); // ERR-002 / ERR-003
  } finally {
    savingName.value = false;
  }
}

// ---- 自訂欄位（AC-4.1、4.2、4.7～4.11）----
const sheetOpen = ref(false);
const editingField = ref<CustomFieldRecord | null>(null);
const moving = ref(false);

function usageText(fieldId: string): string {
  const used = fieldStore.usageOf(fieldId);
  return used ? `已有 ${used} 筆記錄使用` : '尚未使用';
}

function openSheet(field: CustomFieldRecord | null) {
  editingField.value = field;
  sheetOpen.value = true;
}

function onFieldSaved(kind: 'created' | 'updated') {
  if (kind === 'updated') notifySuccess(MSG.fieldUpdated); // MSG-010
  void categoryStore.fetchStats().catch(() => undefined);
}

function onFieldDeleted() {
  notifySuccess(MSG.fieldDeleted); // MSG-009
  void categoryStore.fetchStats().catch(() => undefined);
}

async function move(fieldId: string, direction: -1 | 1) {
  moving.value = true;
  try {
    await fieldStore.moveField(fieldId, direction);
    notifySuccess(MSG.fieldUpdated); // AC-4.11：修改顯示順序也顯示 MSG-010
  } catch (err) {
    notifyError(apiErrorMessage(err));
  } finally {
    moving.value = false;
  }
}

/** 每次進入都重新取得，確保商品數是最新的（另一人可能剛新增商品） */
async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    await Promise.all([
      categoryStore.fetchCategories(),
      categoryStore.fetchStats(),
      fieldStore.fetchFields(id.value),
    ]);
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

.name-form {
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.name-form__label {
  font-size: 14px;
}

.name-form__row {
  display: flex;
  gap: 8px;
}

.input {
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
  outline: none;

  &:focus-visible {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-soft);
  }

  &[aria-invalid='true'] {
    border-color: var(--status-depleted-ink);
  }
}

.secondary-button {
  flex: none;
  height: 48px;
  padding: 0 18px;
  border: 1px solid var(--control);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 16px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.7;
    cursor: progress;
  }
}

.error-text {
  font-size: 13px;
  color: var(--status-depleted-ink);
}

.fields {
  padding: 14px var(--card-pad) 12px;
  display: flex;
  flex-direction: column;
}

.fields__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 4px;
}

.fields__title {
  margin: 0;
  font-size: 15px;
}

.fields__hint {
  font-size: 12px;
  color: var(--muted);
}

.fields__empty {
  margin: 0;
  padding: 12px 0;
  font-size: 14px;
  color: var(--muted);
}

.fields__row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 64px;

  & + & {
    border-top: 1px solid var(--rule);
  }
}

.fields__open {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 8px 0;
  font: inherit;
  color: var(--text);
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    border-radius: var(--radius-control);
  }
}

.fields__name {
  font-size: 16px;
}

.fields__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
}

.chip {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--status-neutral-bg);
  color: var(--status-neutral-ink);
  white-space: nowrap;
}

.chip--accent {
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.fields__usage {
  padding: 2px 0;
  color: var(--muted);
}

.icon-button {
  flex: none;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-control);
  cursor: pointer;

  &:disabled {
    color: #c2c6cb;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
}

.fields__add {
  margin-top: 4px;
  height: 48px;
  border: none;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-ink);
  font: inherit;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
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
