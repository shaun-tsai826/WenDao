/// <reference path="../pb_data/types.d.ts" />

// task 1.6：建立 purchase_record_field_values（EAV 值層：每筆購買記錄填的自訂欄位值）
// 規格：design.md「purchase_record_field_values」、REQ-4
// API Rules 統一在 task 1.7 設定，這裡不動。

migrate((app) => {
  const purchaseRecords = app.findCollectionByNameOrId("purchase_records")
  const customFields = app.findCollectionByNameOrId("custom_fields")

  const fieldValues = new Collection({
    type: "base",
    name: "purchase_record_field_values",
    fields: [
      {
        type: "relation",
        name: "purchase_record",
        required: true,
        collectionId: purchaseRecords.id,
        cascadeDelete: true, // 刪除購買記錄時連帶刪除欄位值
        maxSelect: 1,
      },
      {
        type: "relation",
        name: "custom_field",
        required: true,
        collectionId: customFields.id,
        cascadeDelete: false, // Restrict：欄位已有購買記錄使用時不能刪除（AC-4.8）
        maxSelect: 1,
      },
      { type: "text", name: "field_value", required: true, max: 255 }, // 一律存字串，前端轉型
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    // 一筆購買記錄對同一個自訂欄位只能有一個值（前端也會保證，這裡是最後一道防線）
    indexes: [
      "CREATE UNIQUE INDEX `idx_prfv_record_field` ON `purchase_record_field_values` (`purchase_record`, `custom_field`)",
    ],
  })

  app.save(fieldValues)
}, (app) => {
  const fieldValues = app.findCollectionByNameOrId("purchase_record_field_values")
  app.delete(fieldValues)
})
