// PocketBase 資料表的型別（task 2.5）
// 對應 backend/pb_migrations 建立的欄位，名稱與 PocketBase 回傳的 JSON 一致。
//
// 注意：這是「資料庫原始值」。PocketBase 的 number 存不了 null（沒填 = 0）、
// date 沒填 = ''，轉成「null = 未設定」的規則見 design.md
// 「PocketBase 的 required 與 null 語意」，在各 store 讀取時轉換（task 7.1、8.1）。
import type { RecordModel } from 'pocketbase';

export interface UserRecord extends RecordModel {
  email: string;
  name: string;
  verified: boolean;
}

export interface CategoryRecord extends RecordModel {
  name: string;
}

export type CustomFieldType = 'number' | 'text';

export interface CustomFieldRecord extends RecordModel {
  category: string; // categories.id
  field_name: string;
  field_type: CustomFieldType;
  is_quantity_component: boolean;
  display_order: number;
}

export type ConsumptionPeriod = 'monthly' | 'weekly' | '';

export interface ProductRecord extends RecordModel {
  category: string; // categories.id
  brand: string;
  name: string;
  unit: string; // 計價單位
  consumption_unit: string; // 消耗單位，'' = 未設定
  consumption_rate: number; // 0 = 未設定
  consumption_period: ConsumptionPeriod;
  remaining_quantity: number; // remaining_updated_at 為 '' 時視為未設定
  remaining_updated_at: string; // '' = 剩餘數量未設定
  consumption_note: string;
}

export interface PurchaseRecordRecord extends RecordModel {
  product: string; // products.id
  purchase_date: string;
  store: string;
  total_price: number;
  quantity: number; // 0 = 缺失
  unit_price: number; // quantity 為 0 時無意義
  user: string; // users.id
}

export interface FieldValueRecord extends RecordModel {
  purchase_record: string; // purchase_records.id
  custom_field: string; // custom_fields.id
  field_value: string;
}
