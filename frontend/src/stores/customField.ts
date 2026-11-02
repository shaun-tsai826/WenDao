// useCustomFieldStore：某個分類的自訂欄位（task 6.5，REQ-4 / AC-4.1、4.2、4.7～4.11）
//
// 規則（驗證集中在這裡，頁面只負責顯示）：
// - 欄位名稱去掉前後空白；空白 → ERR-009「此欄位為必填」
// - 同一分類下名稱重複 → ERR-017（先向伺服器查詢；資料庫 UNIQUE INDEX 擋下也轉成 ERR-017）
// - 已被購買記錄使用的欄位：不能刪除（ERR-018）、不能改型別或計算方式（ERR-019）
//   「是否已被使用」每次都重新向伺服器查，避免另一人剛好新增了記錄
// - 名稱與顯示順序隨時可改（AC-4.11）
import { defineStore, acceptHMRUpdate } from 'pinia';
import pb from '@/lib/pocketbase';
import { ERR } from '@/constants/messages';
import { ValidationError, isRestrictedDelete, isUniqueViolation } from '@/lib/errors';
import type { CustomFieldRecord, CustomFieldType } from '@/types/models';

export interface CustomFieldInput {
  field_name: string;
  field_type: CustomFieldType;
  is_quantity_component: boolean;
}

/** 欄位名稱長度上限（與 migration 的 max 100 一致） */
export const FIELD_NAME_MAX = 100;

const emptyUsage = (): Record<string, number> => ({});

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new ValidationError(ERR.required);
  return trimmed;
}

/** 同一分類下，有沒有「其他」欄位已經叫這個名字 */
async function nameTaken(categoryId: string, name: string, exceptId?: string): Promise<boolean> {
  const filter = exceptId
    ? pb.filter('category = {:c} && field_name = {:n} && id != {:id}', {
        c: categoryId,
        n: name,
        id: exceptId,
      })
    : pb.filter('category = {:c} && field_name = {:n}', { c: categoryId, n: name });
  const result = await pb.collection('custom_fields').getList(1, 1, { filter, skipTotal: true });
  return result.items.length > 0;
}

/** 有幾筆購買記錄填了這個欄位 */
async function countUsage(fieldId: string): Promise<number> {
  const result = await pb.collection('purchase_record_field_values').getList(1, 1, {
    filter: pb.filter('custom_field = {:id}', { id: fieldId }),
  });
  return result.totalItems;
}

export const useCustomFieldStore = defineStore('customField', {
  state: () => ({
    categoryId: '',
    fields: [] as CustomFieldRecord[],
    /** 欄位 id → 已被幾筆購買記錄使用 */
    usage: emptyUsage(),
    loading: false,
  }),

  getters: {
    getById: (state) => (id: string) => state.fields.find((f) => f.id === id),
    usageOf: (state) => (id: string) => state.usage[id] ?? 0,
  },

  actions: {
    /** 取得分類的自訂欄位（依顯示順序）與使用狀況 */
    async fetchFields(categoryId: string): Promise<void> {
      this.loading = true;
      try {
        const fields = await pb.collection('custom_fields').getFullList<CustomFieldRecord>({
          filter: pb.filter('category = {:c}', { c: categoryId }),
          sort: 'display_order,created',
        });
        const counts = await Promise.all(fields.map((f) => countUsage(f.id)));
        this.categoryId = categoryId;
        this.fields = fields;
        this.usage = Object.fromEntries(fields.map((f, i) => [f.id, counts[i] ?? 0]));
      } finally {
        this.loading = false;
      }
    },

    /** 新增欄位（AC-4.1、4.2、4.7），排在最後 */
    async createField(categoryId: string, input: CustomFieldInput): Promise<CustomFieldRecord> {
      const name = normalizeName(input.field_name);
      if (await nameTaken(categoryId, name)) throw new ValidationError(ERR.fieldNameDuplicate);
      const lastOrder = Math.max(0, ...this.fields.map((f) => f.display_order));
      try {
        const created = await pb.collection('custom_fields').create<CustomFieldRecord>({
          category: categoryId,
          field_name: name,
          field_type: input.field_type,
          is_quantity_component: input.is_quantity_component,
          display_order: lastOrder + 1,
        });
        this.fields.push(created);
        this.usage[created.id] = 0;
        return created;
      } catch (err) {
        if (isUniqueViolation(err, 'field_name')) throw new ValidationError(ERR.fieldNameDuplicate);
        throw err;
      }
    },

    /**
     * 修改欄位（AC-4.10、4.11）：名稱隨時可改；
     * 型別或計算方式有變動且欄位已被使用 → ERR-019。
     */
    async updateField(id: string, input: CustomFieldInput): Promise<CustomFieldRecord> {
      const current = this.getById(id);
      if (!current) throw new ValidationError(ERR.serverError);
      const name = normalizeName(input.field_name);
      const settingsChanged =
        input.field_type !== current.field_type ||
        input.is_quantity_component !== current.is_quantity_component;
      if (settingsChanged) {
        const used = await countUsage(id);
        this.usage[id] = used;
        if (used > 0) throw new ValidationError(ERR.fieldInUseCannotChangeType);
      }
      if (await nameTaken(current.category, name, id)) {
        throw new ValidationError(ERR.fieldNameDuplicate);
      }
      try {
        const updated = await pb.collection('custom_fields').update<CustomFieldRecord>(id, {
          field_name: name,
          field_type: input.field_type,
          is_quantity_component: input.is_quantity_component,
        });
        this.replace(updated);
        return updated;
      } catch (err) {
        if (isUniqueViolation(err, 'field_name')) throw new ValidationError(ERR.fieldNameDuplicate);
        throw err;
      }
    },

    /**
     * 上移（-1）或下移（+1）一格（AC-4.11 顯示順序）。
     * 先把順序整理成 1、2、3…（舊資料可能都是 0），再交換相鄰兩個，只更新有變動的欄位。
     */
    async moveField(id: string, direction: -1 | 1): Promise<void> {
      const ordered = [...this.fields];
      const from = ordered.findIndex((f) => f.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= ordered.length) return;
      [ordered[from], ordered[to]] = [ordered[to]!, ordered[from]!];
      const changed = ordered
        .map((field, index) => ({ field, order: index + 1 }))
        .filter(({ field, order }) => field.display_order !== order);
      const updated = await Promise.all(
        changed.map(({ field, order }) =>
          pb
            .collection('custom_fields')
            .update<CustomFieldRecord>(field.id, { display_order: order }),
        ),
      );
      const byId = new Map(updated.map((f) => [f.id, f]));
      this.fields = ordered.map((f) => byId.get(f.id) ?? f);
    },

    /** 刪除欄位（AC-4.8、4.9）：已被使用 → ERR-018 */
    async deleteField(id: string): Promise<void> {
      const used = await countUsage(id);
      this.usage[id] = used;
      if (used > 0) throw new ValidationError(ERR.fieldInUseCannotDelete);
      try {
        await pb.collection('custom_fields').delete(id);
      } catch (err) {
        if (isRestrictedDelete(err)) throw new ValidationError(ERR.fieldInUseCannotDelete);
        throw err;
      }
      this.fields = this.fields.filter((f) => f.id !== id);
      delete this.usage[id];
    },

    /** 用伺服器回傳的新資料取代清單中的同一筆 */
    replace(updated: CustomFieldRecord) {
      const index = this.fields.findIndex((f) => f.id === updated.id);
      if (index >= 0) this.fields[index] = updated;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCustomFieldStore, import.meta.hot));
}
