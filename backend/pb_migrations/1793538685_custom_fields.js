/// <reference path="../pb_data/types.d.ts" />

// task 1.3：建立 custom_fields（EAV 定義層：每個分類有哪些自訂欄位）
// 規格：design.md「custom_fields」、REQ-4
// API Rules 統一在 task 1.7 設定，這裡不動。
//
// 注意 PocketBase 的 required 語意：
// - bool 設 required = 「必須是 true」→ 存 false 會失敗
// - number 設 required = 「不可為 0」→ 存 0 會失敗
// 因此 is_quantity_component / display_order 不設 required；
// 沒填時 PocketBase 會存 false / 0，等同規格的「default false / default 0」。

migrate((app) => {
  const categories = app.findCollectionByNameOrId("categories")

  const customFields = new Collection({
    type: "base",
    name: "custom_fields",
    fields: [
      {
        type: "relation",
        name: "category",
        required: true,
        collectionId: categories.id,
        cascadeDelete: true, // 刪除分類時連帶刪除欄位定義
        maxSelect: 1,
      },
      {
        type: "text",
        name: "field_name",
        required: true,
        max: 100,
      },
      {
        type: "select",
        name: "field_type",
        required: true,
        values: ["number", "text"],
        maxSelect: 1,
      },
      {
        type: "bool",
        name: "is_quantity_component", // true = 數量組成欄位，false = 一般資訊欄位
      },
      {
        type: "number",
        name: "display_order", // 表單顯示順序（由小到大）
        min: 0,
      },
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    // 同一分類下欄位名稱不可重複（AC-4.7）。前端仍會先查詢並顯示友善訊息，這裡是最後一道防線。
    indexes: [
      "CREATE UNIQUE INDEX `idx_custom_fields_category_field_name` ON `custom_fields` (`category`, `field_name`)",
    ],
  })

  app.save(customFields)
}, (app) => {
  const customFields = app.findCollectionByNameOrId("custom_fields")
  app.delete(customFields)
})
