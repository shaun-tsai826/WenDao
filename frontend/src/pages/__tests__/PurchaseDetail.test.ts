// 購買記錄詳情（task 8.5，REQ-5 / AC-5.6，REQ-6 / AC-6.2、AC-6.5，REQ-8 / AC-8.9、AC-8.10）
// 設計：設計稿 Pur-Detail（使用者 2026-11-03 確認）、design.md v4.0「購買記錄 › 購買記錄詳情」
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import PurchaseDetail from '@/pages/PurchaseDetail.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { ERR, STATUS } from '@/constants/messages';
import { personTone } from '@/lib/personTone';
import type { PurchaseRecordRecord } from '@/types/models';

const routes = [
  { path: '/purchases', component: stubPage('list-page') },
  { path: '/purchases/:id', component: PurchaseDetail },
  { path: '/purchases/:id/edit', component: stubPage('edit-page') },
  { path: '/products/:id', component: stubPage('product-page') },
];

function purchase(
  over: Partial<PurchaseRecordRecord> & { id: string },
): Partial<PurchaseRecordRecord> {
  return {
    product: 'p-spring',
    purchase_date: '2026-10-31 00:00:00.000Z',
    store: '全聯',
    total_price: 599,
    quantity: 1200,
    unit_price: 0.4992,
    user: 'u-pi',
    ...over,
  };
}

// 設計稿的例子：0.4992（這一筆）、0.4575、0.5242 → 歷史均價 0.4936
const PURCHASES = [
  purchase({ id: 'r-1', created: '2026-10-31 13:03:00.000Z' }),
  purchase({
    id: 'r-2',
    purchase_date: '2026-09-05 00:00:00.000Z',
    store: '蝦皮',
    total_price: 549,
    unit_price: 0.4575,
    user: 'u-bao',
  }),
  purchase({
    id: 'r-3',
    purchase_date: '2026-07-12 00:00:00.000Z',
    store: '家樂福',
    total_price: 629,
    unit_price: 0.5242,
  }),
  // 其他商品的記錄不算進歷史均價
  purchase({ id: 'r-other', product: 'p-kleenex', unit_price: 9 }),
];

const FIELDS = [
  // 故意打亂建立順序：畫面依 display_order 排
  {
    id: 'f-layers',
    category: 'c-tissue',
    field_name: '層數',
    field_type: 'number',
    is_quantity_component: false,
    display_order: 3,
  },
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
    id: 'f-note',
    category: 'c-tissue',
    field_name: '香味',
    field_type: 'text',
    is_quantity_component: false,
    display_order: 4,
  },
];

const VALUES = [
  { id: 'v1', purchase_record: 'r-1', custom_field: 'f-sheets', field_value: '100' },
  { id: 'v2', purchase_record: 'r-1', custom_field: 'f-packs', field_value: '12' },
  { id: 'v3', purchase_record: 'r-1', custom_field: 'f-layers', field_value: '2' },
  // 別筆記錄的值不顯示
  { id: 'v4', purchase_record: 'r-2', custom_field: 'f-sheets', field_value: '90' },
];

const seed = (purchases = PURCHASES, values = VALUES) =>
  installFakePocketBase({
    categories: [
      { id: 'c-other', name: '洗衣精' },
      { id: 'c-tissue', name: '衛生紙' },
    ],
    products: [
      { id: 'p-spring', category: 'c-tissue', brand: '春風', name: '抽取式衛生紙', unit: '抽' },
      { id: 'p-kleenex', category: 'c-tissue', brand: '舒潔', name: '衛生紙', unit: '抽' },
    ] as never,
    users: [
      { id: 'u-pi', name: '老皮' },
      { id: 'u-bao', name: '阿寶' },
    ],
    custom_fields: FIELDS,
    purchase_records: purchases as never,
    purchase_record_field_values: values,
  });

type Page = Awaited<ReturnType<typeof mountPage>>;
const text = (page: Page, sel: string) => page.wrapper.find(sel).text();
const texts = (page: Page, sel: string) => page.wrapper.findAll(sel).map((n) => n.text());

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 3, 9, 0)); // 本地 2026-11-03
});
afterEach(() => vi.useRealTimers());

describe('記錄內容（AC-5.6、6.2）', () => {
  it('商品卡：分類圖塊、商品名稱連到商品詳情、分類、總價', async () => {
    seed();
    const page = await mountPage('/purchases/r-1', routes);
    expect(text(page, 'h1')).toBe('購買記錄詳情');
    expect(text(page, '.tile')).toBe('衛生');
    const link = page.wrapper.find('h2.record__product a');
    expect(link.text()).toBe('春風 抽取式衛生紙');
    expect(link.attributes('href')).toBe('/products/p-spring');
    expect(text(page, '.record__category')).toBe('衛生紙');
    expect(text(page, '.record__total')).toBe('599 元');
  });

  it('購入日期（含星期）、購買地點、新增者頭像＋名稱＋新增時間（AC-5.6）', async () => {
    seed();
    const page = await mountPage('/purchases/r-1', routes);
    expect(texts(page, '.facts dt')).toEqual(['購入日期', '購買地點', '新增者']);
    expect(text(page, '.facts__date')).toBe('2026/10/31（六）');
    expect(text(page, '.facts__store')).toBe('全聯');
    // created 13:03Z = 台北 21:03
    expect(text(page, '.facts__name')).toBe('老皮');
    expect(text(page, '.facts__time')).toBe('· 10/31 21:03 新增');
    const avatar = page.wrapper.find('.facts__creator .avatar');
    expect(avatar.attributes('style')).toContain(hexToRgb(personTone(0).bg));
  });

  it('第 2 位使用者新增的記錄用第 2 組代表色', async () => {
    seed();
    const page = await mountPage('/purchases/r-2', routes);
    expect(text(page, '.facts__creator')).toContain('阿寶');
    const avatar = page.wrapper.find('.facts__creator .avatar');
    expect(avatar.attributes('style')).toContain(hexToRgb(personTone(1).bg));
  });

  it('包裝規格：依欄位順序，只列這筆有填的欄位', async () => {
    seed();
    const page = await mountPage('/purchases/r-1', routes);
    expect(texts(page, '.field__label')).toEqual(['抽數(單包)', '包數', '層數']);
    expect(texts(page, '.field__value')).toEqual(['100', '12', '2']);
  });

  it('數字欄位加千分位，文字欄位照原樣', async () => {
    seed(PURCHASES, [
      { id: 'v1', purchase_record: 'r-1', custom_field: 'f-sheets', field_value: '1200' },
      { id: 'v2', purchase_record: 'r-1', custom_field: 'f-note', field_value: '無香' },
    ]);
    const page = await mountPage('/purchases/r-1', routes);
    expect(texts(page, '.field__value')).toEqual(['1,200', '無香']);
  });

  it('沒有自訂欄位值 → 不顯示包裝規格區塊', async () => {
    seed(PURCHASES, []);
    const page = await mountPage('/purchases/r-1', routes);
    expect(page.wrapper.find('.fields').exists()).toBe(false);
  });

  it('總數量與單位均價（AC-6.2）', async () => {
    seed();
    const page = await mountPage('/purchases/r-1', routes);
    expect(texts(page, '.summary__label')).toEqual(['總數量', '單位均價']);
    expect(texts(page, '.summary__value')).toEqual(['1,200 抽', '0.4992 元/抽']);
  });

  it('數量缺失 → 總數量「未填」、單位均價 STATUS-001「無法計算」（AC-6.5）', async () => {
    seed([...PURCHASES, purchase({ id: 'r-4', quantity: 0, unit_price: 0, total_price: 90 })]);
    const page = await mountPage('/purchases/r-4', routes);
    expect(texts(page, '.summary__value')).toEqual(['未填', STATUS.cannotCalculate]);
  });

  it('「編輯這筆記錄」連到編輯頁', async () => {
    seed();
    const page = await mountPage('/purchases/r-1', routes);
    const edit = page.wrapper.find('a.edit-link');
    expect(edit.text()).toBe('編輯這筆記錄');
    expect(edit.attributes('href')).toBe('/purchases/r-1/edit');
  });
});

describe('價格比較（AC-8.9、8.10）', () => {
  it('高於：↑ 圖示、文字、琥珀色，另寫差額、百分比、歷史均價用了幾筆', async () => {
    seed();
    const page = await mountPage('/purchases/r-1', routes);
    const box = page.wrapper.find('.compare');
    expect(box.classes()).toContain('compare--higher');
    expect(text(page, '.compare__title')).toBe('比歷史均價高');
    expect(text(page, '.compare__detail')).toBe('每抽多 0.0056 元（+1.1%）');
    expect(text(page, '.compare__basis')).toBe('歷史均價 0.4936 元/抽 · 3 筆，含這一筆');
    // 圖示是 ↑（不只靠顏色）
    expect(box.find('svg path').attributes('d')).toBe('M11 17V5');
  });

  it('低於：↓ 圖示、綠色', async () => {
    seed();
    const page = await mountPage('/purchases/r-2', routes);
    expect(page.wrapper.find('.compare').classes()).toContain('compare--lower');
    expect(text(page, '.compare__title')).toBe('比歷史均價低');
    expect(text(page, '.compare__detail')).toBe('每抽少 0.0361 元（−7.3%）');
    expect(page.wrapper.find('.compare svg path').attributes('d')).toBe('M11 5v12');
  });

  it('等於：＝ 圖示、灰色，不寫差額', async () => {
    seed([purchase({ id: 'r-1' }), purchase({ id: 'r-2' })]);
    const page = await mountPage('/purchases/r-1', routes);
    expect(page.wrapper.find('.compare').classes()).toContain('compare--equal');
    expect(text(page, '.compare__title')).toBe('和歷史均價相同');
    expect(page.wrapper.find('.compare__detail').exists()).toBe(false);
    expect(text(page, '.compare__basis')).toBe('歷史均價 0.4992 元/抽 · 2 筆，含這一筆');
  });

  it('這筆沒有數量 → STATUS-006「無法比較」，寫出原因（AC-8.10）', async () => {
    seed([...PURCHASES, purchase({ id: 'r-4', quantity: 0, unit_price: 0, total_price: 90 })]);
    const page = await mountPage('/purchases/r-4', routes);
    expect(page.wrapper.find('.compare').classes()).toContain('compare--na');
    expect(text(page, '.compare__title')).toBe(STATUS.cannotCompare);
    expect(text(page, '.compare__detail')).toBe('這筆沒有填數量');
    expect(text(page, '.compare__basis')).toBe('歷史均價 0.4936 元/抽 · 3 筆');
  });

  it('其他商品的記錄不算進歷史均價', async () => {
    seed();
    const page = await mountPage('/purchases/r-other', routes);
    // 舒潔只有這一筆 → 相同
    expect(text(page, '.compare__title')).toBe('和歷史均價相同');
    expect(text(page, '.compare__basis')).toBe('歷史均價 9.0000 元/抽 · 1 筆，含這一筆');
  });
});

describe('返回、找不到、載入失敗', () => {
  it('從列表（帶篩選）進來 → 返回同一個網址', async () => {
    seed();
    const page = await mountPage('/purchases?category=c-tissue', routes);
    // 正式環境的 web history 會自動在 state.back 記下上一頁；測試用的 memory history 不會，所以手動帶入
    await page.router.push({
      path: '/purchases/r-1',
      state: { back: '/purchases?category=c-tissue' },
    });
    await flushPromises();
    expect(page.wrapper.find('a[aria-label="返回購買記錄"]').attributes('href')).toBe(
      '/purchases?category=c-tissue',
    );
  });

  it('直接打開網址 → 返回購買記錄列表', async () => {
    seed();
    const page = await mountPage('/purchases/r-1', routes);
    expect(page.wrapper.find('a[aria-label="返回購買記錄"]').attributes('href')).toBe('/purchases');
  });

  it('記錄不存在（可能已被刪除）→ 說明並提供回列表的連結', async () => {
    seed();
    const page = await mountPage('/purchases/r-gone', routes);
    expect(text(page, '.state')).toContain('找不到這筆記錄，可能已被刪除。');
    expect(page.wrapper.find('.state a').attributes('href')).toBe('/purchases');
    expect(page.wrapper.find('.compare').exists()).toBe(false);
  });

  it('連不上伺服器 → ERR-014，按「重新載入」後恢復', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'purchase_records', method: 'getOne' });
    const page = await mountPage('/purchases/r-1', routes);
    expect(text(page, '[role=alert]')).toContain(ERR.networkError);

    await page.wrapper.find('[role=alert] button').trigger('click');
    await flushPromises();
    expect(page.wrapper.find('[role=alert]').exists()).toBe(false);
    expect(text(page, '.compare__title')).toBe('比歷史均價高');
  });

  it('第二段載入（歷史記錄）失敗也顯示錯誤，不顯示錯的比較結果', async () => {
    const fake = seed();
    fake.failNext(500, { collection: 'purchase_records', method: 'getFullList' });
    const page = await mountPage('/purchases/r-1', routes);
    expect(text(page, '[role=alert]')).toContain(ERR.serverError);
    expect(page.wrapper.find('.compare').exists()).toBe(false);
  });
});

/** '#dcf1ff' → 'rgb(220, 241, 255)'（jsdom 會把 style 的色碼轉成 rgb） */
function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
