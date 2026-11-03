// BrandLogo：溫叨@Pantry 的門牌 Logo（Logo A，2026-11-03 使用者選定）
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BrandLogo from '@/components/BrandLogo.vue';
import { HEADER_DIGITS, PLATE_DIGITS } from '@/components/brandPaths';
import { APP_NAME } from '@/constants/app';

describe('BrandLogo', () => {
  it('藍底門牌＋白色內框＋數字 5888 的外框路徑（不依賴字型）', () => {
    const svg = mount(BrandLogo).find('svg');
    expect(svg.attributes('viewBox')).toBe('0 0 140 96');
    const rects = svg.findAll('rect');
    expect(rects[0]!.attributes('fill')).toBe('#1d5fd6');
    expect(rects[1]!.attributes('stroke')).toBe('#ffffff');
    expect(svg.find('path').attributes('d')).toBe(PLATE_DIGITS);
    expect(svg.find('text').exists()).toBe(false);
  });

  it('預設是裝飾用（旁邊已經有文字名稱）：aria-hidden，螢幕閱讀器不重複念', () => {
    const svg = mount(BrandLogo).find('svg');
    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.attributes('role')).toBeUndefined();
  });

  it('單獨出現時可給名稱：role="img"＋aria-label', () => {
    const svg = mount(BrandLogo, { props: { label: true } }).find('svg');
    expect(svg.attributes('role')).toBe('img');
    expect(svg.attributes('aria-label')).toBe(`${APP_NAME} 標誌：門牌 5888`);
    expect(svg.attributes('aria-hidden')).toBeUndefined();
  });

  it('頂欄小尺寸（variant="header"）：框線加粗、數字放大的版本', () => {
    const svg = mount(BrandLogo, { props: { variant: 'header' } }).find('svg');
    expect(svg.find('path').attributes('d')).toBe(HEADER_DIGITS);
    expect(svg.findAll('rect')[1]!.attributes('stroke-width')).toBe('5');
  });
});
