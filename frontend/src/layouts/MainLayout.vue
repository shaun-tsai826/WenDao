<!--
  MainLayout：功能頁共用的外框（task 2.6，AC-1.5）
  design.md「UI 設計規範 › 元件」：
  - 頂欄：門牌 Logo（BrandLogo，Logo A）+ App 名稱（constants/app.ts）；右邊頭像 + 使用者名稱 +「登出」（task 5.4 接上登出）
  - 底部導覽列：首頁、購買記錄、商品、分類（目前頁用 --accent）
-->
<template>
  <q-layout view="hHh lpR fFf" class="main-layout">
    <q-header class="app-header">
      <div class="app-header__inner">
        <router-link to="/" class="brand" :aria-label="`${APP_NAME} 首頁`">
          <BrandLogo variant="header" class="brand__mark" />
          <span class="brand__name">{{ APP_NAME }}</span>
        </router-link>

        <div class="user">
          <span class="user__avatar" aria-hidden="true">{{ avatarChar }}</span>
          <span class="user__name">{{ auth.displayName }}</span>
          <button type="button" class="user__logout" @click="logout">登出</button>
        </div>
      </div>
    </q-header>

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>

    <q-footer class="app-nav">
      <nav aria-label="主選單" class="app-nav__inner">
        <router-link
          v-for="item in NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="app-nav__item"
          :class="{ 'is-active': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { APP_NAME } from '@/constants/app';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon, { type IconName } from '@/components/AppIcon.vue';
import BrandLogo from '@/components/BrandLogo.vue';
import { useAuthStore } from '@/stores/auth';

const NAV_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: '首頁', icon: 'home' },
  { to: '/purchases', label: '購買記錄', icon: 'receipt' },
  { to: '/products', label: '商品', icon: 'box' },
  { to: '/categories', label: '分類', icon: 'tag' },
];

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

// 登出（task 5.4，AC-1.6）：清除登入狀態，回到登入頁
async function logout() {
  auth.logout();
  await router.replace('/login');
}

// 頭像放名稱的最後一個字（老皮 →「皮」）
const avatarChar = computed(() => Array.from(auth.displayName).at(-1) ?? '');

// 首頁只在 / 時亮起；其他項目在子頁（例如 /products/abc）也維持亮起
function isActive(to: string): boolean {
  return to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(to + '/');
}
</script>

<style scoped lang="scss">
.main-layout {
  background: var(--ground);
}

.app-header {
  background: var(--ground);
  color: var(--text);
}

// 平板、桌機：頂欄、內容、導覽列都限制在 --content-max（640px）置中（task 12.7，使用者決定）
.app-header__inner {
  max-width: var(--content-max);
  margin: 0 auto;
  height: var(--header-height);
  padding: 0 var(--page-margin);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  text-decoration: none;
  min-height: 44px;
}

// 門牌 Logo（寬高比 140:96）
.brand__mark {
  width: 44px;
  height: 30px;
}

.brand__name {
  font-size: 16px;
}

.user {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.user__avatar {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--person-1-bg);
  color: var(--person-1-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.user__name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user__logout {
  flex: none;
  height: 44px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius-control);

  &:hover {
    color: var(--text);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.app-nav {
  background: var(--surface);
  color: var(--muted);
  border-top: 1px solid var(--border);
}

.app-nav__inner {
  height: var(--nav-height);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: var(--content-max);
  margin: 0 auto;
}

.page-container :deep(.q-page) {
  max-width: var(--content-max);
  margin: 0 auto;
}

.app-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--muted);
  text-decoration: none;
  font-size: 12px;

  &.is-active {
    color: var(--accent);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -4px;
    border-radius: var(--radius-inner);
  }
}
</style>
