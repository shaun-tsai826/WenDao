// Vitest 設定（task 2.8）
// 執行：npm test（跑一次）、npm run test:watch（改檔自動重跑）
//
// Quasar 的 quasar.config.ts 只管 dev / build，測試另外用這份設定，
// 所以這裡要自己補上：@/ 路徑別名、.vue 檔的編譯、VITE_POCKETBASE_URL。
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { defineConfig } from 'vitest/config';

// 固定時區為家裡實際使用的 Asia/Taipei（task 7.7）：日期相關測試（例如清晨 00:30 儲存要記成當天，
// 而不是 UTC 的前一天）在任何電腦上都得到同樣結果。測試程序（worker）會繼承這個環境變數。
process.env.TZ = 'Asia/Taipei';

export default defineConfig({
  // quasar()：和正式 build 一樣自動載入 <q-dialog>、<q-page> 等 Quasar 元件。
  // 少了它，測試裡的 Quasar 元件只是沒有功能的普通標籤（task 6.5 面板問題沒被測到的原因）
  plugins: [vue({ template: { transformAssetUrls } }), quasar({ sassVariables: false })],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // Quasar 預設會載入伺服器端版本；測試是模擬瀏覽器，要改用 client 版本（Quasar 錯誤訊息的建議做法）
      { find: /^quasar$/, replacement: 'quasar/dist/quasar.client.js' },
      // #q-app 的 defineRouter / defineBoot 只是「原樣回傳函式」，測試直接用 Quasar 官方的實作（@quasar/app-vite 主入口）
      { find: /^#q-app$/, replacement: '@quasar/app-vite' },
    ],
  },
  define: {
    // 測試不連真正的 PocketBase；需要時用假的 client（見 src/lib/__tests__）
    'import.meta.env.VITE_POCKETBASE_URL': JSON.stringify('http://127.0.0.1:65535'),
  },
  test: {
    environment: 'jsdom', // 模擬瀏覽器（localStorage、DOM），元件測試需要
    include: ['src/**/__tests__/**/*.test.ts'],
    restoreMocks: true,
    setupFiles: ['src/test-utils/setup.ts'], // jsdom 缺少的瀏覽器 API 替身
  },
});
