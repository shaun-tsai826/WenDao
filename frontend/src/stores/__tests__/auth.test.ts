// useAuthStore.login / logout（task 5.1，AC-1.1、AC-1.2、AC-1.6、AC-1.7）
// 把 SDK 的 authWithPassword 換成假的，不需要真的 PocketBase。
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ClientResponseError, type RecordService } from 'pocketbase';
import pb from '@/lib/pocketbase';
import { useAuthStore, loginErrorMessage } from '@/stores/auth';
import { ERR } from '@/constants/messages';

function fakeJwt(expSecondsFromNow: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  return `${b64({ alg: 'HS256' })}.${b64({ id: 'u1', type: 'auth', exp })}.sig`;
}

const USER = { id: 'u1', name: '老皮', email: 'a@x.local' };

/** 假的 authWithPassword：帳密正確就像 SDK 一樣把 token 存進 authStore，否則丟 400 */
function mockAuthWithPassword() {
  const fn = vi.fn((email: string, password: string) => {
    if (email === 'a@x.local' && password === 'correct-password') {
      pb.authStore.save(fakeJwt(3600), USER as never);
      return Promise.resolve({ token: pb.authStore.token, record: USER });
    }
    return Promise.reject(new ClientResponseError({ status: 400, response: {} }));
  });
  vi.spyOn(pb, 'collection').mockReturnValue({ authWithPassword: fn } as unknown as RecordService);
  return fn;
}

beforeEach(() => {
  pb.authStore.clear();
  localStorage.clear();
  setActivePinia(createPinia());
});

describe('login', () => {
  it('帳密正確：登入成功，store 顯示使用者名稱（AC-1.1）', async () => {
    mockAuthWithPassword();
    const auth = useAuthStore();
    await auth.login('a@x.local', 'correct-password');
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.displayName).toBe('老皮');
  });

  it('登入後 token 存進 localStorage，重開 App 仍可讀回（AC-1.7）', async () => {
    mockAuthWithPassword();
    await useAuthStore().login('a@x.local', 'correct-password');
    const saved = JSON.parse(localStorage.getItem('pocketbase_auth') ?? '{}');
    expect(saved.token).toBe(pb.authStore.token);
    expect(saved.record.name).toBe('老皮');
  });

  it('email 前後空白會被去掉', async () => {
    const fn = mockAuthWithPassword();
    await useAuthStore().login('  a@x.local ', 'correct-password');
    expect(fn).toHaveBeenCalledWith('a@x.local', 'correct-password');
  });

  it('密碼錯誤：丟出錯誤、維持未登入，訊息為 ERR-001（AC-1.2）', async () => {
    mockAuthWithPassword();
    const auth = useAuthStore();
    const err = await auth.login('a@x.local', 'wrong').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ClientResponseError);
    expect(auth.isAuthenticated).toBe(false);
    expect(loginErrorMessage(err)).toBe('帳號或密碼錯誤，請重新輸入');
  });
});

describe('logout（AC-1.6）', () => {
  it('清除 SDK 登入狀態、store 與 localStorage', async () => {
    mockAuthWithPassword();
    const auth = useAuthStore();
    await auth.login('a@x.local', 'correct-password');
    auth.logout();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.displayName).toBe('');
    expect(pb.authStore.isValid).toBe(false);
    expect(localStorage.getItem('pocketbase_auth')).toBeNull();
  });
});

describe('loginErrorMessage', () => {
  const err = (status: number) => new ClientResponseError({ status, response: {} });

  it.each([
    { status: 0, message: ERR.networkError, label: '連不上伺服器' },
    { status: 500, message: ERR.serverError, label: '伺服器錯誤' },
    { status: 503, message: ERR.serverError, label: '伺服器暫停服務' },
    { status: 400, message: ERR.loginFailed, label: '帳號或密碼錯誤' },
    { status: 429, message: ERR.loginFailed, label: '嘗試太多次' },
  ])('status $status（$label）→ $message', ({ status, message }) => {
    expect(loginErrorMessage(err(status))).toBe(message);
  });

  it('不是 PocketBase 的錯誤 → ERR-001', () => {
    expect(loginErrorMessage(new Error('x'))).toBe(ERR.loginFailed);
  });
});
