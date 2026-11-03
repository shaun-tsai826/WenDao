// 購買記錄列表（task 8.3，REQ-8 / AC-8.1、8.3、8.5、8.6、8.7）
// 設計：設計稿 Pur-List、Pur-List-Range；design.md v4.0「購買記錄」
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import Purchases from '@/pages/Purchases.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { ERR } from '@/constants/messages';
import { personTone } from '@/lib/personTone';

const routes = [
  { path: '/purchases', component: Purchases },
  { path: '/purchases/new', component: stubPage('new-page') },
  { path: '/purchases/:id', component: stubPage('detail-page') },
];

const rec = (id: string, product: string, date: string, over: Record<string, unknown> = {}) => ({
  id,
  product,
  purchase_date: `${date} 00:00:00.000Z`,
  store: '全聯',
  total_price: 100,
  quantity: 10,
  unit_price: 10,
  user: 'u-pi',
  ...over,
});

// BDD AC-8.6 的 4 個日期（9/30、10/1、10/31、11/1），衛生紙與蔬菜各有記錄（AC-8.5）
const seed = (records = RECORDS) =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
      { id: 'c-clean', name: '清潔用品' },
    ],
    products: [
      { id: 'p-spring', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙', unit: '抽' },
      { id: 'p-cabbage', category: 'c-veg', brand: '有機', name: '高麗菜', unit: '顆' },
    ],
    users: [
      { id: 'u-pi', name: '老皮' },
      { id: 'u-bao', name: '阿寶' },
    ],
    purchase_records: records,
  });

const RECORDS = [
  rec('r-0930', 'p-spring', '2026-09-30', { total_price: 599, quantity: 1200, unit_price: 0.4992 }),
  rec('r-1101', 'p-cabbage', '2026-11-01', {
    store: '市場',
    total_price: 70,
    quantity: 0,
    unit_price: 0,
    user: 'u-bao',
  }),
  rec('r-1001', 'p-cabbage', '2026-10-01', {
    store: '市場',
    total_price: 60,
    quantity: 2,
    unit_price: 30,
    user: 'u-bao',
  }),
  rec('r-1031', 'p-spring', '2026-10-31', {
    store: '蝦皮',
    total_price: 549,
    quantity: 1200,
    unit_price: 0.4575,
  }),
];

type Page = Awaited<ReturnType<typeof mountPage>>;
const rows = (page: Page) => page.wrapper.findAll('.list__row');
const names = (page: Page) => page.wrapper.findAll('.row__name').map((n) => n.text());
const whens = (page: Page) => page.wrapper.findAll('.row__when').map((n) => n.text());
const chip = (page: Page, text: string) =>
  page.wrapper.findAll('[role="radio"]').find((c) => c.text() === text)!;

/** 模擬使用者改日期（type="date" 選完會觸發 change） */
async function setDate(page: Page, which: 'start' | 'end', value: string) {
  const input = page.wrapper.find(`#purchases-${which}`);
  await input.setValue(value); // setValue 會觸發 input
  await input.trigger('change');
  await flushPromises();
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 2, 9, 0)); // 今天 2026-11-02
});
afterEach(() => vi.useRealTimers());

describe('列表（AC-8.1、8.3）', () => {
  it('標題、總數、「新增記錄」按鈕', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    expect(page.wrapper.find('h1').text()).toBe('購買記錄');
    expect(page.wrapper.find('.page__meta').text()).toBe('共 4 筆 · 新到舊');
    expect(page.wrapper.find('a.add-link').attributes('href')).toBe('/purchases/new');
  });

  it('BDD：依購入日期由新至舊排列', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    expect(whens(page).map((t) => t.split(' · ')[0])).toEqual(['11/1', '10/31', '10/1', '9/30']);
  });

  it('BDD：每列有日期、購買地點、商品名稱、分類、數量、單位均價、總價、新增者（AC-8.3）', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    const row = rows(page)[1]!; // 10/31 蝦皮 春風
    expect(row.find('.row__name').text()).toBe('春風 抽取式衛生紙');
    expect(row.find('.row__when').text()).toBe('10/31 · 蝦皮 · 衛生紙');
    expect(row.find('.row__amount').text()).toBe('1,200 抽 · 0.4575 元/抽');
    expect(row.find('.row__total').text()).toBe('549 元');
    const avatar = row.find('.avatar');
    expect(avatar.text()).toBe('皮');
    expect(avatar.attributes('aria-label')).toBe('新增者：老皮');
  });

  it('新增者頭像依使用者順序配色；數量缺失寫「數量未填 · 無法計算」', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    const first = rows(page)[0]!; // 11/1 阿寶 數量缺失
    expect(first.find('.avatar').attributes('style')).toContain(hexToRgb(personTone(1).bg));
    expect(first.find('.row__amount').text()).toBe('數量未填 · 無法計算');
  });

  it('去年的記錄加上年份', async () => {
    seed([rec('r-old', 'p-spring', '2025-12-30')]);
    const page = await mountPage('/purchases', routes);
    expect(whens(page)).toEqual(['2025/12/30 · 全聯 · 衛生紙']);
  });

  it('點一列進入購買記錄詳情', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    await rows(page)[1]!.trigger('click');
    await flushPromises();
    expect(page.router.currentRoute.value.path).toBe('/purchases/r-1031');
  });
});

describe('依分類篩選（AC-8.5）', () => {
  it('篩選按鈕：全部 + 各分類，預設「全部」', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    expect(page.wrapper.find('[role="radiogroup"]').attributes('aria-label')).toBe('依分類篩選');
    expect(page.wrapper.findAll('[role="radio"]').map((c) => c.text())).toEqual([
      '全部',
      '衛生紙',
      '蔬菜',
      '清潔用品',
    ]);
    expect(chip(page, '全部').attributes('aria-checked')).toBe('true');
  });

  it('BDD：選「衛生紙」→ 只顯示衛生紙的記錄，總數跟著變，記在網址', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    await chip(page, '衛生紙').trigger('click');
    await flushPromises();
    expect(names(page)).toEqual(['春風 抽取式衛生紙', '春風 抽取式衛生紙']);
    expect(page.wrapper.find('.page__meta').text()).toBe('共 2 筆 · 新到舊');
    expect(chip(page, '衛生紙').attributes('aria-checked')).toBe('true');
    expect(page.router.currentRoute.value.query).toEqual({ category: 'c-tissue' });
  });

  it('分類下沒有記錄：說明並提供「清除篩選」', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    await chip(page, '清潔用品').trigger('click');
    await flushPromises();
    expect(page.wrapper.find('.list__state').text()).toContain('沒有符合條件的記錄');
    await page.wrapper.find('.list__state button').trigger('click');
    await flushPromises();
    expect(rows(page)).toHaveLength(4);
    expect(page.router.currentRoute.value.query).toEqual({});
  });
});

describe('依日期區間篩選（AC-8.6、8.7）', () => {
  it('BDD：開始 10/1、結束 10/31 → 只有 10/1 與 10/31 兩筆（含結束日當天），記在網址', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    await setDate(page, 'start', '2026-10-01');
    await setDate(page, 'end', '2026-10-31');
    expect(whens(page).map((t) => t.split(' · ')[0])).toEqual(['10/31', '10/1']);
    expect(page.router.currentRoute.value.query).toEqual({
      start: '2026-10-01',
      end: '2026-10-31',
    });
  });

  it('只填開始日期也可以；清空日期就取消', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    await setDate(page, 'start', '2026-10-31');
    expect(rows(page)).toHaveLength(2);
    await setDate(page, 'start', '');
    expect(rows(page)).toHaveLength(4);
    expect(page.router.currentRoute.value.query).toEqual({});
  });

  it('BDD：開始 10/31、結束 10/1 → ERR-012 顯示在結束日期下方，清單維持上一次的結果（AC-8.7）', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    await setDate(page, 'start', '2026-10-31');
    await setDate(page, 'end', '2026-10-01');
    const end = page.wrapper.find('#purchases-end');
    expect(end.attributes('aria-invalid')).toBe('true');
    const error = page.wrapper.find(`#${end.attributes('aria-describedby')}`);
    expect(error.text()).toBe(ERR.dateRangeInvalid);
    expect(error.attributes('role')).toBe('alert');
    expect(rows(page)).toHaveLength(2); // 仍是「開始 10/31」的結果
    expect(page.wrapper.find('.list__note').text()).toBe('日期修正前，先顯示上一次的結果');
    expect(page.router.currentRoute.value.query).toEqual({ start: '2026-10-31' });
  });

  it('修正日期後錯誤消失並重新篩選', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    await setDate(page, 'start', '2026-10-31');
    await setDate(page, 'end', '2026-10-01');
    await setDate(page, 'end', '2026-11-01');
    expect(page.wrapper.find('#purchases-end').attributes('aria-invalid')).toBeUndefined();
    expect(page.wrapper.find('.list__note').exists()).toBe(false);
    expect(whens(page).map((t) => t.split(' · ')[0])).toEqual(['11/1', '10/31']);
  });

  // 回歸測試（e2e 發現）：電腦上用鍵盤打日期時，年份可能變成 5～6 位數（例如 202610-03-01）
  it('日期欄位限制在 2000～9999 年（4 位數年份）', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    for (const which of ['start', 'end']) {
      const input = page.wrapper.find(`#purchases-${which}`);
      expect(input.attributes('min')).toBe('2000-01-01');
      expect(input.attributes('max')).toBe('9999-12-31');
    }
  });

  it('年份不是 4 位數的日期 → 不寫進網址、不重新查詢', async () => {
    const fake = seed();
    const page = await mountPage('/purchases', routes);
    const before = fake.calls.filter((c) => c.collection === 'purchase_records').length;
    await setDate(page, 'end', '202610-03-01');
    expect(page.router.currentRoute.value.query).toEqual({});
    expect(fake.calls.filter((c) => c.collection === 'purchase_records')).toHaveLength(before);
    expect(rows(page)).toHaveLength(4);
  });

  it('分類與日期一起篩選', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    await chip(page, '蔬菜').trigger('click');
    await flushPromises();
    await setDate(page, 'end', '2026-10-31');
    expect(names(page)).toEqual(['有機 高麗菜']);
    expect(page.router.currentRoute.value.query).toEqual({ category: 'c-veg', end: '2026-10-31' });
  });
});

describe('記住篩選（網址）', () => {
  it('直接開啟帶篩選的網址：套用分類與日期', async () => {
    seed();
    const page = await mountPage('/purchases?category=c-tissue&start=2026-10-01', routes);
    expect(chip(page, '衛生紙').attributes('aria-checked')).toBe('true');
    expect((page.wrapper.find('#purchases-start').element as HTMLInputElement).value).toBe(
      '2026-10-01',
    );
    expect(whens(page)).toEqual(['10/31 · 蝦皮 · 衛生紙']);
  });

  it('網址上的分類不存在或日期格式不對：當作沒有篩選', async () => {
    seed();
    const page = await mountPage('/purchases?category=c-gone&start=2026/10/01', routes);
    expect(chip(page, '全部').attributes('aria-checked')).toBe('true');
    expect((page.wrapper.find('#purchases-start').element as HTMLInputElement).value).toBe('');
    expect(rows(page)).toHaveLength(4);
  });

  it('換篩選用 replace（不多一筆瀏覽紀錄）', async () => {
    seed();
    const page = await mountPage('/purchases', routes);
    const push = vi.spyOn(page.router, 'push');
    await chip(page, '蔬菜').trigger('click');
    await setDate(page, 'start', '2026-10-01');
    expect(push).not.toHaveBeenCalled();
  });
});

describe('空清單與錯誤', () => {
  it('還沒有任何記錄：引導去新增', async () => {
    seed([]);
    const page = await mountPage('/purchases', routes);
    expect(page.wrapper.find('.list__state').text()).toBe(
      '還沒有購買記錄，按右上角「新增記錄」開始記錄',
    );
  });

  it('載入失敗：顯示 ERR-014 與重新載入，重試成功後顯示清單', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'purchase_records', method: 'getFullList' });
    const page = await mountPage('/purchases', routes);
    expect(page.wrapper.find('[role="alert"]').text()).toContain(ERR.networkError);
    await page.wrapper.find('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(rows(page)).toHaveLength(4);
  });
});

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
