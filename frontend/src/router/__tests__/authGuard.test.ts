// 路由守衛（task 2.4，AC-1.3、AC-1.1）
// 用真的 vue-router（記憶體模式）跑真正的 routes.ts，頁面元件換成空殼。
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router';
import routes from '@/router/routes';
import { authGuard } from '@/router/authGuard';

const Dummy = { render: () => null };
const stub = (rs: RouteRecordRaw[]): RouteRecordRaw[] =>
  rs.map(
    (r) =>
      ({
        ...r,
        component: Dummy,
        ...(r.children ? { children: stub(r.children) } : {}),
      }) as RouteRecordRaw,
  );

async function navigate(path: string, loggedIn: boolean): Promise<string> {
  const router = createRouter({ history: createMemoryHistory(), routes: stub(routes) });
  router.beforeEach((to) => authGuard(to, loggedIn));
  await router.push(path).catch(() => undefined);
  return router.currentRoute.value.path;
}

// design.md「頁面與路由對照」的 11 個功能頁（不含 /login）
const PROTECTED = [
  '/',
  '/categories',
  '/categories/abc/edit',
  '/products',
  '/products/new',
  '/products/abc',
  '/products/abc/edit',
  '/purchases',
  '/purchases/new',
  '/purchases/abc',
  '/purchases/abc/edit',
];

describe('路由設定', () => {
  it('共 12 條功能路由（/login + 11 個功能頁）', () => {
    const main = routes.find((r) => r.path === '/');
    expect(routes.some((r) => r.path === '/login')).toBe(true);
    expect(main?.children).toHaveLength(11);
  });

  it('/products/new 不會被當成 /products/:id', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: stub(routes) });
    await router.push('/products/new');
    expect(router.currentRoute.value.params).not.toHaveProperty('id');
  });
});

describe('authGuard', () => {
  it.each(PROTECTED)('未登入打開 %s → 導向 /login（AC-1.3）', async (path) => {
    expect(await navigate(path, false)).toBe('/login');
  });

  it.each(PROTECTED)('已登入打開 %s → 可以進入', async (path) => {
    expect(await navigate(path, true)).toBe(path);
  });

  it('未登入打開 /login → 留在登入頁', async () => {
    expect(await navigate('/login', false)).toBe('/login');
  });

  it('已登入打開 /login → 導回首頁', async () => {
    expect(await navigate('/login', true)).toBe('/');
  });

  it('找不到的頁面不需要登入（顯示 404）', async () => {
    expect(await navigate('/no-such-page', false)).toBe('/no-such-page');
  });

  // 屬性測試：任意 id（英數字）組成的詳情 / 編輯網址，未登入一律被擋
  it('任意 id 的詳情 / 編輯頁，未登入都會導向 /login', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/products/', '/purchases/', '/categories/'),
        fc.stringMatching(/^[a-z0-9]{15}$/),
        fc.constantFrom('', '/edit'),
        async (prefix, id, suffix) => {
          const path =
            prefix === '/categories/' ? `${prefix}${id}/edit` : `${prefix}${id}${suffix}`;
          return (await navigate(path, false)) === '/login';
        },
      ),
      { numRuns: 50 },
    );
  });
});
