/// <reference path="../pb_data/types.d.ts" />

// task 1.4：建立 products（商品）
// 規格：design.md「products」、REQ-3、REQ-7
// API Rules 統一在 task 1.7 設定，這裡不動。
//
// 注意：PocketBase 的 number 欄位存不了 null，沒填時一律存 0；date 沒填時存 ''。
// - consumption_rate：0 = 未設定（design 的 getDepletionStatus 本來就把 0 當未設定）。
//   min 0.01 只檢查有填的值，沒填的 0 不會被擋。
// - remaining_quantity：0 也可能是「剩 0 包」，所以用 remaining_updated_at 判斷：
//   remaining_updated_at 為空 = 尚未設定剩餘數量（前端讀取時轉成 null）。
//   兩個欄位必須一起寫入、一起清空。

migrate((app) => {
  const categories = app.findCollectionByNameOrId("categories")

  const products = new Collection({
    type: "base",
    name: "products",
    fields: [
      {
        type: "relation",
        name: "category",
        required: true,
        collectionId: categories.id,
        cascadeDelete: false, // Restrict：分類下還有商品時，不能刪除分類（AC-2.5）
        maxSelect: 1,
      },
      { type: "text", name: "brand", required: true, max: 100 },
      { type: "text", name: "name", required: true, max: 200 },
      { type: "text", name: "unit", required: true, max: 20 }, // 計價單位（抽、ml、g、片）
      { type: "text", name: "consumption_unit", max: 20 }, // 消耗單位（包）
      { type: "number", name: "consumption_rate", min: 0.01 }, // 每週期消耗量，0 = 未設定
      {
        type: "select",
        name: "consumption_period",
        values: ["monthly", "weekly"],
        maxSelect: 1,
      },
      { type: "number", name: "remaining_quantity", min: 0 }, // 手動輸入的剩餘數量
      { type: "date", name: "remaining_updated_at" }, // 為空 = 剩餘數量未設定
      { type: "text", name: "consumption_note", max: 500 },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    // 同一分類下「品牌＋品名」完全相同時擋下。
    // 忽略大小寫、前後空白、全半形的比對（AC-3.6）由前端負責。
    indexes: [
      "CREATE UNIQUE INDEX `idx_products_category_brand_name` ON `products` (`category`, `brand`, `name`)",
    ],
  })

  app.save(products)
}, (app) => {
  const products = app.findCollectionByNameOrId("products")
  app.delete(products)
})
