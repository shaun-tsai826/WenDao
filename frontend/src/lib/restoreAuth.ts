// 啟動時恢復登入狀態（task 2.3，AC-1.7）
//
// client 由外部傳入（而不是直接 import pb），這樣測試時可以換成連到測試伺服器的 client。
//
// SDK 已經自動從 localStorage 讀回上次的 token，這裡再做兩件事：
// 1. token 已過期 → 清掉，避免留下無效的登入狀態
// 2. token 還有效 → 向 PocketBase 換一個新的 token（authRefresh），
//    順便確認帳號還存在；只要隔幾天打開一次 App 就會一直保持登入
import { ClientResponseError } from 'pocketbase';
import type PocketBase from 'pocketbase';

export async function restoreAuth(client: PocketBase): Promise<void> {
  if (!client.authStore.isValid) {
    client.authStore.clear();
    return;
  }

  try {
    await client.collection('users').authRefresh();
  } catch (err) {
    // status 0 = 連不上伺服器（例如沒開 Tailscale）：保留登入狀態，等網路恢復
    // 其他錯誤（401 token 失效、404 帳號被刪除等）：登出
    if (err instanceof ClientResponseError && err.status === 0) return;
    client.authStore.clear();
  }
}
