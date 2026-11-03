// 新增購買記錄（task 8.4，REQ-4 / AC-4.3、4.4、4.6，REQ-5 / AC-5.1～5.5、5.10、5.11，REQ-6 / AC-6.1，REQ-7 / AC-7.13）
// 設計：設計稿 Pur-New、Pur-New-Error、Pur-New-Qty、Pur-Remain；design.md v4.0「購買記錄」
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import PurchaseNew from '@/pages/PurchaseNew.vue';
import { installFakePocketBase } from '@/test-utils/fakePocketBase';
import { mountPage, stubPage } from '@/test-utils/mountPage';
import { CONFIRM, ERR, MSG } from '@/constants/messages';
import * as feedback from '@/lib/feedback';
import pb from '@/lib/pocketbase';

const routes = [
  { path: '/purchases', component: stubPage('list-page') },
  { path: '/purchases/new', component: PurchaseNew },
  { path: '/products/new', component: stubPage('product-new-page') },
];

const product = (over: Record<string, unknown>) => ({
  unit: '抽',
  consumption_unit: '',
  consumption_rate: 0,
  consumption_period: '',
  remaining_quantity: 0,
  remaining_updated_at: '',
  consumption_note: '',
  ...over,
});

// BDD 背景：衛生紙有「抽數(單包)」「包數」（算數量）與「層數」（只記錄）；蔬菜沒有自訂欄位；食品只有文字欄位「產地」
const seed = (over: { products?: unknown[]; purchase_records?: unknown[] } = {}) =>
  installFakePocketBase({
    categories: [
      { id: 'c-tissue', name: '衛生紙' },
      { id: 'c-veg', name: '蔬菜' },
      { id: 'c-food', name: '食品' },
    ],
    products: (over.products ?? [
      product({
        id: 'p-spring',
        category: 'c-tissue',
        brand: '春風',
        name: '抽取式衛生紙',
        consumption_unit: '包',
        consumption_rate: 4,
        consumption_period: 'monthly',
        remaining_quantity: 3,
        remaining_updated_at: '2026-10-24 00:00:00.000Z',
      }),
      product({ id: 'p-cabbage', category: 'c-veg', brand: '有機', name: '高麗菜', unit: '顆' }),
      product({ id: 'p-egg', category: 'c-food', brand: '大成', name: '雞蛋', unit: '個' }),
    ]) as never,
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
      {
        id: 'f-origin',
        category: 'c-food',
        field_name: '產地',
        field_type: 'text',
        is_quantity_component: false,
        display_order: 1,
      },
    ],
    purchase_records: (over.purchase_records ?? [
      {
        id: 'r1',
        product: 'p-spring',
        store: '家樂福',
        purchase_date: '2026-10-01 00:00:00.000Z',
        created: '2026-10-01 00:00:00.000Z',
      },
      {
        id: 'r2',
        product: 'p-spring',
        store: '全聯',
        purchase_date: '2026-10-20 00:00:00.000Z',
        created: '2026-10-20 00:00:00.000Z',
      },
    ]) as never,
  });

type Page = Awaited<ReturnType<typeof mountPage>>;
const value = (page: Page, sel: string) =>
  (page.wrapper.find(sel).element as HTMLInputElement).value;
const text = (page: Page, sel: string) => page.wrapper.find(sel).text();

async function choose(page: Page, productId: string) {
  await page.wrapper.find('#p-product').setValue(productId);
  await flushPromises();
}
async function fill(page: Page, values: Record<string, string>) {
  for (const [sel, v] of Object.entries(values)) await page.wrapper.find(sel).setValue(v);
  await flushPromises();
}
async function submit(page: Page) {
  await page.wrapper.find('form').trigger('submit');
  await flushPromises();
}

let ask: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 2, 9, 0)); // 今天 2026-11-02
  pb.authStore.save('test-token', { id: 'u-pi', name: '老皮' } as never);
  vi.spyOn(feedback, 'notifySuccess').mockImplementation(() => undefined);
  ask = vi.spyOn(feedback, 'askUpdateRemaining').mockResolvedValue(false);
});
afterEach(() => {
  vi.useRealTimers();
  pb.authStore.clear();
});

describe('畫面（AC-5.1）', () => {
  it('標題、返回購買記錄；必填欄位：商品、購入日期、購買地點、總價', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    expect(text(page, 'h1')).toBe('新增購買記錄');
    expect(page.wrapper.find('a[aria-label="返回購買記錄"]').attributes('href')).toBe('/purchases');
    expect(
      page.wrapper
        .findAll('label')
        .map((l) => l.text())
        .slice(0, 4),
    ).toEqual(['商品', '購入日期', '購買地點', '總價（元）']);
  });

  it('商品預設「請選擇商品」，依分類分組', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    expect(value(page, '#p-product')).toBe('');
    expect(page.wrapper.findAll('#p-product optgroup').map((g) => g.attributes('label'))).toEqual([
      '衛生紙',
      '蔬菜',
      '食品',
    ]);
  });

  it('購入日期預設今天，不能選未來；總價用數字鍵盤', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    expect(value(page, '#p-date')).toBe('2026-11-02');
    expect(page.wrapper.find('#p-date').attributes('max')).toBe('2026-11-02');
    expect(page.wrapper.find('#p-price').attributes('inputmode')).toBe('decimal');
  });

  it('常去的地點：點了就填入購買地點（使用者同意提案 1）', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    const chips = page.wrapper.findAll('.store-chip');
    expect(chips.map((c) => c.text())).toEqual(['全聯', '家樂福']);
    await chips[1]!.trigger('click');
    expect(value(page, '#p-store')).toBe('家樂福');
    expect(chips[1]!.attributes('aria-pressed')).toBe('true');
  });

  it('還沒有任何商品：引導先新增商品', async () => {
    seed({ products: [] });
    const page = await mountPage('/purchases/new', routes);
    expect(page.wrapper.find('form').exists()).toBe(false);
    expect(text(page, '.state')).toContain('要先新增商品');
    expect(page.wrapper.find('.state a').attributes('href')).toBe('/products/new');
  });
});

describe('自訂欄位與自動計算（AC-4.3、4.4、6.1）', () => {
  it('還沒選商品：計算區提示先選商品，不顯示自訂欄位', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    expect(page.wrapper.find('.cf').exists()).toBe(false);
    expect(text(page, '.preview')).toContain('選擇商品後自動計算');
  });

  it('BDD：選春風、抽數 120 × 包數 10 → 總數量 1,200（層數不參與）；總價 599 → 0.4992 元/抽', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-spring');
    expect(text(page, '.cf h2')).toBe('衛生紙的包裝規格');
    expect(page.wrapper.find('.product-tile').text()).toBe('衛生');
    await fill(page, {
      '#cf-f-sheets': '120',
      '#cf-f-packs': '10',
      '#cf-f-ply': '3',
      '#p-price': '599',
    });
    expect(text(page, '.preview__qty-value')).toBe('1,200 抽');
    expect(text(page, '.preview__qty-formula')).toBe('120 × 10');
    expect(text(page, '.preview__price-value')).toBe('0.4992 元/抽');
    expect(text(page, '.preview__price-formula')).toBe('599 ÷ 1,200');
    expect(page.wrapper.find('.preview').classes()).not.toContain('preview--muted');
  });

  it('BDD：選蔬菜（沒有自訂欄位）→ 提供數量欄位直接輸入（AC-4.4）', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-cabbage');
    expect(text(page, '.cf h2')).toBe('數量與其他資訊');
    expect(text(page, 'label[for="p-qty"]')).toBe('數量（顆）選填');
    expect(page.wrapper.find('#p-qty').attributes('inputmode')).toBe('decimal');
    expect(text(page, '.qty-hint')).toBe(
      '「蔬菜」沒有設定包裝規格，直接填買了幾顆；沒填數量時，單位均價會顯示「無法計算」',
    );
    await fill(page, { '#p-qty': '2', '#p-price': '60' });
    expect(text(page, '.preview__qty-value')).toBe('2 顆');
    expect(text(page, '.preview__qty-formula')).toBe('直接輸入');
    expect(text(page, '.preview__price-value')).toBe('30.0000 元/顆');
  });

  it('只有文字欄位的分類（食品）：數量欄位＋產地', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-egg');
    expect(page.wrapper.findAll('.cf label').map((l) => l.text())).toEqual([
      '數量（個）選填',
      '產地',
    ]);
  });

  it('數量算不出來：計算區改灰底並寫原因，單位均價「無法計算」', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-spring');
    await fill(page, { '#cf-f-sheets': '120', '#p-price': '599' });
    expect(page.wrapper.find('.preview').classes()).toContain('preview--muted');
    expect(text(page, '.preview__qty-value')).toBe('—');
    expect(text(page, '.preview__qty-formula')).toBe('「算數量」的欄位都填了、而且大於 0 才能計算');
    expect(text(page, '.preview__price-value')).toBe('無法計算');
  });

  it('還沒填總價：單位均價寫「填入總價後計算」', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-cabbage');
    await fill(page, { '#p-qty': '2' });
    expect(text(page, '.preview__price-value')).toBe('—');
    expect(text(page, '.preview__price-formula')).toBe('填入總價後計算');
  });

  it('換成其他分類的商品：清掉上一個分類填的欄位值', async () => {
    const fake = seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-spring');
    await fill(page, { '#cf-f-sheets': '120' });
    await choose(page, 'p-egg');
    await choose(page, 'p-spring');
    expect(value(page, '#cf-f-sheets')).toBe('');
    expect(fake.rows('custom_fields')).toHaveLength(4);
  });
});

describe('建立記錄（AC-5.2、7.13）', () => {
  async function fillTissue(page: Page) {
    await choose(page, 'p-spring');
    await fill(page, {
      '#p-date': '2026-10-30',
      '#p-store': '全聯',
      '#p-price': '599',
      '#cf-f-sheets': '120',
      '#cf-f-packs': '10',
      '#cf-f-ply': '3',
    });
  }

  it('BDD：填好送出 → 建立記錄（前端算好的數量與單位均價、欄位值）、顯示 MSG-004、回到購買記錄列表', async () => {
    const fake = seed();
    const page = await mountPage('/purchases/new', routes);
    await fillTissue(page);
    await submit(page);
    const created = fake
      .rows('purchase_records')
      .find((r) => r.purchase_date === '2026-10-30 00:00:00.000Z')!;
    expect(created).toMatchObject({
      product: 'p-spring',
      store: '全聯',
      total_price: 599,
      quantity: 1200,
      unit_price: 0.4992,
      user: 'u-pi',
    });
    const values = fake
      .rows('purchase_record_field_values')
      .filter((v) => v.purchase_record === created.id);
    expect(values.map((v) => v.field_value).sort()).toEqual(['10', '120', '3']);
    expect(feedback.notifySuccess).toHaveBeenCalledWith(MSG.recordCreated);
    expect(page.router.currentRoute.value.path).toBe('/purchases');
  });

  it('BDD：存檔後詢問是否更新剩餘數量，預先帶入目前的 3 包（AC-7.13）', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await fillTissue(page);
    await submit(page);
    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: '春風 抽取式衛生紙',
        purchased: '剛記錄了 1,200 抽',
        remaining: 3,
        unit: '包',
        updatedAt: '2026-10-24',
        today: '2026-11-02',
      }),
    );
  });

  it('BDD：商品還沒設定剩餘數量 → 對話框留空（remaining: null）', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-cabbage');
    await fill(page, { '#p-store': '市場', '#p-price': '60' });
    await submit(page);
    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        remaining: null,
        updatedAt: null,
        purchased: '剛記錄了一筆（數量未填）',
      }),
    );
  });

  it('在對話框按「更新剩餘數量」→ 只更新該商品的剩餘數量與更新日，顯示 MSG-007', async () => {
    const fake = seed();
    const page = await mountPage('/purchases/new', routes);
    await fillTissue(page);
    await submit(page);
    const options = ask.mock.calls[0]![0] as feedback.RemainingDialogOptions;
    await options.onSave(15);
    expect(fake.rows('products').find((p) => p.id === 'p-spring')).toMatchObject({
      remaining_quantity: 15,
      remaining_updated_at: '2026-11-02 00:00:00.000Z',
      consumption_rate: 4,
    });
    expect(feedback.notifySuccess).toHaveBeenCalledWith(MSG.productUpdated);
  });

  it('連不上伺服器 → 表單上方顯示 ERR-014，留在新增頁', async () => {
    const fake = seed();
    fake.failNext(0, { collection: 'purchase_records', method: 'create' });
    const page = await mountPage('/purchases/new', routes);
    await fillTissue(page);
    await submit(page);
    expect(text(page, '.form-alert')).toBe(ERR.networkError);
    expect(page.router.currentRoute.value.path).toBe('/purchases/new');
    expect(ask).not.toHaveBeenCalled();
  });
});

describe('輸入錯誤（AC-5.3、5.4、5.5、5.11、4.6）', () => {
  it('BDD：沒填購買地點 → 購買地點下方 ERR-009；上方錯誤摘要連到該欄位並取得焦點（使用者同意提案 4）', async () => {
    const fake = seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-cabbage');
    await fill(page, { '#p-price': '60' });
    await submit(page);
    const store = page.wrapper.find('#p-store');
    expect(store.attributes('aria-invalid')).toBe('true');
    expect(text(page, `#${store.attributes('aria-describedby')}`)).toBe(ERR.required);
    const summary = page.wrapper.find('.form-summary');
    expect(summary.attributes('role')).toBe('alert');
    expect(summary.find('.form-summary__title').text()).toBe('有 1 個欄位需要修正');
    expect(summary.findAll('a').map((a) => [a.text(), a.attributes('href')])).toEqual([
      ['購買地點：此欄位為必填', '#p-store'],
    ]);
    expect(document.activeElement).toBe(summary.element);
    expect(fake.rows('purchase_records')).toHaveLength(2);
  });

  it('什麼都沒填就送出 → 商品、購買地點、總價各自顯示 ERR-009（日期預設今天）', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await submit(page);
    expect(page.wrapper.findAll('.form-summary a').map((a) => a.attributes('href'))).toEqual([
      '#p-product',
      '#p-store',
      '#p-price',
    ]);
    expect(text(page, '.form-summary__title')).toBe('有 3 個欄位需要修正');
  });

  it('BDD：總價 0 → 只顯示「總價必須大於 0」，不顯示「此欄位為必填」（AC-5.4、5.11）', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-cabbage');
    await fill(page, { '#p-store': '市場', '#p-price': '0' });
    await submit(page);
    expect(text(page, '#p-price-error')).toBe(ERR.totalPriceNotPositive);
    expect(page.wrapper.text()).not.toContain(ERR.required);
  });

  it('BDD：今天 11/1，購入日期 11/15 → ERR-011（AC-5.5）', async () => {
    vi.setSystemTime(new Date(2026, 10, 1, 9, 0));
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-cabbage');
    await fill(page, { '#p-store': '市場', '#p-price': '60', '#p-date': '2026-11-15' });
    await submit(page);
    expect(text(page, '#p-date-error')).toBe(ERR.purchaseDateInFuture);
  });

  it('BDD：數量組成欄位填 0 → 該欄位 ERR-008，也列在錯誤摘要（AC-4.6）', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-spring');
    await fill(page, {
      '#p-store': '全聯',
      '#p-price': '599',
      '#cf-f-sheets': '100',
      '#cf-f-packs': '0',
    });
    await submit(page);
    expect(page.wrapper.find('#cf-f-packs').attributes('aria-invalid')).toBe('true');
    expect(page.wrapper.findAll('.form-summary a').map((a) => a.text())).toEqual([
      `包數：${ERR.quantityComponentNotPositive}`,
    ]);
  });

  it('改了有問題的欄位：該欄位與摘要裡的那一項一起拿掉', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await submit(page);
    await fill(page, { '#p-store': '全聯' });
    expect(page.wrapper.find('#p-store').attributes('aria-invalid')).toBeUndefined();
    expect(text(page, '.form-summary__title')).toBe('有 2 個欄位需要修正');
  });

  it('送出中按鈕停用並顯示「儲存中…」', async () => {
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-cabbage');
    await fill(page, { '#p-store': '市場', '#p-price': '60' });
    void page.wrapper.find('form').trigger('submit');
    await page.wrapper.vm.$nextTick();
    const button = page.wrapper.find('button[type="submit"]');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.text()).toBe('儲存中…');
    await flushPromises();
  });
});

// ---- task 8.8：購買記錄測試對照補上的項目（見 docs/progress.md「task 8.8 測試對照」） ----
describe('task 8.8 補充：邊界與整合', () => {
  async function fillCabbage(page: Page, values: Record<string, string>) {
    await choose(page, 'p-cabbage');
    await fill(page, { '#p-store': '市場', '#p-price': '90', '#p-qty': '3', ...values });
  }

  it.each(['-5', '-0.01'])(
    '總價輸入負數 %s → 只顯示 ERR-010，不寫入（AC-5.4、5.11）',
    async (price) => {
      const fake = seed();
      const page = await mountPage('/purchases/new', routes);
      await fillCabbage(page, { '#p-price': price });
      await submit(page);
      expect(text(page, '#p-price-error')).toBe(ERR.totalPriceNotPositive);
      expect(page.wrapper.text()).not.toContain(ERR.required);
      expect(fake.rows('purchase_records')).toHaveLength(2);
    },
  );

  // 台灣 00:30 時 UTC 還是前一天：「今天」要用裝置本地日期判斷（design.md 日期處理規則）
  it('午夜邊界：本地 11/2 00:30（UTC 還是 11/1）選 11/2 → 不是未來，可以存', async () => {
    vi.setSystemTime(new Date(2026, 10, 2, 0, 30));
    const fake = seed();
    const page = await mountPage('/purchases/new', routes);
    expect(value(page, '#p-date')).toBe('2026-11-02');
    await fillCabbage(page, {});
    await submit(page);
    expect(page.wrapper.find('#p-date-error').exists()).toBe(false);
    expect(fake.rows('purchase_records').at(-1)).toMatchObject({
      purchase_date: '2026-11-02 00:00:00.000Z',
    });
  });

  it('午夜邊界：本地 11/2 23:59 選 11/3 → ERR-011（AC-5.5）', async () => {
    vi.setSystemTime(new Date(2026, 10, 2, 23, 59));
    const fake = seed();
    const page = await mountPage('/purchases/new', routes);
    await fillCabbage(page, { '#p-date': '2026-11-03' });
    await submit(page);
    expect(text(page, '#p-date-error')).toBe(ERR.purchaseDateInFuture);
    expect(fake.rows('purchase_records')).toHaveLength(2);
  });

  it('整合：存檔後真的彈出 CONFIRM-002 對話框（Quasar Dialog），預先帶入目前的 3', async () => {
    ask.mockRestore(); // 不用假的，讓真正的對話框打開
    seed();
    const page = await mountPage('/purchases/new', routes);
    await choose(page, 'p-spring');
    await fill(page, {
      '#p-store': '全聯',
      '#p-price': '599',
      '#cf-f-sheets': '120',
      '#cf-f-packs': '10',
    });
    await submit(page);
    await flushPromises();
    const dialog = document.querySelector('.q-dialog');
    expect(dialog, 'QDialog 沒有彈出').not.toBeNull();
    expect(dialog!.textContent).toContain(CONFIRM.updateRemaining);
    expect(document.querySelector<HTMLInputElement>('#remain-dialog-input')?.value).toBe('3');
    expect(page.router.currentRoute.value.path).toBe('/purchases');
  });
});
