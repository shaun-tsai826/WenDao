// MainLayout（task 2.6、5.4，AC-1.5、AC-1.6）：右上角使用者名稱與登出按鈕、底部導覽列
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import { createPinia, setActivePinia } from 'pinia';
import { h } from 'vue';
import { createRouter, createMemoryHistory, RouterView } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import { APP_NAME } from '@/constants/app';
import { useAuthStore } from '@/stores/auth';
import pb from '@/lib/pocketbase';
import type { UserRecord } from '@/types/models';

const Dummy = { render: () => h('div') };

async function mountAt(path: string) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useAuthStore().user = { id: 'u1', name: '老皮' } as UserRecord;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: { render: () => h('div', { id: 'login-page' }) } },
      {
        path: '/',
        component: MainLayout,
        children: ['', 'purchases', 'products', 'products/:id', 'categories'].map((p) => ({
          path: p,
          component: Dummy,
        })),
      },
    ],
  });
  await router.push(path);
  const wrapper = mount(
    { render: () => h(RouterView) },
    { global: { plugins: [Quasar, pinia, router] } },
  );
  await flushPromises();
  return { wrapper, router };
}

function fakeJwt(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: 'HS256' })}.${b64({ id: 'u1', type: 'auth', exp })}.sig`;
}

beforeEach(() => {
  document.body.innerHTML = '';
  pb.authStore.clear();
  localStorage.clear();
});

describe('MainLayout', () => {
  it('左上角顯示 App 名稱「溫叨Pantry」，品牌連結回首頁', async () => {
    const { wrapper: w } = await mountAt('/products');
    expect(w.find('.brand__name').text()).toBe(APP_NAME);
    const brand = w.find('a.brand');
    expect(brand.attributes('aria-label')).toBe(`${APP_NAME} 首頁`);
    expect(brand.attributes('href')).toBe('/');
    // Logo A 門牌（裝飾用，名稱已由連結的 aria-label 提供）
    const logo = brand.find('svg.brand-logo');
    expect(logo.exists()).toBe(true);
    expect(logo.attributes('aria-hidden')).toBe('true');
    expect(brand.text()).not.toContain('家');
  });

  it('右上角顯示使用者名稱、頭像（名稱最後一字）與登出按鈕（AC-1.5）', async () => {
    const { wrapper: w } = await mountAt('/');
    expect(w.find('.user__name').text()).toBe('老皮');
    expect(w.find('.user__avatar').text()).toBe('皮');
    expect(w.find('button.user__logout').text()).toBe('登出');
  });

  it('底部導覽列有 4 個項目，順序與連結正確', async () => {
    const { wrapper: w } = await mountAt('/');
    const links = w.findAll('nav[aria-label="主選單"] a');
    expect(links.map((a) => a.text())).toEqual(['首頁', '購買記錄', '商品', '分類']);
    expect(links.map((a) => a.attributes('href'))).toEqual([
      '/',
      '/purchases',
      '/products',
      '/categories',
    ]);
  });

  it.each([
    ['/', '首頁'],
    ['/purchases', '購買記錄'],
    ['/products/abc', '商品'],
    ['/categories', '分類'],
  ])('在 %s 時只有「%s」標示為目前頁', async (path, label) => {
    const { wrapper: w } = await mountAt(path);
    const current = w.findAll('nav[aria-label="主選單"] a[aria-current="page"]');
    expect(current.map((a) => a.text())).toEqual([label]);
  });

  it('按「登出」：清除登入狀態並回到登入頁（AC-1.6）', async () => {
    pb.authStore.save(fakeJwt(), { id: 'u1', name: '老皮' } as never);
    const { wrapper, router } = await mountAt('/products');
    await wrapper.find('button.user__logout').trigger('click');
    await flushPromises();
    const auth = useAuthStore();
    expect(router.currentRoute.value.path).toBe('/login');
    expect(wrapper.find('#login-page').exists()).toBe(true);
    expect(auth.isAuthenticated).toBe(false);
    expect(pb.authStore.isValid).toBe(false);
    expect(localStorage.getItem('pocketbase_auth')).toBeNull();
  });
});
