<!--
  新增商品（task 7.4，REQ-3 / AC-3.1～3.6）
  設計：設計稿 Prod-New（使用者 2026-11-02 確認）、design.md v3.3「商品管理」
  - 分類、品牌、品名、計價單位（附常用單位按鈕）、消耗單位（選填），欄位下方以白話說明用途
  - 驗證在 useProductStore.createProduct：品牌或品名空白 ERR-005、計價單位空白 ERR-006、重複 ERR-007
  - 錯誤顯示在送出按鈕上方（role=alert），並標示有問題的欄位、把焦點移過去
  - 成功顯示 MSG-003，進入新商品的詳情頁（replace，上一頁回到商品列表）
  - 從篩選過的列表進來（?category=）時預先選好該分類
-->
<template>
  <q-page class="page">
    <div class="back-row">
      <router-link :to="backTo" class="back-row__link" aria-label="返回商品">
        <AppIcon name="back" />
      </router-link>
      <h1 class="back-row__title">新增商品</h1>
    </div>

    <p v-if="loading" class="card state">載入中…</p>

    <div v-else-if="loadError" role="alert" class="card state state--error">
      <span>{{ loadError }}</span>
      <button type="button" class="link-button" @click="load">重新載入</button>
    </div>

    <p v-else-if="!categoryStore.categories.length" class="card state empty">
      要先建立分類，才能新增商品。
      <router-link to="/categories">前往分類管理</router-link>
    </p>

    <form v-else class="card form" novalidate @submit.prevent="submit">
      <div class="field">
        <label for="p-cat" class="field__label">分類</label>
        <select
          id="p-cat"
          v-model="form.category"
          class="control"
          :aria-invalid="ariaInvalid('p-cat')"
          @change="clearInvalid('p-cat')"
        >
          <option v-for="c in categoryStore.categories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <div class="field-pair">
        <div class="field">
          <label for="p-brand" class="field__label">品牌</label>
          <input
            id="p-brand"
            ref="brandInput"
            v-model="form.brand"
            type="text"
            class="control"
            placeholder="例如：春風"
            autocomplete="off"
            :aria-invalid="ariaInvalid('p-brand')"
            :aria-describedby="error ? 'p-error' : undefined"
            @input="clearInvalid('p-brand')"
          />
        </div>
        <div class="field">
          <label for="p-name" class="field__label">品名</label>
          <input
            id="p-name"
            ref="nameInput"
            v-model="form.name"
            type="text"
            class="control"
            placeholder="例如：洗碗精"
            autocomplete="off"
            :aria-invalid="ariaInvalid('p-name')"
            :aria-describedby="error ? 'p-error' : undefined"
            @input="clearInvalid('p-name')"
          />
        </div>
      </div>

      <div class="field">
        <label for="p-unit" class="field__label">計價單位</label>
        <input
          id="p-unit"
          ref="unitInput"
          v-model="form.unit"
          type="text"
          class="control"
          autocomplete="off"
          :aria-invalid="ariaInvalid('p-unit')"
          aria-describedby="p-unit-hint"
          @input="clearInvalid('p-unit')"
        />
        <div class="unit-chips" role="group" aria-label="常用單位">
          <button
            v-for="u in COMMON_UNITS"
            :key="u"
            type="button"
            class="unit-chip"
            :aria-pressed="form.unit.trim() === u ? 'true' : 'false'"
            @click="pickUnit(u)"
          >
            {{ u }}
          </button>
        </div>
        <span id="p-unit-hint" class="field__hint">用來算單位均價，例如「每抽多少錢」</span>
      </div>

      <div class="field">
        <label for="p-cunit" class="field__label">
          消耗單位<span class="field__optional">（選填）</span>
        </label>
        <input
          id="p-cunit"
          v-model="form.consumption_unit"
          type="text"
          class="control"
          placeholder="例如：包"
          autocomplete="off"
          aria-describedby="p-cunit-hint"
        />
        <span id="p-cunit-hint" class="field__hint">
          用來算「多久用完」，例如衛生紙是一次用掉一「包」
        </span>
      </div>

      <div v-if="error" id="p-error" role="alert" class="form-alert">
        <AppIcon name="alert" :size="18" class="form-alert__icon" />
        <span>
          <span class="form-alert__title">{{ error.title }}</span>
          <span v-if="error.detail" class="form-alert__detail">{{ error.detail }}</span>
        </span>
      </div>

      <button type="submit" class="submit" :disabled="saving">
        {{ saving ? '建立中…' : '建立商品' }}
      </button>
    </form>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { apiErrorMessage, DuplicateProductError } from '@/lib/errors';
import { notifySuccess } from '@/lib/feedback';
import { ERR, MSG } from '@/constants/messages';
import { useCategoryStore } from '@/stores/category';
import { useProductStore } from '@/stores/product';

/** 常用計價單位（design.md v3.2 商品管理） */
const COMMON_UNITS = ['抽', '片', '包', '個', 'ml', 'g'] as const;

type FieldId = 'p-cat' | 'p-brand' | 'p-name' | 'p-unit';

const route = useRoute();
const router = useRouter();
const categoryStore = useCategoryStore();
const productStore = useProductStore();

const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const form = reactive({ category: '', brand: '', name: '', unit: '', consumption_unit: '' });
const error = ref<{ title: string; detail?: string } | null>(null);
const invalid = ref(new Set<FieldId>());

const brandInput = ref<HTMLInputElement | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const unitInput = ref<HTMLInputElement | null>(null);

/** 網址上帶的分類（從篩選過的商品列表進來） */
const queryCategory = computed(() =>
  typeof route.query.category === 'string' ? route.query.category : '',
);

/** 返回時回到原本的篩選 */
const backTo = computed(() =>
  queryCategory.value
    ? { path: '/products', query: { category: queryCategory.value } }
    : '/products',
);

const ariaInvalid = (id: FieldId) => (invalid.value.has(id) ? 'true' : undefined);

function clearInvalid(id: FieldId) {
  if (invalid.value.has(id)) {
    const next = new Set(invalid.value);
    next.delete(id);
    invalid.value = next;
  }
}

function pickUnit(unit: string) {
  form.unit = unit;
  clearInvalid('p-unit');
}

/** 依錯誤訊息決定要標示哪些欄位 */
function invalidFieldsFor(err: unknown, message: string): FieldId[] {
  if (err instanceof DuplicateProductError) return ['p-brand', 'p-name'];
  if (message === ERR.brandNameEmpty) {
    const fields: FieldId[] = [];
    if (!form.brand.trim()) fields.push('p-brand');
    if (!form.name.trim()) fields.push('p-name');
    return fields;
  }
  if (message === ERR.unitRequired) return ['p-unit'];
  if (message === ERR.required) return ['p-cat'];
  return [];
}

function focusField(id: FieldId | undefined) {
  const el = {
    'p-brand': brandInput.value,
    'p-name': nameInput.value,
    'p-unit': unitInput.value,
    'p-cat': null,
  }[id ?? 'p-cat'];
  el?.focus();
}

async function submit() {
  if (saving.value) return;
  error.value = null;
  invalid.value = new Set();
  saving.value = true;
  try {
    const created = await productStore.createProduct({ ...form });
    notifySuccess(MSG.productCreated);
    await router.replace(`/products/${created.id}`);
  } catch (err) {
    const title = apiErrorMessage(err);
    error.value =
      err instanceof DuplicateProductError
        ? {
            title,
            detail: `已有「${err.existing.brand} ${err.existing.name}」（大小寫、全半形不同也算同一個）`,
          }
        : { title };
    const fields = invalidFieldsFor(err, title);
    invalid.value = new Set(fields);
    await nextTick();
    focusField(fields[0]);
  } finally {
    saving.value = false;
  }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    await categoryStore.fetchCategories();
    const ids = categoryStore.categories.map((c) => c.id);
    form.category = ids.includes(queryCategory.value) ? queryCategory.value : (ids[0] ?? '');
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

.form {
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
  }
}

.unit-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.unit-chip {
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

.form-alert__title {
  display: block;
}

.form-alert__detail {
  display: block;
  font-size: 13px;
}

.submit {
  height: 50px;
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
