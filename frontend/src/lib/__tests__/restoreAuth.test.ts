// restoreAuth：App 啟動時恢復登入狀態（task 2.3，AC-1.7）
// 用「假的 client」取代真正的 PocketBase，所以不需要啟動伺服器（介面＋注入）。
import { describe, it, expect, vi } from 'vitest';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { restoreAuth } from '@/lib/restoreAuth';

// 做一個 JWT：PocketBase SDK 只讀 payload 的 exp 判斷是否過期，不驗證簽章
function fakeJwt(expSecondsFromNow: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ id: 'u1', type: 'auth', exp })}.sig`;
}

// 真正的 SDK client（真的 authStore），只把 authRefresh 換成假的
function clientWith(token: string, authRefresh: () => Promise<unknown>) {
  const pb = new PocketBase('http://127.0.0.1:65535');
  if (token) pb.authStore.save(token, { id: 'u1', name: '老皮' } as never);
  const refresh = vi.fn(authRefresh);
  vi.spyOn(pb, 'collection').mockReturnValue({ authRefresh: refresh } as never);
  return { pb, refresh };
}

const httpError = (status: number) => new ClientResponseError({ status, response: {} });

describe('restoreAuth', () => {
  it('沒有 token：維持未登入，不呼叫伺服器', async () => {
    const { pb, refresh } = clientWith('', () => Promise.resolve());
    await restoreAuth(pb);
    expect(pb.authStore.isValid).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('token 已過期：清除，不呼叫伺服器', async () => {
    const { pb, refresh } = clientWith(fakeJwt(-60), () => Promise.resolve());
    await restoreAuth(pb);
    expect(pb.authStore.token).toBe('');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('token 有效：呼叫 authRefresh 換新，保持登入（AC-1.7）', async () => {
    const { pb, refresh } = clientWith(fakeJwt(3600), () => Promise.resolve());
    await restoreAuth(pb);
    expect(refresh).toHaveBeenCalledOnce();
    expect(pb.authStore.isValid).toBe(true);
  });

  it.each([
    [401, 'token 失效或偽造'],
    [403, '沒有權限'],
    [404, '帳號已被刪除'],
    [500, '伺服器錯誤'],
  ])('伺服器回 %i（%s）：登出', async (status) => {
    const { pb } = clientWith(fakeJwt(3600), () => Promise.reject(httpError(status)));
    await restoreAuth(pb);
    expect(pb.authStore.isValid).toBe(false);
  });

  it('連不上伺服器（status 0，例如沒開 Tailscale）：保留登入', async () => {
    const { pb } = clientWith(fakeJwt(3600), () => Promise.reject(httpError(0)));
    await restoreAuth(pb);
    expect(pb.authStore.isValid).toBe(true);
  });

  it('不是 PocketBase 的錯誤：登出（保守處理）', async () => {
    const { pb } = clientWith(fakeJwt(3600), () => Promise.reject(new Error('boom')));
    await restoreAuth(pb);
    expect(pb.authStore.isValid).toBe(false);
  });
});
