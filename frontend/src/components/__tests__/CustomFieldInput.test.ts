// CustomFieldInput：依分類的自訂欄位動態產生輸入欄位（task 8.2，REQ-4 / AC-4.5、AC-4.6）
// 設計：設計稿 Pur-New、Pur-New-Error、Pur-New-Qty；design.md v4.0「購買記錄 › CustomFieldInput」
import { describe, it, expect } from 'vitest';
import { h } from 'vue';
import { mount } from '@vue/test-utils';
import CustomFieldInput from '@/components/CustomFieldInput.vue';
import { ERR } from '@/constants/messages';
import type { CustomFieldRecord } from '@/types/models';

type Field = Pick<
  CustomFieldRecord,
  'id' | 'field_name' | 'field_type' | 'is_quantity_component' | 'display_order'
>;

// 衛生紙的 3 個欄位（建立順序刻意打亂，確認依 display_order 排列）
const TISSUE: Field[] = [
  {
    id: 'f-ply',
    field_name: '層數',
    field_type: 'number',
    is_quantity_component: false,
    display_order: 3,
  },
  {
    id: 'f-sheets',
    field_name: '抽數(單包)',
    field_type: 'number',
    is_quantity_component: true,
    display_order: 1,
  },
  {
    id: 'f-packs',
    field_name: '包數',
    field_type: 'number',
    is_quantity_component: true,
    display_order: 2,
  },
];
const ORIGIN: Field = {
  id: 'f-origin',
  field_name: '產地',
  field_type: 'text',
  is_quantity_component: false,
  display_order: 1,
};

function render(
  props: Partial<{
    fields: Field[];
    modelValue: Record<string, string>;
    title: string;
    errors: Record<string, string>;
  }> = {},
  slots = {},
) {
  return mount(CustomFieldInput, {
    props: {
      fields: TISSUE,
      modelValue: {},
      title: '衛生紙的包裝規格',
      'onUpdate:modelValue': () => undefined,
      ...props,
    },
    slots,
    attachTo: document.body,
  });
}

/** 模擬使用者在欄位裡打字：設定值並觸發 input，回傳 v-model 收到的新值 */
async function type(wrapper: ReturnType<typeof render>, id: string, value: string) {
  await wrapper.find(`#cf-${id}`).setValue(value);
  const events = wrapper.emitted('update:modelValue') as Record<string, string>[][];
  return events.at(-1)![0];
}

describe('畫面（AC-4.5）', () => {
  it('卡片標題；有數量組成欄位時說明「算數量」的欄位相乘＝總數量', () => {
    const w = render();
    expect(w.find('h2').text()).toBe('衛生紙的包裝規格');
    expect(w.find('section').attributes('aria-labelledby')).toBe(w.find('h2').attributes('id'));
    expect(w.find('.cf__hint').text()).toBe('「算數量」的欄位相乘＝總數量');
  });

  it('欄位依 display_order 排列；每欄有標籤、輸入框、「算數量 / 只記錄」標示', () => {
    const w = render();
    expect(w.findAll('label').map((l) => l.text())).toEqual(['抽數(單包)', '包數', '層數']);
    expect(w.findAll('label').map((l) => l.attributes('for'))).toEqual([
      'cf-f-sheets',
      'cf-f-packs',
      'cf-f-ply',
    ]);
    expect(w.findAll('.cf__tag').map((t) => t.text())).toEqual(['算數量', '算數量', '只記錄']);
    expect(w.findAll('.cf__tag--component')).toHaveLength(2);
  });

  it('數字欄位叫出數字鍵盤（inputmode="decimal"）；文字欄位不會', () => {
    const w = render({ fields: [TISSUE[1]!, ORIGIN] });
    expect(w.find('#cf-f-sheets').attributes('inputmode')).toBe('decimal');
    expect(w.find('#cf-f-origin').attributes('inputmode')).toBeUndefined();
  });

  it('沒有數量組成欄位時不顯示「相乘」說明', () => {
    const w = render({ fields: [ORIGIN], title: '數量與其他資訊' });
    expect(w.find('.cf__hint').exists()).toBe(false);
  });

  it('帶入目前的值（v-model）', () => {
    const w = render({ modelValue: { 'f-sheets': '100', 'f-packs': '12' } });
    expect((w.find('#cf-f-sheets').element as HTMLInputElement).value).toBe('100');
    expect((w.find('#cf-f-ply').element as HTMLInputElement).value).toBe('');
  });

  it('沒有欄位也沒有 leading 插槽 → 什麼都不顯示', () => {
    const w = render({ fields: [] });
    expect(w.find('section').exists()).toBe(false);
  });

  it('leading 插槽放在同一個欄位格線的最前面（沒有包裝規格的分類放「數量」）', () => {
    const w = render(
      { fields: [ORIGIN], title: '數量與其他資訊' },
      { leading: () => h('div', { class: 'qty-slot' }, '數量') },
    );
    const grid = w.find('.cf__grid');
    expect(grid.element.firstElementChild?.classList.contains('qty-slot')).toBe(true);
  });
});

describe('footer 插槽（task 8.4）', () => {
  it('放在欄位格線下方、同一張卡片裡（沒有包裝規格時的說明文字）', () => {
    const w = render(
      { fields: [ORIGIN], title: '數量與其他資訊' },
      { footer: () => h('p', { class: 'note' }, '說明') },
    );
    const section = w.find('section').element;
    expect(section.lastElementChild?.classList.contains('note')).toBe(true);
  });
});

describe('輸入（v-model）', () => {
  it('數字欄位輸入時整理成數字：去掉文字、全形轉半形', async () => {
    const w = render({ modelValue: { 'f-packs': '12' } });
    expect(await type(w, 'f-sheets', '１００抽')).toEqual({ 'f-packs': '12', 'f-sheets': '100' });
    expect((w.find('#cf-f-sheets').element as HTMLInputElement).value).toBe('100');
  });

  it('數字欄位不收負號（數量不會是負數）', async () => {
    const w = render();
    expect(await type(w, 'f-packs', '-3')).toEqual({ 'f-packs': '3' });
  });

  it('文字欄位原樣保留', async () => {
    const w = render({ fields: [ORIGIN] });
    expect(await type(w, 'f-origin', '雲林 斗南')).toEqual({ 'f-origin': '雲林 斗南' });
  });
});

describe('數量組成欄位的檢查（AC-4.6）', () => {
  it.each(['0', '0.0'])(
    'BDD：數量組成欄位填「%s」，離開欄位 → ERR-008 顯示在該欄位下方',
    async (value) => {
      const w = render({ modelValue: { 'f-packs': value } });
      await w.find('#cf-f-packs').trigger('blur');
      const input = w.find('#cf-f-packs');
      expect(input.attributes('aria-invalid')).toBe('true');
      const error = w.find(`#${input.attributes('aria-describedby')}`);
      expect(error.text()).toBe(ERR.quantityComponentNotPositive);
    },
  );

  it('只記錄的欄位填 0 → 不檢查', async () => {
    const w = render({ modelValue: { 'f-ply': '0' } });
    await w.find('#cf-f-ply').trigger('blur');
    expect(w.find('#cf-f-ply').attributes('aria-invalid')).toBeUndefined();
  });

  it('沒填 → 不算錯（沒填算 0，單位均價顯示「無法計算」；task 4 使用者確認）', async () => {
    const w = render();
    await w.find('#cf-f-packs').trigger('blur');
    expect(w.find('#cf-f-packs').attributes('aria-invalid')).toBeUndefined();
  });

  it('大於 0 → 沒有錯誤', async () => {
    const w = render({ modelValue: { 'f-packs': '12' } });
    await w.find('#cf-f-packs').trigger('blur');
    expect(w.find('#cf-f-packs').attributes('aria-invalid')).toBeUndefined();
  });

  it('改了內容就先拿掉錯誤（再離開時重新檢查）', async () => {
    const w = render({ modelValue: { 'f-packs': '0' } });
    await w.find('#cf-f-packs').trigger('blur');
    await type(w, 'f-packs', '12');
    expect(w.find('#cf-f-packs').attributes('aria-invalid')).toBeUndefined();
  });

  it('送出時頁面傳來的錯誤（errors）也顯示在該欄位下方', () => {
    const w = render({ errors: { 'f-sheets': ERR.quantityComponentNotPositive } });
    const input = w.find('#cf-f-sheets');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(w.find(`#${input.attributes('aria-describedby')}`).text()).toBe(
      ERR.quantityComponentNotPositive,
    );
  });
});
