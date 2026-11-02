// useCategoryStore：商品分類（task 2.5 骨架、task 6.1 實作）
// REQ-2：AC-2.1 列表、AC-2.2～2.4 新增與驗證、AC-2.5～2.6 刪除、AC-2.7～2.9 修改名稱
//
// 驗證規則集中在這裡，頁面只負責顯示：
// - 名稱先去掉前後空白；空白 → ERR-002
// - 名稱和其他分類完全相同 → ERR-003（建立 / 修改前先向伺服器查詢，兩人同時操作也查得到）
// - 分類下還有商品 → 不能刪除，ERR-004
// 不符合規則時丟出 ValidationError，err.message 就是要顯示的訊息。
import { defineStore, acceptHMRUpdate } from 'pinia';
import pb from '@/lib/pocketbase';
import { ERR } from '@/constants/messages';
import { ValidationError, isRestrictedDelete, isUniqueViolation } from '@/lib/errors';
import type { CategoryRecord } from '@/types/models';

export interface CategoryStats {
  products: number;
  fields: number;
}

const emptyStats = (): Record<string, CategoryStats> => ({});

/** 分類名稱的長度上限（與 migration 的 max 100 一致） */
export const CATEGORY_NAME_MAX = 100;

/** 檢查並整理分類名稱：去掉前後空白，空白就丟 ERR-002 */
function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new ValidationError(ERR.categoryNameEmpty);
  return trimmed;
}

/** 向伺服器查詢：有沒有「其他」分類已經叫這個名字 */
async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
  const filter = exceptId
    ? pb.filter('name = {:name} && id != {:id}', { name, id: exceptId })
    : pb.filter('name = {:name}', { name });
  const result = await pb.collection('categories').getList(1, 1, { filter, skipTotal: true });
  return result.items.length > 0;
}

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [] as CategoryRecord[],
    loading: false,
    /** 每個分類有幾項商品、幾個自訂欄位（列表頁顯示用） */
    stats: emptyStats(),
  }),

  getters: {
    getById: (state) => (id: string) => state.categories.find((c) => c.id === id),
    /** 某分類的統計；還沒載入時回傳 0 */
    statsOf:
      (state) =>
      (id: string): CategoryStats =>
        state.stats[id] ?? { products: 0, fields: 0 },
  },

  actions: {
    /** 取得所有分類（依建立時間，舊的在前）（AC-2.1） */
    async fetchCategories(): Promise<void> {
      this.loading = true;
      try {
        this.categories = await pb
          .collection('categories')
          .getFullList<CategoryRecord>({ sort: 'created,id' });
      } finally {
        this.loading = false;
      }
    },

    /** 統計每個分類的商品數與自訂欄位數（只取 category 欄位，資料量小） */
    async fetchStats(): Promise<void> {
      const [products, fields] = await Promise.all([
        pb.collection('products').getFullList<{ category: string }>({ fields: 'category' }),
        pb.collection('custom_fields').getFullList<{ category: string }>({ fields: 'category' }),
      ]);
      const stats: Record<string, CategoryStats> = {};
      const bump = (id: string, key: keyof CategoryStats) => {
        stats[id] ??= { products: 0, fields: 0 };
        stats[id][key] += 1;
      };
      products.forEach((p) => bump(p.category, 'products'));
      fields.forEach((f) => bump(f.category, 'fields'));
      this.stats = stats;
    },

    /** 新增分類（AC-2.2～2.4） */
    async createCategory(name: string): Promise<CategoryRecord> {
      const clean = normalizeName(name);
      if (await nameTaken(clean)) throw new ValidationError(ERR.categoryNameDuplicate);
      try {
        const created = await pb.collection('categories').create<CategoryRecord>({ name: clean });
        this.categories.push(created);
        return created;
      } catch (err) {
        if (isUniqueViolation(err, 'name')) throw new ValidationError(ERR.categoryNameDuplicate);
        throw err;
      }
    },

    /** 修改分類名稱（AC-2.7～2.9） */
    async updateCategory(id: string, name: string): Promise<CategoryRecord> {
      const clean = normalizeName(name);
      if (await nameTaken(clean, id)) throw new ValidationError(ERR.categoryNameDuplicate);
      try {
        const updated = await pb
          .collection('categories')
          .update<CategoryRecord>(id, { name: clean });
        const index = this.categories.findIndex((c) => c.id === id);
        if (index >= 0) this.categories[index] = updated;
        return updated;
      } catch (err) {
        if (isUniqueViolation(err, 'name')) throw new ValidationError(ERR.categoryNameDuplicate);
        throw err;
      }
    },

    /**
     * 刪除分類（AC-2.5、2.6）。
     * 先查這個分類下有沒有商品；資料庫的 Restrict 是最後一道防線，被擋也顯示 ERR-004。
     * 分類的自訂欄位定義會被資料庫一起刪除（Cascade）。
     */
    async deleteCategory(id: string): Promise<void> {
      const products = await pb.collection('products').getList(1, 1, {
        filter: pb.filter('category = {:id}', { id }),
        skipTotal: true,
      });
      if (products.items.length > 0) throw new ValidationError(ERR.categoryHasProducts);
      try {
        await pb.collection('categories').delete(id);
      } catch (err) {
        if (isRestrictedDelete(err)) throw new ValidationError(ERR.categoryHasProducts);
        throw err;
      }
      this.categories = this.categories.filter((c) => c.id !== id);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCategoryStore, import.meta.hot));
}
