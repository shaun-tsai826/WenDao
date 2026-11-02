// 真正的 src/router/index.ts（task 5.3，AC-1.3、AC-1.7）
// authGuard.test.ts 測的是守衛「邏輯」；這裡測「串接」：守衛有沒有掛上、讀的是不是 SDK 的登入狀態。
import { describe, it, expect, beforeEach } from 'vitest';
import createAppRouter from '@/router/index';
import pb from '@/lib/pocketbase';
import type { Router } from 'vue-router';

function fakeJwt(expSecondsFromNow: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  return `${b64({ alg: 'HS256' })}.${b64({ id: 'u1', type: 'auth', exp })}.sig`;
}

// Quasar 呼叫 defineRouter 的函式時會傳入 { store, ssrContext }；這個 router 用不到
const makeRouter = () => (createAppRouter as unknown as (ctx: object) => Router)({});

async function go(router: Router, path: string) {
  await router.push(path).catch(() => undefined);
  return router.currentRoute.value.path;
}

beforeEach(() => {
  pb.authStore.clear();
  localStorage.clear();
});

describe('App 的 router（src/router/index.ts）', () => {
  it('未登入：打開功能頁被導向 /login（AC-1.3）', async () => {
    const router = makeRouter();
    expect(await go(router, '/purchases')).toBe('/login');
  });

  it('SDK 有有效 token：可以進入功能頁', async () => {
    pb.authStore.save(fakeJwt(3600), { id: 'u1', name: '老皮' } as never);
    const router = makeRouter();
    expect(await go(router, '/purchases')).toBe('/purchases');
  });

  it('使用中 token 過期：下一次換頁就被導向 /login', async () => {
    pb.authStore.save(fakeJwt(3600), { id: 'u1' } as never);
    const router = makeRouter();
    expect(await go(router, '/products')).toBe('/products');
    pb.authStore.save(fakeJwt(-1), { id: 'u1' } as never); // 模擬 token 到期
    expect(await go(router, '/categories')).toBe('/login');
  });

  it('登出（SDK 清除）後：下一次換頁就被導向 /login', async () => {
    pb.authStore.save(fakeJwt(3600), { id: 'u1' } as never);
    const router = makeRouter();
    expect(await go(router, '/')).toBe('/');
    pb.authStore.clear();
    expect(await go(router, '/products')).toBe('/login');
  });

  it('已登入打開 /login：導回首頁', async () => {
    pb.authStore.save(fakeJwt(3600), { id: 'u1' } as never);
    const router = makeRouter();
    expect(await go(router, '/login')).toBe('/');
  });
});
