// Quasar boot：App 啟動、畫面出現之前先執行
// 1. 恢復上次的登入狀態（task 2.3，邏輯在 src/lib/restoreAuth.ts）
// 2. 把 SDK 的登入狀態同步到 Pinia 的 auth store（task 2.5）
import { defineBoot } from '#q-app';
import pb from '@/lib/pocketbase';
import { restoreAuth } from '@/lib/restoreAuth';
import { useAuthStore } from '@/stores/auth';

export default defineBoot(async ({ store }) => {
  await restoreAuth(pb);

  const auth = useAuthStore(store);
  auth.syncFromPb();
  // 登入、登出、token 換新時自動同步
  pb.authStore.onChange(() => auth.syncFromPb());
});
