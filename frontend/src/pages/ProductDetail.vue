<!--
  商品詳情（task 7.5，REQ-6 / AC-6.4、AC-6.5，REQ-7 / AC-7.3，REQ-8 / AC-8.2、AC-8.4）
  設計：設計稿 Prod-Detail（使用者 2026-11-02 確認）、design.md v3.3「商品管理」
  - 商品卡：分類圖塊、品牌＋品名、分類與單位說明、狀態標籤
  - 三個資訊塊：剩餘數量、預計用完、歷史均價（含幾筆記錄）
  - 備註與「更新剩餘數量與消耗設定」入口（task 7.6）
  - 購買記錄由新到舊，每筆附新增者頭像
  - 價格趨勢圖於 task 10.2 加入；久未更新提醒（STATUS-008）於 task 7.8 加入
-->
<template>
  <q-page class="page">
    <div class="back-row">
      <router-link :to="backTo" class="back-row__link" aria-label="返回商品">
        <AppIcon name="back" />
      </router-link>
      <h1 class="back-row__title">商品詳情</h1>
    </div>

    <p v-if="loading" class="card state">載入中…</p>

    <div v-else-if="loadError" role="alert" class="card state state--error">
      <span>{{ loadError }}</span>
      <button type="button" class="link-button" @click="load">重新載入</button>
    </div>

    <p v-else-if="!view" class="card state">
      找不到這個商品，可能已被刪除。
      <router-link to="/products">回到商品列表</router-link>
    </p>

    <template v-else>
      <section class="card product" aria-labelledby="product-name">
        <div class="product__head">
          <span class="tile" :style="{ background: tone.bg, color: tone.ink }" aria-hidden="true">
            {{ categoryLabel(categoryName) }}
          </span>
          <div class="product__title">
            <h2 id="product-name" class="product__name">
              {{ view.record.brand }} {{ view.record.name }}
            </h2>
            <span class="product__meta">{{ meta }}</span>
          </div>
          <DepletionBadge :status="view.status" />
        </div>

        <div class="stats">
          <div class="stat">
            <span class="stat__label">剩餘數量</span>
            <span class="stat__value">
              <template v-if="view.remaining !== null">
                {{ formatQuantity(view.remaining) }}<small v-if="unit">{{ ` ${unit}` }}</small>
              </template>
              <template v-else>未設定</template>
            </span>
            <span v-if="view.remainingUpdatedAt" class="stat__sub">
              {{ formatShortDate(view.remainingUpdatedAt, today) }} 更新
            </span>
          </div>

          <div class="stat" :class="`stat--${view.status}`">
            <span class="stat__label">預計用完</span>
            <span class="stat__value">
              {{ view.depletionDate ? formatMonthDay(view.depletionDate) : '—' }}
            </span>
            <span v-if="depletionSub" class="stat__sub">{{ depletionSub }}</span>
          </div>

          <div class="stat stat--wide">
            <span class="stat__label">
              歷史均價<template v-if="average.count">（{{ average.count }} 筆）</template>
            </span>
            <span class="stat__value">
              <template v-if="average.average !== null">
                {{ formatUnitPrice(average.average) }}<small> 元/{{ view.record.unit }}</small>
              </template>
              <template v-else>{{ purchases.length ? STATUS.cannotCalculate : '—' }}</template>
            </span>
          </div>
        </div>

        <p v-if="view.record.consumption_note" class="product__note">
          備註：{{ view.record.consumption_note }}
        </p>
        <router-link :to="`/products/${view.record.id}/edit`" class="edit-link">
          更新剩餘數量與消耗設定
        </router-link>
      </section>

      <section class="card purchases" aria-labelledby="purchases-title">
        <h2 id="purchases-title" class="purchases__title">購買記錄（新到舊）</h2>
        <p v-if="!purchases.length" class="state">還沒有購買記錄</p>
        <div v-for="p in purchases" :key="p.record.id" class="purchase">
          <span
            class="avatar"
            role="img"
            :title="purchaseStore.userName(p.record.user)"
            :aria-label="`新增者：${purchaseStore.userName(p.record.user) || '未知'}`"
            :style="{
              background: personTone(purchaseStore.userIndex(p.record.user)).bg,
              color: personTone(purchaseStore.userIndex(p.record.user)).ink,
            }"
          >
            {{ personInitial(purchaseStore.userName(p.record.user)) }}
          </span>
          <span class="purchase__text">
            <span class="purchase__when">
              {{ formatShortDate(p.date, today)
              }}<template v-if="p.record.store"> · {{ p.record.store }}</template>
            </span>
            <span class="purchase__detail">{{ purchaseDetail(p) }}</span>
          </span>
          <span class="purchase__total">{{ formatAmount(p.record.total_price) }} 元</span>
        </div>
      </section>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import DepletionBadge from '@/components/DepletionBadge.vue';
import { STATUS } from '@/constants/messages';
import { localToday } from '@/composables/dates';
import { apiErrorMessage } from '@/lib/errors';
import { categoryLabel, categoryTone } from '@/lib/categoryTone';
import { personInitial, personTone } from '@/lib/personTone';
import { formatMonthDay, formatQuantity, toProductView } from '@/lib/productView';
import {
  formatAmount,
  formatShortDate,
  formatUnitPrice,
  historicalAverageOf,
  type PurchaseView,
} from '@/lib/purchaseView';
import { useCategoryStore } from '@/stores/category';
import { useProductStore } from '@/stores/product';
import { usePurchaseStore } from '@/stores/purchase';

const PERIOD_LABEL = { monthly: '每月', weekly: '每週' } as const;

const route = useRoute();
const router = useRouter();
const categoryStore = useCategoryStore();
const productStore = useProductStore();
const purchaseStore = usePurchaseStore();

const loading = ref(true);
const loadError = ref('');
const today = ref(localToday());
const purchases = ref<PurchaseView[]>([]);

const productId = computed(() => String(route.params.id ?? ''));

/** 從商品列表（可能帶篩選）進來時，返回到同一個網址；其他情況回商品列表 */
const previous = router.options.history.state.back;
const backTo =
  typeof previous === 'string' && /^\/products(\?|$)/.test(previous) ? previous : '/products';

const view = computed(() => {
  const record = productStore.getById(productId.value);
  return record ? toProductView(record, today.value) : null;
});

const unit = computed(() => view.value?.record.consumption_unit ?? '');

const categoryIndex = computed(() =>
  categoryStore.categories.findIndex((c) => c.id === view.value?.record.category),
);
const categoryName = computed(() => categoryStore.categories[categoryIndex.value]?.name ?? '');
const tone = computed(() => categoryTone(categoryIndex.value));

/** 「衛生紙 · 以「抽」計價 · 以「包」計算消耗」 */
const meta = computed(() => {
  if (!view.value) return '';
  const parts = [categoryName.value, `以「${view.value.record.unit}」計價`];
  if (unit.value) parts.push(`以「${unit.value}」計算消耗`);
  return parts.filter(Boolean).join(' · ');
});

/** 預計用完的第二行：「剩 6 天 · 每月用 4 包」「已過 3 天 · …」「今天用完 · …」或未設定原因 */
const depletionSub = computed(() => {
  const v = view.value;
  if (!v) return '';
  if (v.rate === null || !v.period) return STATUS.rateNotSet;
  const rate = `${PERIOD_LABEL[v.period]}用 ${formatQuantity(v.rate)}${unit.value ? ` ${unit.value}` : ''}`;
  if (v.daysLeft === null) return `${STATUS.remainingNotSet} · ${rate}`;
  if (v.daysLeft < 0) return `已過 ${-v.daysLeft} 天 · ${rate}`;
  if (v.daysLeft === 0) return `今天用完 · ${rate}`;
  return `剩 ${v.daysLeft} 天 · ${rate}`;
});

const average = computed(() => historicalAverageOf(purchases.value));

/** 「1,200 抽 · 0.4992 元/抽」；數量缺失時「數量未填 · 無法計算」 */
function purchaseDetail(p: PurchaseView): string {
  const unitName = view.value?.record.unit ?? '';
  if (p.quantity === null || p.unitPrice === null) {
    return `數量未填 · ${STATUS.cannotCalculate}`;
  }
  return `${formatAmount(p.quantity)} ${unitName} · ${formatUnitPrice(p.unitPrice)} 元/${unitName}`;
}

async function load() {
  loading.value = true;
  loadError.value = '';
  today.value = localToday();
  try {
    const [records] = await Promise.all([
      purchaseStore.fetchByProduct(productId.value),
      purchaseStore.fetchUsers(),
      categoryStore.fetchCategories(),
      productStore.fetchProducts(),
    ]);
    purchases.value = records;
  } catch (err) {
    loadError.value = apiErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(productId, load);
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

.product {
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.product__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tile {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-control);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.product__title {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product__name {
  margin: 0;
  font-size: 18px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.product__meta {
  font-size: 13px;
  color: var(--muted);
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat {
  background: var(--ground);
  border-radius: var(--radius-inner);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .stat__label,
  .stat__sub {
    color: var(--muted);
  }
}

// 預計用完依狀態上色（與狀態標籤同色系）
.stat--soon,
.stat--depleted {
  .stat__label,
  .stat__sub {
    color: inherit;
  }
}

.stat--soon {
  background: var(--status-soon-bg);
  color: var(--status-soon-ink);
}

.stat--depleted {
  background: var(--status-depleted-bg);
  color: var(--status-depleted-ink);
}

.stat--wide {
  grid-column: span 2;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  column-gap: 12px;
  background: var(--accent-soft);
  color: var(--accent-ink);

  .stat__label {
    color: inherit;
  }
}

.stat__label {
  font-size: 13px;
}

.stat__value {
  font-size: 24px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;

  small {
    font-size: 14px;
  }
}

.stat__sub {
  font-size: 12px;
}

.product__note {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.edit-link {
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid var(--control);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  text-decoration: none;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.purchases {
  padding: 14px var(--card-pad) 4px;
  display: flex;
  flex-direction: column;
}

.purchases__title {
  margin: 0 0 4px;
  font-size: 15px;
  line-height: 1.5; // Quasar 預設 h2 行高 3.75rem，要蓋掉
}

.purchase {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 60px;

  & + & {
    border-top: 1px solid var(--rule);
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

.purchase__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.purchase__when {
  font-size: 15px;
  overflow-wrap: anywhere;
}

.purchase__detail {
  font-size: 12px;
  color: var(--muted);
}

.purchase__total {
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
