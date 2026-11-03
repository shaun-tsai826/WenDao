<!--
  溫叨@Pantry 標誌（Logo A：台北市門牌 5888，2026-11-03 使用者選定）
  - 藍底（--accent #1d5fd6）、內側白色細框、數字 5888 一行排開
  - 數字是 Barlow Condensed SemiBold 的外框路徑（brandPaths.ts，由 brand/build-icons.mjs 產生），不依賴字型
  - variant="header"：頂欄小尺寸用，框線加粗、數字放大，縮小後仍看得清楚
  - 預設是裝飾用（旁邊已經有文字名稱）→ aria-hidden；單獨出現時傳 label，改為 role="img" 並念出名稱
  尺寸由使用的地方用 CSS 決定（寬高比 140:96）
-->
<template>
  <svg
    class="brand-logo"
    viewBox="0 0 140 96"
    xmlns="http://www.w3.org/2000/svg"
    :role="label ? 'img' : undefined"
    :aria-label="label ? `${APP_NAME} 標誌：門牌 5888` : undefined"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <rect width="140" height="96" :rx="shape.rx" fill="#1d5fd6" />
    <rect
      :x="shape.inset"
      :y="shape.inset"
      :width="140 - shape.inset * 2"
      :height="96 - shape.inset * 2"
      :rx="shape.innerRx"
      fill="none"
      stroke="#ffffff"
      :stroke-width="shape.stroke"
    />
    <path :d="shape.digits" fill="#ffffff" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { APP_NAME } from '@/constants/app';
import { HEADER_DIGITS, PLATE_DIGITS } from './brandPaths';

const props = withDefaults(defineProps<{ variant?: 'plate' | 'header'; label?: boolean }>(), {
  variant: 'plate',
  label: false,
});

// 與 brand/svg/logo.svg、logo-header.svg 相同的幾何（設計稿 Logo A）
const SHAPES = {
  plate: { rx: 14, inset: 6, innerRx: 9, stroke: 3, digits: PLATE_DIGITS },
  header: { rx: 16, inset: 7, innerRx: 10, stroke: 5, digits: HEADER_DIGITS },
} as const;

const shape = computed(() => SHAPES[props.variant]);
</script>

<style scoped>
.brand-logo {
  display: block;
  flex: none;
}
</style>
