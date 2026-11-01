// MainLayout（task 2.6，AC-1.5）：右上角顯示使用者名稱與登出按鈕、底部導覽列
import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar } from 'quasar';
import { createPinia, setActivePinia } from 'pinia';
import { h } from 'vue';
import { createRouter, createMemoryHistory, RouterView } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import { useAuthStore } from '@/stores/auth';
import type { UserRecord } from '@/types/models';

const Dummy = { render: () => h('div') };

async function mountAt(path: string) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useAuthStore().user = { id: 'u1', name: '老皮' } as UserRecord;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
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
  return wrapper;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('MainLayout', () => {
  it('右上角顯示使用者名稱、頭像（名稱最後一字）與登出按鈕（AC-1.5）', async () => {
    const w = await mountAt('/');
    expect(w.find('.user__name').text()).toBe('老皮');
    expect(w.find('.user__avatar').text()).toBe('皮');
    expect(w.find('button.user__logout').text()).toBe('登出');
  });

  it('底部導覽列有 4 個項目，順序與連結正確', async () => {
    const w = await mountAt('/');
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
    const w = await mountAt(path);
    const current = w.findAll('nav[aria-label="主選單"] a[aria-current="page"]');
    expect(current.map((a) => a.text())).toEqual([label]);
  });
});
