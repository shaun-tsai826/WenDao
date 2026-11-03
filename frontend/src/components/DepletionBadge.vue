<!--
  消耗狀態標籤（task 7.2，REQ-7 / AC-7.4、AC-7.5、AC-7.7、AC-7.12）
  依 getDepletionStatus 的結果顯示：
  - depleted → STATUS-004「已耗盡」（紅）
  - soon → STATUS-003「即將耗盡」（琥珀）
  - unset → STATUS-002「未設定消耗速率」（灰）
  - no_remaining → STATUS-007「未設定剩餘數量」（灰）
  - normal → 不顯示（design.md：正常狀態只用一般文字）
  task 7.8 久未更新（stale，AC-7.14）：一個商品只放一個標籤（使用者選擇）——
  已耗盡 / 即將耗盡優先；沒有急迫狀態時改放 STATUS-008「剩餘數量已久未更新」（灰色、小一號字）
  樣式依 design.md「UI 設計規範 › 消耗狀態」與商品列表設計稿（13px、膠囊形）。
-->
<template>
  <span
    v-if="badge"
    class="depletion-badge"
    :class="[`depletion-badge--${badge.tone}`, { 'depletion-badge--small': badge.small }]"
    :data-status="badge.key"
    >{{ badge.text }}</span
  >
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { STATUS } from '@/constants/messages';
import type { DepletionStatus } from '@/composables/useDepletionStatus';

const props = withDefaults(defineProps<{ status: DepletionStatus; stale?: boolean }>(), {
  stale: false,
});

type Tone = 'depleted' | 'soon' | 'neutral';
type Badge = { text: string; tone: Tone; key: string; small?: boolean };

const STALE: Badge = { text: STATUS.remainingStale, tone: 'neutral', key: 'stale', small: true };

const BADGES: Record<DepletionStatus, Omit<Badge, 'key'> | null> = {
  depleted: { text: STATUS.depleted, tone: 'depleted' },
  soon: { text: STATUS.soon, tone: 'soon' },
  unset: { text: STATUS.rateNotSet, tone: 'neutral' },
  no_remaining: { text: STATUS.remainingNotSet, tone: 'neutral' },
  normal: null,
};

const badge = computed<Badge | null>(() => {
  const urgent = props.status === 'depleted' || props.status === 'soon';
  if (props.stale && !urgent) return STALE;
  const b = BADGES[props.status];
  return b ? { ...b, key: props.status } : null;
});
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
/* 久未更新：文字較長，小一號字（設計稿 Prod-List） */
.depletion-badge--small {
  font-size: 12px;
  padding: 3px 8px;
}
.depletion-badge--neutral {
  background: var(--status-neutral-bg);
  color: var(--status-neutral-ink);
}
</style>
