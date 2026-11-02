// useProductStore：商品（task 2.5 骨架、task 7.1 實作）
// REQ-3（新增商品 AC-3.1～3.6）、REQ-7（消耗設定與剩餘數量 AC-7.1、7.8～7.11）
//
// 驗證規則集中在這裡，頁面只負責顯示（不符合時丟出 ValidationError）：
// - 品牌或品名空白 → ERR-005；計價單位空白 → ERR-006；沒選分類 → ERR-009
// - 同分類下品牌＋品名相同（忽略大小寫、前後空白、全半形）→ ERR-007
// - 剩餘數量為負數 → ERR-015；設定了消耗速率卻沒填消耗單位 → ERR-016
// - 儲存剩餘數量時，remaining_updated_at 自動設為當天（AC-7.9）；清空剩餘數量則兩個欄位一起清空
import { defineStore, acceptHMRUpdate } from 'pinia';
import pb from '@/lib/pocketbase';
import { ERR } from '@/constants/messages';
import { ValidationError, isUniqueViolation } from '@/lib/errors';
import { compareByUrgency, normalizeForCompare, toProductView } from '@/lib/productView';
import { localToday } from '@/composables/dates';
import type { ConsumptionPeriod, ProductRecord } from '@/types/models';

/** 新增商品時填的欄位 */
export interface ProductInput {
  category: string;
  brand: string;
  name: string;
  unit: string;
  consumption_unit: string;
}

/** 更新消耗設定時填的欄位（null = 未設定） */
export interface ConsumptionInput {
  consumption_rate: number | null;
  consumption_period: ConsumptionPeriod | null;
  consumption_unit: string;
  remaining_quantity: number | null;
  consumption_note: string;
}

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as ProductRecord[],
    loading: false,
  }),

  getters: {
    getById: (state) => (id: string) => state.products.find((p) => p.id === id),
    byCategory: (state) => (categoryId: string) =>
      state.products.filter((p) => p.category === categoryId),
    /** 畫面用資料，依急迫程度排序（可選擇只看某個分類） */
    views:
      (state) =>
      (categoryId?: string, today: string = localToday()) =>
        state.products
          .filter((p) => !categoryId || p.category === categoryId)
          .map((p) => toProductView(p, today))
          .sort(compareByUrgency),
  },

  actions: {
    /** 取得所有商品（AC-7.3） */
    async fetchProducts(): Promise<void> {
      this.loading = true;
      try {
        this.products = await pb
          .collection('products')
          .getFullList<ProductRecord>({ sort: 'created,id' });
      } finally {
        this.loading = false;
      }
    },

    /** 新增商品（AC-3.1～3.6） */
    async createProduct(input: ProductInput): Promise<ProductRecord> {
      const brand = input.brand.trim();
      const name = input.name.trim();
      const unit = input.unit.trim();
      if (!input.category) throw new ValidationError(ERR.required);
      if (!brand || !name) throw new ValidationError(ERR.brandNameEmpty);
      if (!unit) throw new ValidationError(ERR.unitRequired);

      // AC-3.6：同分類下比對（忽略大小寫、前後空白、全半形）；資料庫的 filter 做不到，所以取回後在前端比
      const sameCategory = await pb.collection('products').getFullList<ProductRecord>({
        filter: pb.filter('category = {:c}', { c: input.category }),
        fields: 'id,brand,name',
      });
      const key = `${normalizeForCompare(brand)}\u0000${normalizeForCompare(name)}`;
      const duplicate = sameCategory.some(
        (p) => `${normalizeForCompare(p.brand)}\u0000${normalizeForCompare(p.name)}` === key,
      );
      if (duplicate) throw new ValidationError(ERR.productDuplicate);

      try {
        const created = await pb.collection('products').create<ProductRecord>({
          category: input.category,
          brand,
          name,
          unit,
          consumption_unit: input.consumption_unit.trim(),
        });
        this.products.push(created);
        return created;
      } catch (err) {
        if (isUniqueViolation(err, 'name') || isUniqueViolation(err, 'brand')) {
          throw new ValidationError(ERR.productDuplicate);
        }
        throw err;
      }
    },

    /** 更新消耗設定與剩餘數量（AC-7.1、7.8～7.11） */
    async updateProduct(id: string, input: ConsumptionInput): Promise<ProductRecord> {
      const remaining = input.remaining_quantity;
      if (remaining !== null && (!Number.isFinite(remaining) || remaining < 0)) {
        throw new ValidationError(ERR.remainingNegative);
      }
      const rate =
        input.consumption_rate !== null && input.consumption_rate > 0
          ? input.consumption_rate
          : null;
      const consumptionUnit = input.consumption_unit.trim();
      if (rate !== null && !consumptionUnit) throw new ValidationError(ERR.consumptionUnitRequired);

      const updated = await pb.collection('products').update<ProductRecord>(id, {
        consumption_rate: rate ?? 0,
        consumption_period: rate === null ? '' : (input.consumption_period ?? 'monthly'),
        consumption_unit: consumptionUnit,
        // 剩餘數量與更新日一起寫入、一起清空（design.md 讀取轉換規則）
        remaining_quantity: remaining ?? 0,
        remaining_updated_at: remaining === null ? '' : `${localToday()} 00:00:00.000Z`,
        consumption_note: input.consumption_note.trim(),
      });
      const index = this.products.findIndex((p) => p.id === id);
      if (index >= 0) this.products[index] = updated;
      else this.products.push(updated);
      return updated;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProductStore, import.meta.hot));
}
