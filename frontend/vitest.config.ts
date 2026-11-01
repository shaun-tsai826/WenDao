// Vitest 設定（task 2.8）
// 執行：npm test（跑一次）、npm run test:watch（改檔自動重跑）
//
// Quasar 的 quasar.config.ts 只管 dev / build，測試另外用這份設定，
// 所以這裡要自己補上：@/ 路徑別名、.vue 檔的編譯、VITE_POCKETBASE_URL。
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // Quasar 預設會載入伺服器端版本；測試是模擬瀏覽器，要改用 client 版本（Quasar 錯誤訊息的建議做法）
      { find: /^quasar$/, replacement: 'quasar/dist/quasar.client.js' },
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
  },
});
