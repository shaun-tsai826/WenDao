<!--
  價格趨勢圖（task 10.1，REQ-8 / AC-8.8）
  設計：設計稿 Prod-Trend、Prod-Trend-Empty（使用者 2026-11-04 確認）；design.md v4.4「價格趨勢圖」
  - 資料整理在 lib/trendView.ts（純函數），畫圖在 lib/trendChart.ts（Chart.js，只有這裡用到）
  - 少於 2 筆算得出單位均價的記錄 → STATUS-005（使用者決定）
  - 下方的購買記錄清單就是這張圖的表格版；canvas 用 role="img" 與 aria-label 寫出每一點
-->
<template>
  <section class="card trend" aria-labelledby="trend-title">
    <div class="trend__head">
      <h2 id="trend-title" class="trend__title">單位均價趨勢</h2>
      <span class="trend__meta">{{ meta }}</span>
    </div>

    <template v-if="trend.enough">
      <div class="trend__plot">
        <canvas ref="canvasRef" role="img" :aria-label="trend.ariaLabel"></canvas>
      </div>
      <p class="trend__hint">點圖上的點看那次的價格；數量沒填的記錄不畫進圖</p>
    </template>

    <div v-else role="status" class="trend__empty">
      <span class="trend__empty-title">{{ STATUS.notEnoughTrendData }}</span>
      <span class="trend__empty-text">
        要有 {{ TREND_MIN_POINTS }} 筆以上算得出單位均價的購買記錄（目前 {{ trend.count }} 筆）
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { STATUS } from '@/constants/messages';
import type { PurchaseView } from '@/lib/purchaseView';
import { drawTrendChart, type TrendChartHandle } from '@/lib/trendChart';
import { trendOf, TREND_MIN_POINTS } from '@/lib/trendView';

const props = defineProps<{
  /** 同一商品的購買記錄（purchaseStore.fetchByProduct，新到舊） */
  purchases: PurchaseView[];
  /** 計價單位 */
  unit: string;
  /** 今天 'YYYY-MM-DD'（決定日期要不要寫年份） */
  today: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: TrendChartHandle | null = null;

const trend = computed(() => trendOf(props.purchases, props.unit, props.today));

const meta = computed(() =>
  trend.value.enough ? `${trend.value.count} 筆 · 元/${props.unit}` : `元/${props.unit}`,
);

function clear() {
  chart?.destroy();
  chart = null;
}

/** 資料變了就清掉舊圖重畫（canvas 要等畫面更新後才存在） */
async function redraw() {
  clear();
  await nextTick();
  if (trend.value.enough && canvasRef.value) {
    chart = drawTrendChart(canvasRef.value, trend.value);
  }
}

onMounted(redraw);
watch(trend, redraw);
onBeforeUnmount(clear);
</script>

<style scoped lang="scss">
.card {
  background: var(--surface);
  border-radius: var(--radius-card);
}

.trend {
  padding: 14px var(--card-pad) 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trend__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.trend__title {
  margin: 0;
  font-size: 15px;
  line-height: 1.5; // Quasar 預設 h2 行高很大，要蓋掉
}

.trend__meta {
  font-size: 13px;
  color: var(--muted);
}

// Chart.js responsive：外層決定大小
.trend__plot {
  position: relative;
  height: 180px;
}

.trend__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted);
}

.trend__empty {
  min-height: 120px;
  padding: 16px;
  border-radius: var(--radius-inner);
  background: var(--status-neutral-bg);
  color: var(--status-neutral-ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
}

.trend__empty-title {
  font-size: 15px;
}

.trend__empty-text {
  font-size: 13px;
  line-height: 1.5;
}
</style>
