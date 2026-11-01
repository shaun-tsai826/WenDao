// 路由設定（task 2.4）
// 規格：design.md「路由設計」「頁面與路由對照」
//
// - /login 獨立顯示（沒有導覽列），meta.public = true
// - 其他 11 個功能頁都是 MainLayout 的子路由（導覽列只寫一次，task 2.6）
//   meta.requiresAuth 寫在父路由，子路由會自動繼承（vue-router 會合併 matched 的 meta）
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/pages/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('@/pages/Dashboard.vue') },
      { path: 'categories', component: () => import('@/pages/Categories.vue') },
      { path: 'categories/:id/edit', component: () => import('@/pages/CategoryEdit.vue') },
      { path: 'products', component: () => import('@/pages/Products.vue') },
      { path: 'products/new', component: () => import('@/pages/ProductNew.vue') },
      { path: 'products/:id', component: () => import('@/pages/ProductDetail.vue') },
      { path: 'products/:id/edit', component: () => import('@/pages/ProductEdit.vue') },
      { path: 'purchases', component: () => import('@/pages/Purchases.vue') },
      { path: 'purchases/new', component: () => import('@/pages/PurchaseNew.vue') },
      { path: 'purchases/:id', component: () => import('@/pages/PurchaseDetail.vue') },
      { path: 'purchases/:id/edit', component: () => import('@/pages/PurchaseEdit.vue') },
    ],
  },

  // 找不到頁面（Quasar 範本內建），必須放在最後
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
