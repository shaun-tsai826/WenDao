// useAuthStore：登入狀態（task 2.5 骨架、task 5.1 實作 login / logout）
//
// 登入狀態的「正本」在 PocketBase SDK 的 pb.authStore（自動存在 localStorage）。
// 這個 store 只是畫面用的副本：boot 時會呼叫 syncFromPb()，並在 pb.authStore
// 變化時（登入、登出、token 換新）自動同步（見 src/boot/pocketbase.ts）。
import { defineStore, acceptHMRUpdate } from 'pinia';
import pb from '@/lib/pocketbase';
import type { UserRecord } from '@/types/models';
import { apiErrorMessage } from '@/lib/errors';
import { ERR } from '@/constants/messages';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserRecord | null,
    token: '',
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
    displayName: (state) => state.user?.name ?? '',
  },

  actions: {
    // 從 SDK 複製目前的登入狀態（token 無效時視為未登入）
    syncFromPb() {
      const valid = pb.authStore.isValid;
      this.user = valid ? (pb.authStore.record as UserRecord | null) : null;
      this.token = valid ? pb.authStore.token : '';
    },

    /**
     * 登入（task 5.1，AC-1.1）。
     * 成功：SDK 把 token 存進 localStorage（重開 App 仍保持登入，AC-1.7），store 同步顯示使用者。
     * 失敗：直接把錯誤丟給呼叫的頁面，由頁面決定顯示哪則訊息（見 loginErrorMessage）。
     */
    async login(email: string, password: string): Promise<void> {
      await pb.collection('users').authWithPassword(email.trim(), password);
      this.syncFromPb();
    },

    /** 登出（task 5.1，AC-1.6）：清除 SDK 的登入狀態與 store */
    logout(): void {
      pb.authStore.clear();
      this.syncFromPb();
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}

/**
 * 把登入失敗的錯誤轉成要顯示的訊息（task 5.1）：
 * - 連不上伺服器（status 0，例如沒開 Tailscale）→ ERR-014
 * - 伺服器錯誤（5xx）→ ERR-013
 * - 其他（帳號或密碼錯、欄位空白…）→ ERR-001「帳號或密碼錯誤，請重新輸入」（AC-1.2）
 */
export function loginErrorMessage(err: unknown): string {
  return apiErrorMessage(err, ERR.loginFailed);
}
