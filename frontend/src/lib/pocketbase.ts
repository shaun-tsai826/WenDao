// PocketBase client（task 2.3）
// 整個 App 共用這一個 pb 實例。
//
// 網址由 quasar.config.ts 的 build.defineEnv 設定：
// - 開發（quasar dev）：http://localhost:8090
// - 正式（quasar build）：'/'（前端放在 PocketBase 的 pb_public，與 API 同網址）
//
// 登入狀態（token 與使用者資料）由 SDK 的 LocalAuthStore 自動存在瀏覽器的 localStorage，
// 重新整理或關掉瀏覽器再打開時會自動讀回來（AC-1.7）。
import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

// 關閉 SDK 的「自動取消重複請求」：預設同一個 collection 同時有兩個列表查詢時，
// 先發出的會被取消，畫面會誤顯示「無法連線」。本 App 常同時載入多份資料，所以關閉。
// （task 6.5 e2e 發現；回歸測試：src/lib/__tests__/pocketbase.test.ts）
pb.autoCancellation(false);

export default pb;
