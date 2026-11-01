// useCategoryStore：商品分類（task 2.5 骨架；actions 於 task 6.1 實作）
import { defineStore, acceptHMRUpdate } from 'pinia';
import type { CategoryRecord } from '@/types/models';
import { notImplemented } from './notImplemented';

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [] as CategoryRecord[],
    loading: false,
  }),

  getters: {
    getById: (state) => (id: string) => state.categories.find((c) => c.id === id),
  },

  /* eslint-disable @typescript-eslint/no-unused-vars */
  actions: {
    fetchCategories(): Promise<void> {
      notImplemented('fetchCategories', '6.1');
    },
    createCategory(name: string): Promise<CategoryRecord> {
      notImplemented('createCategory', '6.1');
    },
    updateCategory(id: string, name: string): Promise<CategoryRecord> {
      notImplemented('updateCategory', '6.1');
    },
    deleteCategory(id: string): Promise<void> {
      notImplemented('deleteCategory', '6.1');
    },
  },
  /* eslint-enable @typescript-eslint/no-unused-vars */
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCategoryStore, import.meta.hot));
}
