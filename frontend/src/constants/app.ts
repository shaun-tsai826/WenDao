// App 名稱（2026-11-03 使用者決定：家庭ERP → 溫叨Pantry）
// 畫面上要顯示 App 名稱時一律用這裡的常數，不要在頁面裡直接寫字串。
// package.json 的 productName、src-pwa/manifest.json 的 name / short_name 不能 import，
// 由 constants/__tests__/app.test.ts 檢查它們和這裡一致。

/** 中文名稱：頂欄、登入頁、瀏覽器分頁標題、手機桌面圖示下的名字 */
export const APP_NAME = '溫叨Pantry';

/** 不能用中文的地方（資料夾、識別碼等）用這個；需要全小寫時寫成 wendaopantry */
export const APP_NAME_ASCII = 'WenDaoPantry';
