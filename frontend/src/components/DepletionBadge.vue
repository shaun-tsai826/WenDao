<!--
  消耗狀態標籤（task 7.2，REQ-7 / AC-7.4、AC-7.5、AC-7.7、AC-7.12）
  依 getDepletionStatus 的結果顯示：
  - depleted → STATUS-004「已耗盡」（紅）
  - soon → STATUS-003「即將耗盡」（琥珀）
  - unset → STATUS-002「未設定消耗速率」（灰）
  - no_remaining → STATUS-007「未設定剩餘數量」（灰）
  - normal → 不顯示（design.md：正常狀態只用一般文字）
  樣式依 design.md「UI 設計規範 › 消耗狀態」與商品列表設計稿（13px、膠囊形）。
-->
<template>
  <span
    v-if="badge"
    class="depletion-badge"
    :class="`depletion-badge--${badge.tone}`"
    :data-status="status"
    >{{ badge.text }}</span
  >
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { STATUS } from '@/constants/messages';
import type { DepletionStatus } from '@/composables/useDepletionStatus';

const props = defineProps<{ status: DepletionStatus }>();

type Tone = 'depleted' | 'soon' | 'neutral';

const BADGES: Record<DepletionStatus, { text: string; tone: Tone } | null> = {
  depleted: { text: STATUS.depleted, tone: 'depleted' },
  soon: { text: STATUS.soon, tone: 'soon' },
  unset: { text: STATUS.rateNotSet, tone: 'neutral' },
  no_remaining: { text: STATUS.remainingNotSet, tone: 'neutral' },
  normal: null,
};

const badge = computed(() => BADGES[props.status]);
</script>

<style scoped>
.depletion-badge {
  flex: none;
  display: inline-block;
  font-size: 13px;
  line-height: 1.4;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
.depletion-badge--depleted {
  background: var(--status-depleted-bg);
  color: var(--status-depleted-ink);
}
.depletion-badge--soon {
  background: var(--status-soon-bg);
  color: var(--status-soon-ink);
}
.depletion-badge--neutral {
  background: var(--status-neutral-bg);
  color: var(--status-neutral-ink);
}
</style>
