<!--
  線條圖示（task 2.6）
  design.md「UI 設計規範 › 元件 › 圖示」：線條風格、粗細 1.6px、16–22px、全站同一套、不用 emoji。
  裝飾用途，預設 aria-hidden；需要說明時請在外層按鈕加 aria-label。
-->
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type IconName = 'home' | 'receipt' | 'box' | 'tag' | 'back' | 'chevron' | 'plus';

const ICONS: Record<IconName, string[]> = {
  home: ['M3.5 10 11 4l7.5 6v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z'],
  receipt: ['M5 3h12v16l-3-2-3 2-3-2-3 2z', 'M8 8h6', 'M8 12h6'],
  box: ['M3.5 7.5 11 3.5l7.5 4v8L11 19.5l-7.5-4z', 'M3.5 7.5 11 11.5l7.5-4', 'M11 11.5v8'],
  tag: ['M3.5 4h7l8 8-7 7-8-8z', 'M7.5 8h.01'],
  back: ['m13.5 5-6 6 6 6'],
  chevron: ['m8.5 5 6 6-6 6'],
  plus: ['M11 4.5v13', 'M4.5 11h13'],
};

const props = withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 22 });

const paths = computed(() => ICONS[props.name]);
</script>
