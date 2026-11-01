// useProductStore：商品（task 2.5 骨架；actions 於 task 7.1 實作）
import { defineStore, acceptHMRUpdate } from 'pinia';
import type { ProductRecord } from '@/types/models';
import { notImplemented } from './notImplemented';

// 新增 / 編輯商品時送出的欄位（id、created 等系統欄位由 PocketBase 產生）
export type ProductInput = Pick<
  ProductRecord,
  | 'category'
  | 'brand'
  | 'name'
  | 'unit'
  | 'consumption_unit'
  | 'consumption_rate'
  | 'consumption_period'
  | 'remaining_quantity'
  | 'remaining_updated_at'
  | 'consumption_note'
>;

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as ProductRecord[],
    loading: false,
  }),

  getters: {
    getById: (state) => (id: string) => state.products.find((p) => p.id === id),
    byCategory: (state) => (categoryId: string) =>
      state.products.filter((p) => p.category === categoryId),
  },

  /* eslint-disable @typescript-eslint/no-unused-vars */
  actions: {
    fetchProducts(): Promise<void> {
      notImplemented('fetchProducts', '7.1');
    },
    createProduct(data: ProductInput): Promise<ProductRecord> {
      notImplemented('createProduct', '7.1');
    },
    updateProduct(id: string, data: Partial<ProductInput>): Promise<ProductRecord> {
      notImplemented('updateProduct', '7.1');
    },
  },
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProductStore, import.meta.hot));
}
