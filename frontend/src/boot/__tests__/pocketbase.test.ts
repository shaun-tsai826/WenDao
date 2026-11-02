// App 啟動流程 boot/pocketbase.ts（task 5.5，AC-1.7 session 持久性）
// 模擬「關掉 App 再打開」：先把上次的登入資料放進 localStorage，再執行 boot。
// PocketBase SDK 的 LocalAuthStore 每次都從 localStorage 讀取，所以效果等同重新開啟。
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { ClientResponseError, type RecordService } from 'pocketbase';
import pb from '@/lib/pocketbase';
import bootPocketbase from '@/boot/pocketbase';
import { useAuthStore } from '@/stores/auth';

function fakeJwt(expSecondsFromNow: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  return `${b64({ alg: 'HS256' })}.${b64({ id: 'u1', type: 'auth', exp })}.sig`;
}

/** 上次使用時留在手機裡的登入資料 */
function previousSession(expSecondsFromNow: number) {
  localStorage.setItem(
    'pocketbase_auth',
    JSON.stringify({ token: fakeJwt(expSecondsFromNow), record: { id: 'u1', name: '老皮' } }),
  );
}

/** 假的 authRefresh：成功時像 SDK 一樣換一個新 token */
function mockRefresh(result: 'ok' | number) {
  const fn = vi.fn(() => {
    if (result === 'ok') {
      pb.authStore.save(fakeJwt(5 * 24 * 3600), { id: 'u1', name: '老皮' } as never);
      return Promise.resolve({});
    }
    return Promise.reject(new ClientResponseError({ status: result, response: {} }));
  });
  vi.spyOn(pb, 'collection').mockReturnValue({ authRefresh: fn } as unknown as RecordService);
  return fn;
}

/** 執行 boot（Quasar 啟動時會傳入 { app, router, store, ... }；這個 boot 只用到 store） */
async function runBoot(pinia: Pinia) {
  const boot = bootPocketbase as unknown as (ctx: { store: Pinia }) => Promise<void>;
  await boot({ store: pinia });
}

let pinia: Pinia;

beforeEach(() => {
  localStorage.clear();
  pb.authStore.clear();
  pinia = createPinia();
  setActivePinia(pinia);
});

describe('App 啟動（boot/pocketbase.ts）', () => {
  it('從沒登入過：啟動後是未登入，不呼叫伺服器', async () => {
    const refresh = mockRefresh('ok');
    await runBoot(pinia);
    expect(useAuthStore().isAuthenticated).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('上次登入、token 還有效：重開 App 仍是登入狀態，並換新 token（AC-1.7）', async () => {
    previousSession(3600);
    const oldToken = pb.authStore.token;
    const refresh = mockRefresh('ok');
    await runBoot(pinia);
    const auth = useAuthStore();
    expect(refresh).toHaveBeenCalledOnce();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.displayName).toBe('老皮');
    expect(pb.authStore.token).not.toBe(oldToken);
  });

  it('上次登入、token 已過期：重開 App 變成未登入，localStorage 清空', async () => {
    previousSession(-60);
    const refresh = mockRefresh('ok');
    await runBoot(pinia);
    expect(useAuthStore().isAuthenticated).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
    expect(localStorage.getItem('pocketbase_auth')).toBeNull();
  });

  it('token 被伺服器拒絕（帳號已刪除、token 失效）：變成未登入', async () => {
    previousSession(3600);
    mockRefresh(401);
    await runBoot(pinia);
    expect(useAuthStore().isAuthenticated).toBe(false);
  });

  it('打開 App 時連不上伺服器（沒開 Tailscale）：保持登入，不會被登出', async () => {
    previousSession(3600);
    mockRefresh(0);
    await runBoot(pinia);
    const auth = useAuthStore();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.displayName).toBe('老皮');
  });

  it('啟動後持續同步：之後 SDK 登出，store 也跟著變成未登入', async () => {
    previousSession(3600);
    mockRefresh('ok');
    await runBoot(pinia);
    const auth = useAuthStore();
    expect(auth.isAuthenticated).toBe(true);
    pb.authStore.clear();
    expect(auth.isAuthenticated).toBe(false);
  });
});
