// 登入頁（task 5.2，AC-1.1、AC-1.2）
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { h } from 'vue';
import { Quasar } from 'quasar';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory, RouterView } from 'vue-router';
import { ClientResponseError, type RecordService } from 'pocketbase';
import pb from '@/lib/pocketbase';
import Login from '@/pages/Login.vue';
import { ERR } from '@/constants/messages';
import { APP_NAME } from '@/constants/app';

function fakeJwt(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256' })}.${b64({ id: 'u1', type: 'auth', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

/** 假的 authWithPassword；可傳入自訂行為 */
function mockAuth(impl?: (email: string, password: string) => Promise<unknown>) {
  const fn = vi.fn(
    impl ??
      ((email: string, password: string) => {
        if (email === 'alice@family.home' && password === 'correct-password') {
          pb.authStore.save(fakeJwt(), { id: 'u1', name: 'Alice' } as never);
          return Promise.resolve({});
        }
        return Promise.reject(new ClientResponseError({ status: 400, response: {} }));
      }),
  );
  vi.spyOn(pb, 'collection').mockReturnValue({ authWithPassword: fn } as unknown as RecordService);
  return fn;
}

async function mountLogin() {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: Login },
      { path: '/', component: { render: () => h('div', { id: 'dashboard' }, '首頁') } },
    ],
  });
  await router.push('/login');
  const wrapper = mount(
    { render: () => h(RouterView) },
    { global: { plugins: [Quasar, pinia, router] }, attachTo: document.body },
  );
  await flushPromises();
  return { wrapper, router };
}

async function fillAndSubmit(
  w: Awaited<ReturnType<typeof mountLogin>>['wrapper'],
  email: string,
  password: string,
) {
  await w.find('#login-email').setValue(email);
  await w.find('#login-password').setValue(password);
  await w.find('form').trigger('submit');
  await flushPromises();
}

beforeEach(() => {
  pb.authStore.clear();
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('登入頁', () => {
  it('上方顯示 App 名稱「溫叨Pantry」', async () => {
    const { wrapper } = await mountLogin();
    expect(wrapper.find('.login__name').text()).toBe(APP_NAME);
    expect(wrapper.find('.login__brand svg.brand-logo').exists()).toBe(true);
  });

  it('有 Email、密碼欄位與登入按鈕，支援密碼管理工具自動填入', async () => {
    const { wrapper } = await mountLogin();
    expect(wrapper.find('label[for="login-email"]').text()).toBe('Email');
    expect(wrapper.find('label[for="login-password"]').text()).toBe('密碼');
    expect(wrapper.find('#login-email').attributes('autocomplete')).toBe('username');
    expect(wrapper.find('#login-password').attributes('autocomplete')).toBe('current-password');
    expect(wrapper.find('button[type="submit"]').text()).toBe('登入');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('帳密正確：登入成功並導向首頁 /（AC-1.1）', async () => {
    mockAuth();
    const { wrapper, router } = await mountLogin();
    await fillAndSubmit(wrapper, 'alice@family.home', 'correct-password');
    expect(router.currentRoute.value.path).toBe('/');
    expect(wrapper.find('#dashboard').exists()).toBe(true);
  });

  it('密碼錯誤：顯示 ERR-001、留在登入頁、保留 email、清空密碼（AC-1.2）', async () => {
    mockAuth();
    const { wrapper, router } = await mountLogin();
    await fillAndSubmit(wrapper, 'alice@family.home', 'wrong');
    const alert = wrapper.find('[role="alert"]');
    expect(alert.text()).toBe('帳號或密碼錯誤，請重新輸入');
    expect(router.currentRoute.value.path).toBe('/login');
    expect((wrapper.find('#login-email').element as HTMLInputElement).value).toBe(
      'alice@family.home',
    );
    expect((wrapper.find('#login-password').element as HTMLInputElement).value).toBe('');
    expect(document.activeElement?.id).toBe('login-password');
  });

  it('連不上伺服器：顯示 ERR-014', async () => {
    mockAuth(() => Promise.reject(new ClientResponseError({ status: 0, response: {} })));
    const { wrapper } = await mountLogin();
    await fillAndSubmit(wrapper, 'alice@family.home', 'correct-password');
    expect(wrapper.find('[role="alert"]').text()).toBe(ERR.networkError);
  });

  it('欄位空白：在欄位下方顯示 ERR-009，不送出', async () => {
    const fn = mockAuth();
    const { wrapper } = await mountLogin();
    await fillAndSubmit(wrapper, '   ', '');
    expect(fn).not.toHaveBeenCalled();
    expect(wrapper.find('#login-email-error').text()).toBe(ERR.required);
    expect(wrapper.find('#login-password-error').text()).toBe(ERR.required);
    expect(wrapper.find('#login-email').attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('#login-email').attributes('aria-describedby')).toBe('login-email-error');
  });

  it('只有密碼空白：只標示密碼欄', async () => {
    const fn = mockAuth();
    const { wrapper } = await mountLogin();
    await fillAndSubmit(wrapper, 'alice@family.home', '');
    expect(fn).not.toHaveBeenCalled();
    expect(wrapper.find('#login-email-error').exists()).toBe(false);
    expect(wrapper.find('#login-password-error').text()).toBe(ERR.required);
  });

  it('登入中：按鈕停用並顯示「登入中…」，不會重複送出', async () => {
    let finish: () => void = () => undefined;
    const fn = mockAuth(() => new Promise((resolve) => (finish = () => resolve({}))));
    const { wrapper } = await mountLogin();
    await wrapper.find('#login-email').setValue('alice@family.home');
    await wrapper.find('#login-password').setValue('correct-password');
    await wrapper.find('form').trigger('submit');
    await wrapper.find('form').trigger('submit');
    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe('登入中…');
    expect(button.attributes('disabled')).toBeDefined();
    expect(fn).toHaveBeenCalledOnce();
    finish();
    await flushPromises();
  });

  it('眼睛按鈕：切換顯示 / 隱藏密碼', async () => {
    const { wrapper } = await mountLogin();
    const toggle = wrapper.find('button[aria-label="顯示密碼"]');
    expect(wrapper.find('#login-password').attributes('type')).toBe('password');
    await toggle.trigger('click');
    expect(wrapper.find('#login-password').attributes('type')).toBe('text');
    expect(wrapper.find('.field__toggle').attributes('aria-label')).toBe('隱藏密碼');
    expect(wrapper.find('.field__toggle').attributes('aria-pressed')).toBe('true');
  });
});
