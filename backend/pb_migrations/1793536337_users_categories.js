/// <reference path="../pb_data/types.d.ts" />

// task 1.2：設定 users（Auth）與建立 categories（Base）
// 規格：design.md「各 Collection 欄位定義」users / categories
// API Rules 統一在 task 1.7 設定，這裡不動。

migrate((app) => {
  // ---- users ----
  // PocketBase 0.23+ 第一次啟動就會自動建立 users，所以這裡是「修改」而不是「新建」。
  const users = app.findCollectionByNameOrId("users")

  // name：顯示名稱，改為必填
  users.fields.getByName("name").required = true

  // 只允許 email + 密碼登入（0.23+ 沒有 username 欄位，登入識別欄位只留 email）
  users.passwordAuth.enabled = true
  users.passwordAuth.identityFields = ["email"]

  // 不開啟 OAuth2
  users.oauth2.enabled = false

  // 不要求 email 驗證：authRule 空字串 = 未驗證的帳號也能登入
  users.authRule = ""

  app.save(users)

  // ---- categories ----
  const categories = new Collection({
    type: "base",
    name: "categories",
    fields: [
      {
        type: "text",
        name: "name",
        required: true,
        max: 100,
      },
      // created / updated 時間戳（0.23+ 不會自動加，要自己宣告）
      { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
    ],
    // PocketBase 的 text 欄位沒有 unique 選項，用 UNIQUE INDEX 達成
    indexes: [
      "CREATE UNIQUE INDEX `idx_categories_name` ON `categories` (`name`)",
    ],
  })

  app.save(categories)
}, (app) => {
  // ---- 還原（migrate down）----
  const categories = app.findCollectionByNameOrId("categories")
  app.delete(categories)

  const users = app.findCollectionByNameOrId("users")
  users.fields.getByName("name").required = false
  app.save(users)
})
