// DepletionBadge（task 7.2，REQ-7 / AC-7.4、AC-7.5、AC-7.7、AC-7.12）
// 依 getDepletionStatus 的結果顯示狀態標籤；文字一律來自訊息集中表。
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DepletionBadge from '@/components/DepletionBadge.vue';
import { STATUS } from '@/constants/messages';
import { getDepletionStatus, type DepletionStatus } from '@/composables/useDepletionStatus';

function render(status: DepletionStatus) {
  return mount(DepletionBadge, { props: { status } });
}

describe('DepletionBadge', () => {
  it.each([
    ['unset', STATUS.rateNotSet, 'neutral'], // STATUS-002 · AC-7.7
    ['no_remaining', STATUS.remainingNotSet, 'neutral'], // STATUS-007 · AC-7.12
    ['soon', STATUS.soon, 'soon'], // STATUS-003 · AC-7.4
    ['depleted', STATUS.depleted, 'depleted'], // STATUS-004 · AC-7.5
  ] as const)('%s → 顯示「%s」，配色 %s', (status, text, tone) => {
    const badge = render(status).find('.depletion-badge');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe(text);
    expect(badge.classes()).toContain(`depletion-badge--${tone}`);
    expect(badge.attributes('data-status')).toBe(status);
  });

  it('normal（距耗盡超過 7 天）不顯示標籤（design.md：正常狀態只用一般文字）', () => {
    const wrapper = render('normal');
    expect(wrapper.find('.depletion-badge').exists()).toBe(false);
    expect(wrapper.text()).toBe('');
  });

  it('改變 status 時標籤跟著更新', async () => {
    const wrapper = render('soon');
    await wrapper.setProps({ status: 'depleted' });
    expect(wrapper.find('.depletion-badge').text()).toBe(STATUS.depleted);
    await wrapper.setProps({ status: 'normal' });
    expect(wrapper.find('.depletion-badge').exists()).toBe(false);
  });

  // 和 getDepletionStatus 串起來，確認 BDD 的邊界：今天耗盡算「即將耗盡」、第 8 天正常、昨天耗盡算「已耗盡」
  it.each([
    ['2026-11-02', STATUS.soon], // 今天（0 天）
    ['2026-11-09', STATUS.soon], // 第 7 天
    ['2026-11-10', null], // 第 8 天 → normal
    ['2026-11-01', STATUS.depleted], // 昨天
  ])('耗盡日 %s（今天 2026-11-02）→ %s', (date, text) => {
    const status = getDepletionStatus(date, 1, 5, '2026-11-02');
    const badge = render(status).find('.depletion-badge');
    if (text === null) expect(badge.exists()).toBe(false);
    else expect(badge.text()).toBe(text);
  });
});
