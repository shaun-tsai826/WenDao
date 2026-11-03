<!--
  編輯購買記錄（task 8.6，REQ-5 / AC-5.7，REQ-6 / AC-6.1）
  設計：design.md v4.0「購買記錄 › 編輯購買記錄」：沿用新增頁表單（components/PurchaseForm.vue），
  標題改「編輯購買記錄」、預先帶入原本的值
  - 載入：記錄（purchaseStore.fetchRecord，404 → 找不到）、自訂欄位值（fetchFieldValues）、分類與商品
  - 儲存：purchaseStore.updateRecord（重算數量與單位均價、同步自訂欄位值、新增者不變）→ MSG-005 → 回到這筆記錄的詳情
  - 編輯不詢問更新剩餘數量（AC-7.13 只在新增時）
-->
<template>
  <q-page class="page">
    <div class="back-row">
      <router-link :to="detailPath" class="back-row__link" aria-label="返回購買記錄詳情">
        <AppIcon name="back" />
      </router-link>
      <h1 class="back-row__title">編輯購買記錄</h1>
    </div>

    <p v-if="loading" class="card state">載入中…</p>

    <div v-else-if="loadError" role="alert" class="card state state--error">
      <span>{{ loadError }}</span>
      <button type="button" class="link-button" @click="load">重新載入</button>
    </div>

    <p v-else-if="!initial" class="card state">
      找不到這筆記錄，可能已被刪除。
      <router-link to="/purchases">回到購買記錄</router-link>
    </p>

    <PurchaseForm
      v-else
      :key="recordId"
      :initial="initial"
      submit-label="儲存變更"
      :cancel-to="detailPath"
      :on-submit="save"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import PurchaseForm from '@/components/PurchaseForm.vue';
import { MSG } from '@/constants/messages';
import { toDateOnly } from '@/composables/dates';
import { apiErrorMessage } from '@/lib/errors';
import { notifySuccess } from '@/lib/feedback';
import type { PurchaseFormData, PurchaseFormInitial } from '@/lib/purchaseForm';
import { useCategoryStore } from '@/stores/category';
import { useProductStore } from '@/stores/product';
import { usePurchaseStore } from '@/stores/purchase';

const route = useRoute();
const router = useRouter();
const categoryStore = useCategoryStore();
const productStore = useProductStore();
const purchaseStore = usePurchaseStore();

const loading = ref(true);
const loadError = ref('');
/** 表單的初始值；記錄不存在時為 null */
const initial = ref<PurchaseFormInitial | null>(null);

const recordId = computed(() => String(route.params.id ?? ''));
const detailPath = computed(() => `/purchases/${recordId.value}`);

async function save(data: PurchaseFormData) {
  await purchaseStore.updateRecord(recordId.value, data);
  notifySuccess(MSG.recordUpdated);
  await router.replace(detailPath.value);
}

async function load() {
  loading.value = true;
  loadError.value = '';
  initial.value = null;
  try {
    const [record, values] = await Promise.all([
      purchaseStore.fetchRecord(recordId.value),
      purchaseStore.fetchFieldValues(recordId.value),
      categoryStore.fetchCategories(),
      productStore.fetchProducts(),
      // 常去的地點只是方便輸入，讀不到也不影響編輯
      purchaseStore.fetchRecentStores().catch(() => undefined),
    ]);
    if (!record) return;
    initial.value = {
      productId: record.product,
      purchaseDate: toDateOnly(record.purchase_date) ?? '',
      store: record.store,
      totalPrice: String(record.total_price),
      // 資料庫的 0 = 沒填（design.md），欄位留空
      quantity: record.quantity > 0 ? String(record.quantity) : '',
      fieldValues: Object.fromEntries(values.map((v) => [v.custom_field, v.field_value])),
    };
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
