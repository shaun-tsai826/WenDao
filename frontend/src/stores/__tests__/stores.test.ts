// Pinia stores 骨架（task 2.5）與 auth 同步
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import pb from '@/lib/pocketbase';
import { useAuthStore } from '@/stores/auth';
import { useCategoryStore } from '@/stores/category';
import { useProductStore } from '@/stores/product';
import { usePurchaseStore } from '@/stores/purchase';
import type { CategoryRecord, ProductRecord } from '@/types/models';

function fakeJwt(expSecondsFromNow: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  return `${b64({ alg: 'HS256' })}.${b64({ id: 'u1', type: 'auth', exp })}.sig`;
}

beforeEach(() => {
  pb.authStore.clear();
  setActivePinia(createPinia());
});

describe('useAuthStore：與 SDK 同步', () => {
  function syncedStore() {
    const auth = useAuthStore();
    auth.syncFromPb();
    const unsubscribe = pb.authStore.onChange(() => auth.syncFromPb());
    return { auth, unsubscribe };
  }

  it('初始未登入', () => {
    const { auth, unsubscribe } = syncedStore();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.displayName).toBe('');
    expect(auth.token).toBe('');
    unsubscribe();
  });

  it('SDK 登入後，store 自動顯示使用者名稱（AC-1.5）', () => {
    const { auth, unsubscribe } = syncedStore();
    pb.authStore.save(fakeJwt(3600), { id: 'u1', name: '老皮' } as never);
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.displayName).toBe('老皮');
    expect(auth.token).not.toBe('');
    unsubscribe();
  });

  it('SDK 登出後，store 自動清空', () => {
    const { auth, unsubscribe } = syncedStore();
    pb.authStore.save(fakeJwt(3600), { id: 'u1', name: '老皮' } as never);
    pb.authStore.clear();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.displayName).toBe('');
    unsubscribe();
  });

  it('過期的 token 不算登入', () => {
    const { auth, unsubscribe } = syncedStore();
    pb.authStore.save(fakeJwt(-60), { id: 'u1', name: '老皮' } as never);
    expect(auth.isAuthenticated).toBe(false);
    unsubscribe();
  });
});

describe('資料 stores 骨架', () => {
  it('初始狀態為空、非載入中', () => {
    const c = useCategoryStore();
    const p = useProductStore();
    const r = usePurchaseStore();
    expect([c.categories, p.products, r.records].map((x) => x.length)).toEqual([0, 0, 0]);
    expect([c.loading, p.loading, r.loading]).toEqual([false, false, false]);
  });

  it('getters', () => {
    const c = useCategoryStore();
    const p = useProductStore();
    c.categories = [{ id: 'c1', name: '衛生紙' } as CategoryRecord];
    p.products = [
      { id: 'p1', category: 'c1' } as ProductRecord,
      { id: 'p2', category: 'c2' } as ProductRecord,
    ];
    expect(c.getById('c1')?.name).toBe('衛生紙');
    expect(p.byCategory('c1')).toHaveLength(1);
    expect(p.getById('p2')?.id).toBe('p2');
    expect(usePurchaseStore().getById('x')).toBeUndefined();
  });

  it.each([
    ['fetchRecords', '8.1', () => usePurchaseStore().fetchRecords()],
    ['deleteRecord', '8.1', () => usePurchaseStore().deleteRecord('x')],
  ])('尚未實作的 %s 會丟出指向 task %s 的錯誤', (action, task, call) => {
    expect(call).toThrow(`${action} 尚未實作（task ${task}）`);
  });
});
