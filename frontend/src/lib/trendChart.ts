// 用 Chart.js 畫價格趨勢圖（task 10.1；design.md v4.4「價格趨勢圖」）
// 外部套件只在這個檔案出現：元件透過 drawTrendChart 畫圖，測試時可以換成假的（jsdom 沒有 canvas）。
// 圖的規則（dataviz）：單一序列不放圖例；線 2px 主色；點 8px、外圈 2px 白；格線 1px 淡灰實線；
// 橫軸是數字軸（距第一筆的天數，刻度轉成日期）；歷史均價 1px 灰色實線＋直接標示；不填色、不用漸層。
import {
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type Plugin,
} from 'chart.js';
import { formatUnitPrice } from '@/lib/purchaseView';
import type { Trend } from '@/lib/trendView';

// 只註冊用到的元件（不用 chart.js/auto，打包比較小）
Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip);

export interface TrendChartHandle {
  destroy(): void;
}

/** 從全站 CSS 變數取色（app.scss），讀不到時用預設值 */
function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function drawTrendChart(canvas: HTMLCanvasElement, trend: Trend): TrendChartHandle {
  const accent = token('--accent', '#1d5fd6');
  const muted = token('--muted', '#5c6064');
  const text = token('--text', '#1b1d1f');
  const rule = token('--rule', '#f0f1f3');
  const neutralInk = token('--status-neutral-ink', '#3a3d40');
  const surface = token('--surface', '#ffffff');
  const font = getComputedStyle(canvas).fontFamily || 'sans-serif';

  const values = trend.points.map((p) => p.y);
  if (trend.average !== null) values.push(trend.average);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min || max * 0.1 || 0.1) * 0.2;
  const lastX = trend.points.at(-1)?.x ?? 0;

  // 歷史均價參考線：畫在價格線下面，左側標示數值
  const averageLine: Plugin<'line'> = {
    id: 'averageLine',
    beforeDatasetsDraw(chart) {
      if (trend.average === null) return;
      const { ctx, chartArea, scales } = chart;
      const y = scales.y!.getPixelForValue(trend.average);
      ctx.save();
      ctx.strokeStyle = muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, Math.round(y) + 0.5);
      ctx.lineTo(chartArea.right, Math.round(y) + 0.5);
      ctx.stroke();
      ctx.fillStyle = neutralInk;
      ctx.font = `12px ${font}`;
      ctx.textBaseline = 'alphabetic';
      // 標示放在線下方；太靠近底部時放到線上方
      const below = y + 16 < chartArea.bottom;
      ctx.fillText(
        `歷史均價 ${formatUnitPrice(trend.average)}`,
        chartArea.left + 4,
        below ? y + 15 : y - 5,
      );
      ctx.restore();
    },
  };

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        {
          data: trend.points.map((p) => ({ x: p.x, y: p.y })),
          borderColor: accent,
          borderWidth: 2,
          borderJoinStyle: 'round',
          borderCapStyle: 'round',
          tension: 0,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHitRadius: 16,
          pointBackgroundColor: accent,
          pointBorderColor: surface,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { top: 8, right: 10 } },
      interaction: { mode: 'nearest', intersect: false, axis: 'x' },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: Math.max(lastX, 1),
          grid: { display: false },
          border: { color: rule },
          ticks: {
            maxTicksLimit: 4,
            maxRotation: 0,
            color: muted,
            font: { size: 12, family: font },
            callback: (value) => trend.xLabel(Number(value)),
          },
        },
        y: {
          type: 'linear',
          suggestedMin: min - pad,
          suggestedMax: max + pad,
          grid: { color: rule },
          border: { display: false },
          ticks: {
            maxTicksLimit: 4,
            color: muted,
            font: { size: 12, family: font },
            callback: (value) => Number(value).toFixed(2),
          },
        },
      },
      plugins: {
        tooltip: {
          displayColors: false,
          backgroundColor: text,
          titleColor: '#ffffff',
          bodyColor: '#d6d9dd',
          padding: 10,
          cornerRadius: 10,
          titleFont: { size: 15, weight: 'normal', family: font },
          bodyFont: { size: 12, family: font },
          callbacks: {
            title: (items) => trend.points[items[0]!.dataIndex]!.value,
            label: (item) => trend.points[item.dataIndex]!.note,
          },
        },
      },
    },
    plugins: [averageLine],
  });
  return chart;
}
