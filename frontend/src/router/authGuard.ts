// 路由守衛的判斷邏輯（task 2.4，AC-1.3、AC-1.1）
//
// 寫成純函數：輸入「要去哪一頁」和「是否已登入」，輸出「要改去哪裡」。
// 不直接讀取登入狀態，方便在 task 2.8 用 Vitest 測試。
import type { RouteLocationNormalized } from 'vue-router';

export type GuardResult = '/login' | '/' | undefined; // undefined = 放行

export function authGuard(
  to: Pick<RouteLocationNormalized, 'path' | 'meta'>,
  isAuthenticated: boolean,
): GuardResult {
  // 未登入存取受保護頁面 → 登入頁（AC-1.3）
  if (to.meta.requiresAuth && !isAuthenticated) return '/login';
  // 已登入又打開登入頁 → 首頁
  if (to.path === '/login' && isAuthenticated) return '/';
  return undefined;
}

// 讓 TypeScript 認得 routes.ts 用到的 meta 欄位
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    public?: boolean;
  }
}
