// 共用的 pb 實例（回歸測試：task 6.5 e2e 發現的問題）
//
// 問題：PocketBase SDK 預設會「自動取消」重複的請求——同一個 collection 同時有兩個列表查詢時，
// 先發出的那個會被取消（status 0），畫面誤顯示 ERR-014「無法連線至伺服器」。
// 編輯分類頁同時取得「統計」與「欄位清單」都會查 custom_fields，因此一進頁面就失敗。
// 修正：關閉自動取消（src/lib/pocketbase.ts）。
import { describe, it, expect, vi, afterEach } from 'vitest';
import pb from '@/lib/pocketbase';

/** 假的 fetch：延遲一下才回應，並且尊重 AbortSignal（和瀏覽器一樣） */
function slowFetch() {
  return vi.fn((_url: string, init?: RequestInit) => {
    return new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(
          new Response(
            JSON.stringify({ page: 1, perPage: 1000, totalItems: 0, totalPages: 0, items: [] }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        );
      }, 20);
      init?.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('aborted', 'AbortError'));
      });
    });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pb 實例', () => {
  it('同一個 collection 同時查詢兩次：兩個都成功，不會互相取消', async () => {
    vi.stubGlobal('fetch', slowFetch());
    const results = await Promise.allSettled([
      pb.collection('custom_fields').getFullList(),
      pb.collection('custom_fields').getFullList(),
    ]);
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'fulfilled']);
  });
});
