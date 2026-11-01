/// <reference path="../pb_data/types.d.ts" />

// task 1.5：建立 purchase_records（購買記錄）
// 規格：design.md「purchase_records」、REQ-5、REQ-6
// API Rules 統一在 task 1.7 設定，這裡不動。
//
// 注意：PocketBase 的 number 存不了 null，沒填時存 0。
// - quantity = 0 視為「缺失」（AC-6.5 本來就把 0 和缺失一樣當成「無法計算」）
// - unit_price 只在 quantity > 0 時才有意義；quantity = 0 時前端讀取轉成 null，
//   計算歷史均價時也要排除這些記錄。
// - 「購入日期不可為未來日期」（AC-5.5）由前端驗證。

migrate((app) => {
  const products = app.findCollectionByNameOrId("products")
  const users = app.findCollectionByNameOrId("users")

  const purchaseRecords = new Collection({
    type: "base",
    name: "purchase_records",
    fields: [
      {
        type: "relation",
        name: "product",
        required: true,
        collectionId: products.id,
        cascadeDelete: false, // Restrict：商品有購買記錄時不能刪除
        maxSelect: 1,
      },
      { type: "date", name: "purchase_date", required: true },
      { type: "text", name: "store", required: true, max: 100 },
      { type: "number", name: "total_price", required: true, min: 0.01 },
      { type: "number", name: "quantity", min: 0 }, // 前端計算後寫入，0 = 缺失
      { type: "number", name: "unit_price" }, // 前端計算後寫入，quantity 為 0 時無意義
      {
        type: "relation",
        name: "user",
        required: true,
        collectionId: users.id,
        cascadeDelete: false, // 使用者有記錄時不能被刪除，避免記錄失去新增者
        maxSelect: 1,
      },
      // created = 新增時間（AC-5.6）
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
  })

  app.save(purchaseRecords)
}, (app) => {
  const purchaseRecords = app.findCollectionByNameOrId("purchase_records")
  app.delete(purchaseRecords)
})
