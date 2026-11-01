// usePurchaseStore：購買記錄（task 2.5 骨架；actions 於 task 8.1 實作）
import { defineStore, acceptHMRUpdate } from 'pinia';
import type { PurchaseRecordRecord } from '@/types/models';
import { notImplemented } from './notImplemented';

export interface PurchaseFilters {
  categoryId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD（包含當天）
}

// 新增 / 編輯購買記錄的表單資料（quantity、unit_price 由前端計算，見 task 8.1）
export interface PurchaseFormData {
  productId: string;
  purchaseDate: string;
  store: string;
  totalPrice: number;
  quantity: number | null; // 分類沒有數量組成欄位時直接輸入
  fieldValues: Record<string, string>; // custom_fields.id → 值
}

export const usePurchaseStore = defineStore('purchase', {
  state: () => ({
    records: [] as PurchaseRecordRecord[],
    loading: false,
  }),

  getters: {
    getById: (state) => (id: string) => state.records.find((r) => r.id === id),
  },

  /* eslint-disable @typescript-eslint/no-unused-vars */
  actions: {
    fetchRecords(filters?: PurchaseFilters): Promise<void> {
      notImplemented('fetchRecords', '8.1');
    },
    createRecord(data: PurchaseFormData): Promise<PurchaseRecordRecord> {
      notImplemented('createRecord', '8.1');
    },
    updateRecord(id: string, data: PurchaseFormData): Promise<PurchaseRecordRecord> {
      notImplemented('updateRecord', '8.1');
    },
    deleteRecord(id: string): Promise<void> {
      notImplemented('deleteRecord', '8.1');
    },
  },
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePurchaseStore, import.meta.hot));
}
