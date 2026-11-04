// 價格趨勢圖元件（task 10.1，REQ-8 / AC-8.8；設計稿 Prod-Trend、Prod-Trend-Empty）
// 真正畫圖（Chart.js）需要瀏覽器的 canvas，jsdom 沒有：這裡把 lib/trendChart.ts 換成假的，
// 確認元件交給它的資料、重畫與清除；實際畫出來的樣子由 e2e（無頭 Chrome）檢查。
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PriceTrendChart from '@/components/PriceTrendChart.vue';
import { STATUS } from '@/constants/messages';
import { toPurchaseView } from '@/lib/purchaseView';
import type { Trend } from '@/lib/trendView';
import type { PurchaseRecordRecord } from '@/types/models';

const destroy = vi.fn();
const draw = vi.fn<(canvas: HTMLCanvasElement, trend: Trend) => { destroy: () => void }>(() => ({
  destroy,
}));
vi.mock('@/lib/trendChart', () => ({
  drawTrendChart: (...args: [HTMLCanvasElement, Trend]) => draw(...args),
}));

function view(id: string, date: string, unitPrice: number, quantity = 1200) {
  return toPurchaseView({
    id,
    collectionId: 'purchase_records',
    collectionName: 'purchase_records',
    product: 'p',
    purchase_date: `${date} 00:00:00.000Z`,
    store: '全聯',
    total_price: 599,
    quantity,
    unit_price: unitPrice,
    user: 'u',
  } satisfies PurchaseRecordRecord);
}

const THREE = [
  view('r-3', '2026-10-20', 0.4992),
  view('r-2', '2026-09-05', 0.4575),
  view('r-1', '2026-07-12', 0.5242),
];

const mountChart = (purchases = THREE) =>
  mount(PriceTrendChart, {
    props: { purchases, unit: '抽', today: '2026-11-04' },
    attachTo: document.body,
  });

beforeEach(() => {
  document.body.innerHTML = '';
  draw.mockClear();
  destroy.mockClear();
});

describe('有 2 筆以上', () => {
  it('標題「單位均價趨勢」、右側「3 筆 · 元/抽」、說明文字', async () => {
    const w = mountChart();
    await flushPromises();
    expect(w.find('h2').text()).toBe('單位均價趨勢');
    expect(w.find('.trend__meta').text()).toBe('3 筆 · 元/抽');
    expect(w.find('.trend__hint').text()).toBe('點圖上的點看那次的價格；數量沒填的記錄不畫進圖');
    w.unmount();
  });

  it('canvas 是 role="img"，aria-label 寫出各點與歷史均價', async () => {
    const w = mountChart();
    await flushPromises();
    const canvas = w.find('canvas');
    expect(canvas.attributes('role')).toBe('img');
    expect(canvas.attributes('aria-label')).toBe(
      '單位均價趨勢：7/12 0.5242、9/5 0.4575、10/20 0.4992 元/抽；歷史均價 0.4936 元/抽',
    );
    w.unmount();
  });

  it('掛上後把 canvas 與整理好的資料交給 drawTrendChart（舊到新、依天數）', async () => {
    const w = mountChart();
    await flushPromises();
    expect(draw).toHaveBeenCalledTimes(1);
    const [canvas, trend] = draw.mock.calls[0]!;
    expect(canvas).toBe(w.find('canvas').element);
    expect(trend.points.map((p) => [p.x, p.y])).toEqual([
      [0, 0.5242],
      [55, 0.4575],
      [100, 0.4992],
    ]);
    expect(trend.average).toBe(0.4936);
    w.unmount();
  });

  it('資料變了 → 清掉舊圖再重畫；離開頁面時清掉圖（避免記憶體洩漏）', async () => {
    const w = mountChart();
    await flushPromises();
    await w.setProps({ purchases: [view('r-4', '2026-11-01', 0.45), ...THREE] });
    await flushPromises();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(draw).toHaveBeenCalledTimes(2);
    expect(draw.mock.calls[1]![1].count).toBe(4);
    w.unmount();
    expect(destroy).toHaveBeenCalledTimes(2);
  });
});

describe('少於 2 筆（STATUS-005，使用者決定）', () => {
  it('只有 1 筆 → STATUS-005 與「目前 1 筆」，不畫圖', async () => {
    const w = mountChart([THREE[0]!]);
    await flushPromises();
    const empty = w.find('[role=status]');
    expect(empty.find('.trend__empty-title').text()).toBe(STATUS.notEnoughTrendData);
    expect(empty.find('.trend__empty-text').text()).toBe(
      '要有 2 筆以上算得出單位均價的購買記錄（目前 1 筆）',
    );
    expect(w.find('canvas').exists()).toBe(false);
    expect(draw).not.toHaveBeenCalled();
    expect(w.find('.trend__meta').text()).toBe('元/抽');
    w.unmount();
  });

  it('數量都沒填（0 筆可計算）→ 目前 0 筆', async () => {
    const w = mountChart([view('a', '2026-10-01', 0, 0), view('b', '2026-10-02', 0, 0)]);
    await flushPromises();
    expect(w.find('.trend__empty-text').text()).toContain('（目前 0 筆）');
    w.unmount();
  });

  it('從 1 筆變成 2 筆 → 開始畫圖', async () => {
    const w = mountChart([THREE[0]!]);
    await flushPromises();
    await w.setProps({ purchases: THREE.slice(0, 2) });
    await flushPromises();
    expect(draw).toHaveBeenCalledTimes(1);
    expect(w.find('[role=status]').exists()).toBe(false);
    w.unmount();
  });
});
