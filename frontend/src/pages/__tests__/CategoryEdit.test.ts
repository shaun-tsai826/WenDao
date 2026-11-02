// 編輯分類頁（task 6.4：刪除分類 AC-2.5、2.6；CONFIRM-003）
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import CategoryEdit from '@/pages/CategoryEdit.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { CONFIRM, ERR, MSG, withName } from '@/constants/messages';
import * as feedback from '@/lib/feedback';

const routes = [
  { path: '/categories', component: stubPage('list-page') },
  { path: '/categories/:id/edit', component: CategoryEdit },
];

const seed = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [{ id: 'p1', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙' }],
    custom_fields: [{ id: 'f1', category: 'c-veg', field_name: '產地' }],
  });

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('編輯分類：刪除（AC-2.5、2.6）', () => {
  it('BDD：「衛生紙」下有商品 → 刪除按鈕停用，並寫出原因（AC-2.5）', async () => {
    seed();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    expect((wrapper.find('#category-name').element as HTMLInputElement).value).toBe('衛生紙');
    expect(wrapper.find('.danger__button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.danger__hint').text()).toBe('此分類下仍有 1 項商品，要先刪除或移走商品');
  });

  it('BDD：刪除沒有商品的「蔬菜」→ 先確認（CONFIRM-003），確定後刪除、顯示 MSG-002、回到列表（AC-2.6）', async () => {
    const fake = seed();
    const confirm = vi.spyOn(feedback, 'confirmDelete').mockResolvedValue(true);
    const notify = vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const { wrapper, router } = await mountPage('/categories/c-veg/edit', routes);
    expect(wrapper.find('.danger__hint').text()).toBe('分類和它的自訂欄位設定會一起刪除');
    await wrapper.find('.danger__button').trigger('click');
    await flushPromises();
    expect(confirm).toHaveBeenCalledWith(withName(CONFIRM.deleteCategory, '蔬菜'));
    expect(confirm).toHaveBeenCalledWith('確定要刪除分類「蔬菜」嗎？');
    expect(notify).toHaveBeenCalledWith(MSG.categoryDeleted);
    expect(MSG.categoryDeleted).toBe('分類刪除成功');
    expect(router.currentRoute.value.path).toBe('/categories');
    expect(fake.rows('categories').map((c) => c.id)).toEqual(['c-tissue']);
  });

  it('確認時按「取消」：不刪除，留在原頁', async () => {
    const fake = seed();
    vi.spyOn(feedback, 'confirmDelete').mockResolvedValue(false);
    const { wrapper, router } = await mountPage('/categories/c-veg/edit', routes);
    await wrapper.find('.danger__button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/categories/c-veg/edit');
    expect(fake.rows('categories')).toHaveLength(2);
  });

  it('確認後才發現另一人剛新增商品（資料庫擋下）：顯示 ERR-004，按鈕改為停用', async () => {
    const fake = seed();
    vi.spyOn(feedback, 'confirmDelete').mockImplementation(() => {
      fake.insert('products', { id: 'p2', category: 'c-veg', brand: '小農', name: '高麗菜' });
      return Promise.resolve(true);
    });
    const error = vi.spyOn(feedback, 'notifyError').mockImplementation(() => undefined);
    const { wrapper, router } = await mountPage('/categories/c-veg/edit', routes);
    await wrapper.find('.danger__button').trigger('click');
    await flushPromises();
    expect(error).toHaveBeenCalledWith(ERR.categoryHasProducts);
    expect(router.currentRoute.value.path).toBe('/categories/c-veg/edit');
    expect(wrapper.find('.danger__button').attributes('disabled')).toBeDefined();
    expect(fake.rows('categories')).toHaveLength(2);
  });

  it('找不到分類（例如已被另一人刪除）：顯示提示與返回連結', async () => {
    seed();
    const { wrapper } = await mountPage('/categories/nope/edit', routes);
    expect(wrapper.text()).toContain('找不到這個分類');
    expect(wrapper.find('.danger').exists()).toBe(false);
  });

  it('返回箭頭回到分類管理；頁面標題為「編輯分類」', async () => {
    seed();
    const { wrapper, router } = await mountPage('/categories/c-veg/edit', routes);
    expect(wrapper.find('h1').text()).toBe('編輯分類');
    await wrapper.find('a[aria-label="返回分類管理"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/categories');
  });
});

// ---------------- task 6.5：分類名稱與自訂欄位 ----------------

const seedTissue = () =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
    ],
    products: [{ id: 'p1', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙' }],
    custom_fields: [
      {
        id: 'f-sheets',
        category: 'c-tissue',
        field_name: '抽數(單包)',
        field_type: 'number',
        is_quantity_component: true,
        display_order: 1,
      },
      {
        id: 'f-packs',
        category: 'c-tissue',
        field_name: '包數',
        field_type: 'number',
        is_quantity_component: true,
        display_order: 2,
      },
      {
        id: 'f-ply',
        category: 'c-tissue',
        field_name: '層數',
        field_type: 'number',
        is_quantity_component: false,
        display_order: 3,
      },
    ],
    purchase_record_field_values: [
      { id: 'v1', purchase_record: 'r1', custom_field: 'f-sheets', field_value: '100' },
      { id: 'v2', purchase_record: 'r1', custom_field: 'f-packs', field_value: '12' },
    ],
  });

/** 下方面板會被 Quasar 放到 document.body 底下 */
const sheet = () => document.querySelector<HTMLElement>('.sheet');
const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);

async function setInput(selector: string, value: string) {
  const input = $<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
}

async function click(el: Element | null) {
  (el as HTMLElement).click();
  await flushPromises();
}

async function openField(wrapper: Awaited<ReturnType<typeof mountPage>>['wrapper'], name: string) {
  const button = wrapper
    .findAll('.fields__open')
    .find((b) => b.find('.fields__name').text() === name)!;
  await button.trigger('click');
  await flushPromises();
}

describe('編輯分類名稱（AC-2.7～2.9）', () => {
  it('BDD：「蔬菜」改為「生鮮蔬菜」→ MSG-008（AC-2.7）', async () => {
    const fake = seedTissue();
    const notify = vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const { wrapper } = await mountPage('/categories/c-veg/edit', routes);
    await wrapper.find('#category-name').setValue('生鮮蔬菜');
    await wrapper.find('form.name-form').trigger('submit');
    await flushPromises();
    expect(notify).toHaveBeenCalledWith('分類更新成功');
    expect(fake.rows('categories').find((c) => c.id === 'c-veg')?.name).toBe('生鮮蔬菜');
  });

  it.each([
    ['   ', '分類名稱不可為空', 'AC-2.8'],
    ['衛生紙', '此分類名稱已存在，請使用其他名稱', 'AC-2.9'],
  ])('BDD：改為「%s」→ 欄位下方顯示「%s」（%s）', async (value, message) => {
    const fake = seedTissue();
    const { wrapper } = await mountPage('/categories/c-veg/edit', routes);
    await wrapper.find('#category-name').setValue(value);
    await wrapper.find('form.name-form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('#category-name-error').text()).toBe(message);
    expect(fake.rows('categories').find((c) => c.id === 'c-veg')?.name).toBe('蔬菜');
  });
});

describe('自訂欄位清單', () => {
  it('依顯示順序列出欄位，顯示型別、計算方式與使用狀況', async () => {
    seedTissue();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    const rows = wrapper.findAll('.fields__row');
    expect(rows.map((r) => r.find('.fields__name').text())).toEqual(['抽數(單包)', '包數', '層數']);
    expect(rows[0]!.text()).toContain('數字');
    expect(rows[0]!.text()).toContain('算數量');
    expect(rows[0]!.text()).toContain('已有 1 筆記錄使用');
    expect(rows[2]!.text()).toContain('只記錄');
    expect(rows[2]!.text()).toContain('尚未使用');
  });

  it('第一個不能上移、最後一個不能下移', async () => {
    seedTissue();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    expect(
      wrapper.find('button[aria-label="上移「抽數(單包)」"]').attributes('disabled'),
    ).toBeDefined();
    expect(wrapper.find('button[aria-label="下移「層數」"]').attributes('disabled')).toBeDefined();
    expect(
      wrapper.find('button[aria-label="上移「層數」"]').attributes('disabled'),
    ).toBeUndefined();
  });

  it('BDD：「層數」上移 → 順序改變並顯示 MSG-010（AC-4.11）', async () => {
    seedTissue();
    const notify = vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await wrapper.find('button[aria-label="上移「層數」"]').trigger('click');
    await flushPromises();
    expect(wrapper.findAll('.fields__name').map((n) => n.text())).toEqual([
      '抽數(單包)',
      '層數',
      '包數',
    ]);
    expect(notify).toHaveBeenCalledWith('欄位更新成功');
  });

  it('沒有自訂欄位：顯示說明', async () => {
    seedTissue();
    const { wrapper } = await mountPage('/categories/c-veg/edit', routes);
    expect(wrapper.find('.fields__empty').text()).toContain('還沒有自訂欄位');
  });
});

describe('自訂欄位面板', () => {
  // 回歸測試（使用者回報：點面板裡任何地方，面板就關閉）
  // Quasar 只讓「.q-dialog__inner 底下直接的 <div>」可以點（pointer-events: all），
  // 其他標籤的點擊會穿透到背景，被當成「點背景關閉」。所以面板最外層必須是 <div>。
  it('面板最外層是 .q-dialog__inner 底下的 <div>，點面板內容不會關閉', async () => {
    seedTissue();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await wrapper.find('.fields__add').trigger('click');
    await flushPromises();
    expect(document.querySelector('.q-dialog__inner > div.sheet')).not.toBeNull();
  });

  it('已被使用的欄位：型別與計算方式鎖定、刪除停用，並寫出原因', async () => {
    seedTissue();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await openField(wrapper, '抽數(單包)');
    expect(sheet()?.querySelector('h2')?.textContent).toBe('編輯欄位');
    expect(sheet()?.querySelector('[role="note"]')?.textContent).toContain(
      '已有 1 筆購買記錄使用這個欄位',
    );
    expect([...sheet()!.querySelectorAll('fieldset')].every((f) => f.disabled)).toBe(true);
    expect($<HTMLButtonElement>('.sheet__delete')!.disabled).toBe(true);
  });

  it('未使用的欄位：可以修改全部設定，也可以刪除', async () => {
    seedTissue();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await openField(wrapper, '層數');
    expect(sheet()?.querySelector('[role="note"]')).toBeNull();
    expect([...sheet()!.querySelectorAll('fieldset')].some((f) => f.disabled)).toBe(false);
    expect($<HTMLButtonElement>('.sheet__delete')!.disabled).toBe(false);
  });

  it('BDD：「層數」改名為「厚度」→ 儲存、清單更新、MSG-010（AC-4.11）', async () => {
    const fake = seedTissue();
    const notify = vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await openField(wrapper, '層數');
    await setInput('#field-name', '厚度');
    await click($('.sheet__save'));
    expect(notify).toHaveBeenCalledWith('欄位更新成功');
    expect(wrapper.findAll('.fields__name').map((n) => n.text())).toContain('厚度');
    expect(fake.rows('custom_fields').find((f) => f.id === 'f-ply')?.field_name).toBe('厚度');
  });

  it('BDD：新增名為「包數」的欄位 → 名稱下方顯示 ERR-017，面板不關閉（AC-4.7）', async () => {
    const fake = seedTissue();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await wrapper.find('.fields__add').trigger('click');
    await flushPromises();
    expect(sheet()?.querySelector('h2')?.textContent).toBe('新增欄位');
    await setInput('#field-name', '包數');
    await click($('.sheet__save'));
    expect($('#field-name-error')?.textContent?.trim()).toBe('此欄位名稱已存在於此分類');
    expect(sheet()).not.toBeNull();
    expect(fake.rows('custom_fields')).toHaveLength(3);
  });

  it('新增「捲數」（數字、算數量）→ 出現在清單最後（AC-4.1、4.2）', async () => {
    const fake = seedTissue();
    const { wrapper } = await mountPage('/categories/c-veg/edit', routes);
    await wrapper.find('.fields__add').trigger('click');
    await flushPromises();
    await setInput('#field-name', '捲數');
    await click($('.sheet__save'));
    expect(wrapper.findAll('.fields__name').map((n) => n.text())).toEqual(['捲數']);
    expect(fake.rows('custom_fields').at(-1)).toMatchObject({
      category: 'c-veg',
      field_name: '捲數',
      field_type: 'number',
      is_quantity_component: true,
    });
  });

  it('BDD：刪除未使用的「層數」→ 先確認（CONFIRM-004）、刪除、MSG-009（AC-4.9）', async () => {
    const fake = seedTissue();
    const confirm = vi.spyOn(feedback, 'confirmDelete').mockResolvedValue(true);
    const notify = vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await openField(wrapper, '層數');
    await click($('.sheet__delete'));
    expect(confirm).toHaveBeenCalledWith('確定要刪除欄位「層數」嗎？');
    expect(notify).toHaveBeenCalledWith('欄位刪除成功');
    expect(wrapper.findAll('.fields__name').map((n) => n.text())).toEqual(['抽數(單包)', '包數']);
    expect(fake.rows('custom_fields')).toHaveLength(2);
  });

  it('BDD：打開面板後另一人剛好使用了「層數」→ 刪除時顯示 ERR-018（AC-4.8）', async () => {
    const fake = seedTissue();
    vi.spyOn(feedback, 'confirmDelete').mockImplementation(() => {
      fake.insert('purchase_record_field_values', {
        id: 'v9',
        purchase_record: 'r9',
        custom_field: 'f-ply',
        field_value: '2',
      });
      return Promise.resolve(true);
    });
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await openField(wrapper, '層數');
    await click($('.sheet__delete'));
    expect($('.form-alert')?.textContent?.trim()).toBe('此欄位已有購買記錄使用，無法刪除');
    expect(fake.rows('custom_fields')).toHaveLength(3);
  });

  it('BDD：打開面板後另一人剛好使用了「層數」→ 改型別時顯示 ERR-019（AC-4.10）', async () => {
    const fake = seedTissue();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await openField(wrapper, '層數');
    fake.insert('purchase_record_field_values', {
      id: 'v9',
      purchase_record: 'r9',
      custom_field: 'f-ply',
      field_value: '2',
    });
    await click($('input[name="field-type"][value="text"]'));
    await click($('.sheet__save'));
    expect($('.form-alert')?.textContent?.trim()).toBe(
      '此欄位已有購買記錄使用，無法修改型別或計算設定',
    );
    expect(fake.rows('custom_fields').find((f) => f.id === 'f-ply')?.field_type).toBe('number');
  });

  it('按「取消」：面板關閉、不儲存', async () => {
    const fake = seedTissue();
    const { wrapper } = await mountPage('/categories/c-tissue/edit', routes);
    await openField(wrapper, '層數');
    await setInput('#field-name', '亂改');
    await click($('.sheet__cancel'));
    await new Promise((r) => setTimeout(r, 400)); // 等關閉動畫
    expect(fake.rows('custom_fields').find((f) => f.id === 'f-ply')?.field_name).toBe('層數');
  });
});
