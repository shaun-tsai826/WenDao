// useAuthStore：登入狀態（task 2.5 骨架；login / logout 於 task 5.1 實作）
//
// 登入狀態的「正本」在 PocketBase SDK 的 pb.authStore（自動存在 localStorage）。
// 這個 store 只是畫面用的副本：boot 時會呼叫 syncFromPb()，並在 pb.authStore
// 變化時（登入、登出、token 換新）自動同步（見 src/boot/pocketbase.ts）。
import { defineStore, acceptHMRUpdate } from 'pinia';
import pb from '@/lib/pocketbase';
import type { UserRecord } from '@/types/models';
import { notImplemented } from './notImplemented';

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login(email: string, password: string): Promise<void> {
      notImplemented('login', '5.1');
    },

    logout(): void {
      notImplemented('logout', '5.1');
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
