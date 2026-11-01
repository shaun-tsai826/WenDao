// Quasar boot：App 啟動、畫面出現之前先執行（task 2.3）
// 恢復上次的登入狀態，邏輯在 src/lib/restoreAuth.ts。
//
// 同步到 Pinia 的 auth store（pb.authStore.onChange）在 task 2.5 建立 store 時接上。
import { defineBoot } from '#q-app';
import pb from '@/lib/pocketbase';
import { restoreAuth } from '@/lib/restoreAuth';

export default defineBoot(async () => {
  await restoreAuth(pb);
});
