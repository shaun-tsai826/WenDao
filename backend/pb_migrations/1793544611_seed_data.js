/// <reference path="../pb_data/types.d.ts" />

// task 1.8：種子資料（分類、自訂欄位、商品）
// 規格：tasks.md 1.8、BDD.md「背景資料」
//
// 使用者帳號不寫在這裡：repo 是 public，帳號與密碼由使用者在 superuser UI 手動建立。

migrate((app) => {
  const save = (collectionName, data) => {
    const record = new Record(app.findCollectionByNameOrId(collectionName))
    for (const key in data) record.set(key, data[key])
    app.save(record)
    return record
  }

  // 分類
  const tissue = save("categories", { name: "衛生紙" })
  save("categories", { name: "蔬菜" }) // 沒有自訂欄位，用來測試直接輸入數量（AC-4.4）

  // 衛生紙的自訂欄位：總數量 = 抽數(單包) × 包數
  save("custom_fields", {
    category: tissue.id,
    field_name: "抽數(單包)",
    field_type: "number",
    is_quantity_component: true,
    display_order: 1,
  })
  save("custom_fields", {
    category: tissue.id,
    field_name: "包數",
    field_type: "number",
    is_quantity_component: true,
    display_order: 2,
  })
  save("custom_fields", {
    category: tissue.id,
    field_name: "層數",
    field_type: "number",
    is_quantity_component: false, // 一般資訊，不參與數量計算
    display_order: 3,
  })

  // 範例商品
  save("products", {
    category: tissue.id,
    brand: "春風",
    name: "抽取式衛生紙",
    unit: "抽", // 計價單位
    consumption_unit: "包", // 消耗單位
  })
}, (app) => {
  // 還原：先刪商品（分類對商品是 Restrict），再刪分類（自訂欄位會跟著 Cascade 刪除）
  const tissue = app.findFirstRecordByData("categories", "name", "衛生紙")
  const product = app.findFirstRecordByFilter(
    "products",
    "category = {:c} && brand = {:b} && name = {:n}",
    { c: tissue.id, b: "春風", n: "抽取式衛生紙" },
  )
  app.delete(product)
  app.delete(tissue)
  app.delete(app.findFirstRecordByData("categories", "name", "蔬菜"))
})
