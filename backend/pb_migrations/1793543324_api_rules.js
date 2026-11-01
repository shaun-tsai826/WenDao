/// <reference path="../pb_data/types.d.ts" />

// task 1.7：設定所有 Collection 的 API Rules
// 規格：design.md 各 Collection 的 API Rule、REQ-1 / AC-1.3
//
// PocketBase 規則的三種值：
// - null（Locked）     → 只有 superuser 可以操作
// - ""（空字串）        → 任何人都可以，包含未登入者（本專案不使用）
// - "@request.auth.id != \"\"" → 已登入的使用者才可以

const LOGGED_IN = '@request.auth.id != ""'

const DATA_COLLECTIONS = [
  "categories",
  "custom_fields",
  "products",
  "purchase_records",
  "purchase_record_field_values",
]

migrate((app) => {
  // 一般資料表：已登入就能 List / View / Create / Update / Delete
  for (const name of DATA_COLLECTIONS) {
    const c = app.findCollectionByNameOrId(name)
    c.listRule = LOGGED_IN
    c.viewRule = LOGGED_IN
    c.createRule = LOGGED_IN
    c.updateRule = LOGGED_IN
    c.deleteRule = LOGGED_IN
    app.save(c)
  }

  // users：已登入可以查看（用來顯示新增者名稱），新增 / 修改 / 刪除只限 superuser
  const users = app.findCollectionByNameOrId("users")
  users.listRule = LOGGED_IN
  users.viewRule = LOGGED_IN
  users.createRule = null // 關閉公開註冊
  users.updateRule = null
  users.deleteRule = null
  app.save(users)
}, (app) => {
  // 還原：一般資料表回到 Locked，users 回到 PocketBase 的預設值
  for (const name of DATA_COLLECTIONS) {
    const c = app.findCollectionByNameOrId(name)
    c.listRule = null
    c.viewRule = null
    c.createRule = null
    c.updateRule = null
    c.deleteRule = null
    app.save(c)
  }

  const users = app.findCollectionByNameOrId("users")
  users.listRule = "id = @request.auth.id"
  users.viewRule = "id = @request.auth.id"
  users.createRule = ""
  users.updateRule = "id = @request.auth.id"
  users.deleteRule = "id = @request.auth.id"
  app.save(users)
})
