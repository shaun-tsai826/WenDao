// usePurchaseStore：購買記錄
// - task 7.5：fetchByProduct、fetchUsers（商品詳情用）
// - task 8.1：fetchRecords、createRecord、updateRecord、deleteRecord
// - task 8.5：fetchRecord、fetchFieldValues（購買記錄詳情；8.6 編輯頁也會用到）
//
// 規則（REQ-4、REQ-5、REQ-6、REQ-8）：
// - 存檔前用 lib/purchaseForm.ts 檢查（必填 ERR-009、總價 ERR-010、未來日期 ERR-011、組成欄位 ERR-008），
//   不通過丟出 FieldsValidationError（每個欄位各自的訊息），一筆都不寫
// - 數量與單位均價由前端算好再寫入（AC-4.3、6.1）；缺失時寫 0（design.md：0 = 缺失）
// - 新增者 = 目前登入的人（AC-5.6），編輯時不改
// - 自訂欄位值存在 purchase_record_field_values（EAV）；新增時寫到一半失敗會刪掉剛建立的記錄
// - 日期存成 'YYYY-MM-DD 00:00:00.000Z'；日期區間包含結束日當天（AC-8.6），結束早於開始 → ERR-012（AC-8.7）
import { defineStore, acceptHMRUpdate } from 'pinia';
import { ClientResponseError } from 'pocketbase';
import pb from '@/lib/pocketbase';
import { ERR } from '@/constants/messages';
import { localToday } from '@/composables/dates';
import { FieldsValidationError, hasFieldError } from '@/lib/errors';
import {
  computePurchase,
  fieldValuesToSave,
  validatePurchase,
  type PurchaseFormData,
} from '@/lib/purchaseForm';
import { toPurchaseView, type PurchaseView } from '@/lib/purchaseView';
import type { FieldValueRecord, PurchaseRecordRecord, UserRecord } from '@/types/models';

export type { PurchaseFormData } from '@/lib/purchaseForm';

export interface PurchaseFilters {
  categoryId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD（包含當天）
}

/** 「常去的地點」按鈕最多幾個（設計稿 Pur-New） */
export const RECENT_STORES_MAX = 6;

/** 同一天的記錄：後建立的在前 */
const SORT = '-purchase_date,-created';

/** 'YYYY-MM-DD' → 資料庫的日期值 */
const toDbDate = (date: string) => `${date} 00:00:00.000Z`;

/** 檢查表單並算出要寫入 purchase_records 的欄位（不含 user） */
function prepare(data: PurchaseFormData) {
  const errors = validatePurchase(data, localToday());
  if (Object.keys(errors).length) throw new FieldsValidationError(errors);
  const { quantity, unitPrice } = computePurchase(data);
  return {
    product: data.productId,
    purchase_date: toDbDate(data.purchaseDate),
    store: data.store.trim(),
    total_price: data.totalPrice,
    quantity: quantity ?? 0,
    unit_price: unitPrice ?? 0,
  };
}

/** 資料庫擋下總價（min 0.01）時，和前端一樣顯示 ERR-010（K-6） */
function translateDbError(err: unknown): unknown {
  return hasFieldError(err, 'total_price')
    ? new FieldsValidationError({ totalPrice: ERR.totalPriceNotPositive })
    : err;
}

export const usePurchaseStore = defineStore('purchase', {
  state: () => ({
    records: [] as PurchaseRecordRecord[],
    loading: false,
    /** 家庭成員（購買記錄的新增者），依建立順序 */
    users: [] as Pick<UserRecord, 'id' | 'name'>[],
    /** 常去的地點（最近用過的在前，最多 RECENT_STORES_MAX 個；task 8.4） */
    recentStores: [] as string[],
  }),

  getters: {
    getById: (state) => (id: string) => state.records.find((r) => r.id === id),
    /** 畫面用資料（數量 0 → 缺失、單位均價跟著 null） */
    views: (state): PurchaseView[] => state.records.map(toPurchaseView),
    /** 使用者的建立順序（決定頭像顏色）；找不到為 -1 */
    userIndex: (state) => (id: string) => state.users.findIndex((u) => u.id === id),
    userName: (state) => (id: string) => state.users.find((u) => u.id === id)?.name ?? '',
  },

  actions: {
    /** 某個商品的購買記錄，依購入日期由新至舊；同一天後建立的在前（AC-8.2，task 7.5） */
    async fetchByProduct(productId: string): Promise<PurchaseView[]> {
      const records = await pb.collection('purchase_records').getFullList<PurchaseRecordRecord>({
        filter: pb.filter('product = {:id}', { id: productId }),
        sort: SORT,
      });
      return records.map(toPurchaseView);
    },

    /** 一筆購買記錄（詳情頁）；找不到（404，可能已被刪除）回傳 null，其他錯誤照樣丟出 */
    async fetchRecord(id: string): Promise<PurchaseRecordRecord | null> {
      try {
        return await pb.collection('purchase_records').getOne<PurchaseRecordRecord>(id);
      } catch (err) {
        if (err instanceof ClientResponseError && err.status === 404) return null;
        throw err;
      }
    },

    /** 一筆購買記錄的自訂欄位值（EAV） */
    async fetchFieldValues(recordId: string): Promise<FieldValueRecord[]> {
      return pb.collection('purchase_record_field_values').getFullList<FieldValueRecord>({
        filter: pb.filter('purchase_record = {:id}', { id: recordId }),
      });
    },

    /** 取得家庭成員名單（只需要 id 與名稱；API Rule 允許已登入者 List） */
    async fetchUsers(): Promise<void> {
      this.users = await pb
        .collection('users')
        .getFullList<UserRecord>({ sort: 'created,id', fields: 'id,name' });
    },

    /** 常去的地點：最近 100 筆記錄用過的地點，最近用的在前、不重複（使用者同意提案 1） */
    async fetchRecentStores(): Promise<void> {
      const { items } = await pb
        .collection('purchase_records')
        .getList<Pick<PurchaseRecordRecord, 'store'>>(1, 100, {
          sort: '-created',
          fields: 'store',
        });
      const stores = items.map((r) => r.store.trim()).filter(Boolean);
      this.recentStores = [...new Set(stores)].slice(0, RECENT_STORES_MAX);
    },

    /** 購買記錄列表：可依分類與日期區間篩選，依購入日期由新至舊（AC-8.1、8.5、8.6、8.7） */
    async fetchRecords(filters: PurchaseFilters = {}): Promise<void> {
      const { categoryId, startDate, endDate } = filters;
      if (startDate && endDate && endDate < startDate) {
        throw new FieldsValidationError({ endDate: ERR.dateRangeInvalid });
      }
      // pb.filter() 會幫參數加上引號並跳脫特殊字元，避免使用者輸入的值改變查詢條件
      const parts: string[] = [];
      if (categoryId) parts.push(pb.filter('product.category = {:c}', { c: categoryId }));
      if (startDate) parts.push(pb.filter('purchase_date >= {:s}', { s: toDbDate(startDate) }));
      // 包含結束日當天：<= 當天最後一刻
      if (endDate)
        parts.push(pb.filter('purchase_date <= {:e}', { e: `${endDate} 23:59:59.999Z` }));

      this.loading = true;
      try {
        this.records = await pb.collection('purchase_records').getFullList<PurchaseRecordRecord>({
          ...(parts.length ? { filter: parts.join(' && ') } : {}),
          sort: SORT,
        });
      } finally {
        this.loading = false;
      }
    },

    /** 新增購買記錄（AC-5.1、5.2、5.6、4.3、6.1） */
    async createRecord(data: PurchaseFormData): Promise<PurchaseRecordRecord> {
      const fields = prepare(data);
      const userId = pb.authStore.record?.id;
      if (!userId) throw new Error('尚未登入，無法新增購買記錄');

      let created: PurchaseRecordRecord;
      try {
        created = await pb
          .collection('purchase_records')
          .create<PurchaseRecordRecord>({ ...fields, user: userId });
      } catch (err) {
        throw translateDbError(err);
      }

      try {
        for (const [fieldId, value] of Object.entries(fieldValuesToSave(data))) {
          await pb.collection('purchase_record_field_values').create({
            purchase_record: created.id,
            custom_field: fieldId,
            field_value: value,
          });
        }
      } catch (err) {
        // 不留下半套資料：刪掉剛建立的記錄（已寫入的欄位值會被資料庫 cascade 一起刪掉）
        await pb
          .collection('purchase_records')
          .delete(created.id)
          .catch(() => undefined);
        throw err;
      }

      this.records.unshift(created);
      return created;
    },

    /** 編輯購買記錄：重新計算數量與單位均價，並同步自訂欄位值（AC-5.7、6.1） */
    async updateRecord(id: string, data: PurchaseFormData): Promise<PurchaseRecordRecord> {
      const fields = prepare(data);
      let updated: PurchaseRecordRecord;
      try {
        // 不送 user：新增者維持原本的人（AC-5.6）
        updated = await pb.collection('purchase_records').update<PurchaseRecordRecord>(id, fields);
      } catch (err) {
        throw translateDbError(err);
      }

      // 同步欄位值：改了的更新、清空的刪除、新填的新增；不屬於這個分類的（換了商品）也刪除
      const wanted = fieldValuesToSave(data);
      const existing = await pb
        .collection('purchase_record_field_values')
        .getFullList<FieldValueRecord>({ filter: pb.filter('purchase_record = {:id}', { id }) });
      for (const row of existing) {
        const value = wanted[row.custom_field];
        if (value === undefined) {
          await pb.collection('purchase_record_field_values').delete(row.id);
        } else if (value !== row.field_value) {
          await pb
            .collection('purchase_record_field_values')
            .update(row.id, { field_value: value });
        }
      }
      const existingFields = new Set(existing.map((row) => row.custom_field));
      for (const [fieldId, value] of Object.entries(wanted)) {
        if (existingFields.has(fieldId)) continue;
        await pb.collection('purchase_record_field_values').create({
          purchase_record: id,
          custom_field: fieldId,
          field_value: value,
        });
      }

      const index = this.records.findIndex((r) => r.id === id);
      if (index >= 0) this.records[index] = updated;
      return updated;
    },

    /** 刪除購買記錄（AC-5.9）；自訂欄位值由資料庫 cascade 一起刪除 */
    async deleteRecord(id: string): Promise<void> {
      await pb.collection('purchase_records').delete(id);
      this.records = this.records.filter((r) => r.id !== id);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePurchaseStore, import.meta.hot));
}
