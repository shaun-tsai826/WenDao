// Vitest 全域設定（每個測試檔執行前載入）
//
// jsdom（測試用的模擬瀏覽器）沒有 ResizeObserver，但 Quasar 的 QLayout 需要它來偵測尺寸變化。
// 測試不關心尺寸，所以放一個「什麼都不做」的替身就好。
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}
