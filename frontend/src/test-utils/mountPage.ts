// 測試用：掛載一個頁面（含 Pinia、記憶體路由、Quasar 與 Notify / Dialog 外掛）（task 6.2 起共用）
import { h, type Component } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { Quasar, Notify, Dialog } from 'quasar';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory, RouterView, type RouteRecordRaw } from 'vue-router';

/**
 * @param path 起始網址
 * @param routes 這個測試需要的路由；沒列到的頁面用空殼代替
 */
export async function mountPage(path: string, routes: RouteRecordRaw[]) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(path);
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      global: { plugins: [[Quasar, { plugins: { Notify, Dialog } }], pinia, router] },
      attachTo: document.body,
    },
  );
  await flushPromises();
  return { wrapper, router, pinia };
}

/** 空殼頁面：顯示一個帶 id 的 div，方便確認導頁結果 */
export const stubPage = (id: string): Component => ({ render: () => h('div', { id }) });
