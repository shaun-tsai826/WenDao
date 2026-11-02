// usePurchaseStore：購買記錄（task 2.5 骨架；讀取 fetchByProduct / fetchUsers 於 task 7.5 先做，其餘 actions 於 task 8.1 實作）
import { defineStore, acceptHMRUpdate } from 'pinia';
import pb from '@/lib/pocketbase';
import { toPurchaseView, type PurchaseView } from '@/lib/purchaseView';
import type { PurchaseRecordRecord, UserRecord } from '@/types/models';
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
    /** 家庭成員（購買記錄的新增者），依建立順序 */
    users: [] as Pick<UserRecord, 'id' | 'name'>[],
  }),

  getters: {
    getById: (state) => (id: string) => state.records.find((r) => r.id === id),
    /** 使用者的建立順序（決定頭像顏色）；找不到為 -1 */
    userIndex: (state) => (id: string) => state.users.findIndex((u) => u.id === id),
    userName: (state) => (id: string) => state.users.find((u) => u.id === id)?.name ?? '',
  },

  /* eslint-disable @typescript-eslint/no-unused-vars */
  actions: {
    /** 某個商品的購買記錄，依購入日期由新至舊；同一天後建立的在前（AC-8.2，task 7.5） */
    async fetchByProduct(productId: string): Promise<PurchaseView[]> {
      const records = await pb.collection('purchase_records').getFullList<PurchaseRecordRecord>({
        filter: pb.filter('product = {:id}', { id: productId }),
        sort: '-purchase_date,-created',
      });
      return records.map(toPurchaseView);
    },

    /** 取得家庭成員名單（只需要 id 與名稱；API Rule 允許已登入者 List） */
    async fetchUsers(): Promise<void> {
      this.users = await pb
        .collection('users')
        .getFullList<UserRecord>({ sort: 'created,id', fields: 'id,name' });
    },

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
