<!--
  新增購買記錄（task 8.4，REQ-4 / AC-4.3～4.6，REQ-5 / AC-5.1～5.5、5.10、5.11，REQ-6 / AC-6.1，REQ-7 / AC-7.13）
  設計：設計稿 Pur-New、Pur-New-Error、Pur-New-Qty、Pur-Remain；design.md v4.0「購買記錄」
  - 表單本身在 components/PurchaseForm.vue（編輯頁 task 8.6 共用）
  - 存檔成功：MSG-004 → 回到購買記錄列表 → 詢問是否更新剩餘數量（CONFIRM-002，預先帶入目前的值；使用者同意提案 2）
  - 還沒有任何商品時，引導先新增商品
-->
<template>
  <q-page class="page">
    <div class="back-row">
      <router-link to="/purchases" class="back-row__link" aria-label="返回購買記錄">
        <AppIcon name="back" />
      </router-link>
      <h1 class="back-row__title">新增購買記錄</h1>
    </div>

    <p v-if="loading" class="card state">載入中…</p>

    <div v-else-if="loadError" role="alert" class="card state state--error">
      <span>{{ loadError }}</span>
      <button type="button" class="link-button" @click="load">重新載入</button>
    </div>

    <p v-else-if="!productStore.products.length" class="card state">
      要先新增商品，才能記錄購買。
      <router-link to="/products/new">前往新增商品</router-link>
    </p>

    <PurchaseForm v-else submit-label="儲存記錄" cancel-to="/purchases" :on-submit="create" />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import PurchaseForm from '@/components/PurchaseForm.vue';
import { MSG } from '@/constants/messages';
import { localToday } from '@/composables/dates';
import { apiErrorMessage } from '@/lib/errors';
import { askUpdateRemaining, notifySuccess } from '@/lib/feedback';
import { toProductView } from '@/lib/productView';
import type { PurchaseFormData } from '@/lib/purchaseForm';
import { formatAmount } from '@/lib/purchaseView';
import { useCategoryStore } from '@/stores/category';
import { useProductStore } from '@/stores/product';
import { usePurchaseStore } from '@/stores/purchase';

const router = useRouter();
const categoryStore = useCategoryStore();
const productStore = useProductStore();
const purchaseStore = usePurchaseStore();

const loading = ref(true);
const loadError = ref('');

async function create(data: PurchaseFormData) {
  const created = await purchaseStore.createRecord(data);
  notifySuccess(MSG.recordCreated);
  await router.replace('/purchases');

  const product = productStore.getById(data.productId);
  if (!product) return;
  const view = toProductView(product);
  void askUpdateRemaining({
    productName: `${product.brand} ${product.name}`,
    purchased:
      created.quantity > 0
        ? `剛記錄了 ${formatAmount(created.quantity)} ${product.unit}`
        : '剛記錄了一筆（數量未填）',
    remaining: view.remaining,
    unit: product.consumption_unit,
    updatedAt: view.remainingUpdatedAt,
    today: localToday(),
    onSave: async (remaining) => {
      await productStore.updateRemaining(product.id, remaining);
      notifySuccess(MSG.productUpdated);
    },
  });
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    await Promise.all([
      categoryStore.fetchCategories(),
      productStore.fetchProducts(),
      // 常去的地點只是方便輸入，讀不到也不影響新增
      purchaseStore.fetchRecentStores().catch(() => undefined),
    ]);
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
