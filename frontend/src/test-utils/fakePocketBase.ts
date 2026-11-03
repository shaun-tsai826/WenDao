// 測試用：記憶體裡的假 PocketBase（task 6.1 起，各 store 測試共用）
//
// 用法：
//   const fake = installFakePocketBase({ categories: [{ id: 'c1', name: '衛生紙' }] });
//   ...呼叫 store...
//   expect(fake.rows('categories')).toHaveLength(2);
//
// 模擬的範圍只到 store 會用到的部分：
// - getFullList / getList（filter 支援 `欄位 運算子 "值"`，運算子 = != >= <= > <，用 && 串接；
//   欄位可沿著關聯往下找，例如 `product.category`（task 8.1）；sort 支援逗號分隔欄位，- 表示反向）
// - create / update / delete
// - 資料庫規則：unique 欄位重複 → 400 validation_not_unique；被 Restrict 關聯的資料不能刪 → 400；
//   Cascade 關聯的資料跟著刪除（task 8.1）
// - fake.failNext(status, where?)：下一次（符合條件的）呼叫丟出錯誤；where.data 可指定欄位錯誤（例如 UNIQUE）
//   status 0 = 連不上伺服器、500 = 伺服器錯誤、400 = 被資料庫拒絕
import { vi } from 'vitest';
import { ClientResponseError, type RecordService } from 'pocketbase';
import pb from '@/lib/pocketbase';

type Row = Record<string, unknown> & { id: string };
type Tables = Record<string, Row[]>;
type Method = 'getFullList' | 'getList' | 'create' | 'update' | 'delete';
type ListOptions = { filter?: string; sort?: string };

/** 每張表的 unique 欄位組合（與 migrations 一致） */
const UNIQUE: Record<string, string[][]> = {
  categories: [['name']],
  custom_fields: [['category', 'field_name']],
  products: [['category', 'brand', 'name']],
  purchase_record_field_values: [['purchase_record', 'custom_field']],
};

/** Restrict 關聯：刪除某表的資料前，檢查「參照它的表.欄位」 */
const RESTRICT: Record<string, [string, string][]> = {
  categories: [['products', 'category']],
  products: [['purchase_records', 'product']],
  custom_fields: [['purchase_record_field_values', 'custom_field']],
  users: [['purchase_records', 'user']],
};

/** Cascade 關聯：刪除某表的資料時，連帶刪除「參照它的表.欄位」（與 migrations 的 cascadeDelete 一致） */
const CASCADE: Record<string, [string, string][]> = {
  categories: [['custom_fields', 'category']],
  purchase_records: [['purchase_record_field_values', 'purchase_record']],
};

/** 關聯欄位 → 它指向的表（filter 的 `product.category` 用來往下找） */
const RELATION_TABLE: Record<string, string> = {
  product: 'products',
  category: 'categories',
  user: 'users',
  purchase_record: 'purchase_records',
  custom_field: 'custom_fields',
};

/** 欄位值轉成文字比較（字串原樣，其他型別用 JSON） */
const toText = (v: unknown): string => (typeof v === 'string' ? v : JSON.stringify(v ?? ''));

/** 比較兩個文字（PocketBase 對日期字串也是這樣比：'YYYY-MM-DD HH:mm:ss.sssZ' 的字典順序 = 時間順序） */
const COMPARE: Record<string, (a: string, b: string) => boolean> = {
  '=': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
};

/**
 * @param lookup 依「表名 + id」找一筆資料，用來解析 `product.category` 這種關聯欄位
 */
function parseFilter(
  filter: string | undefined,
  lookup: (table: string, id: unknown) => Row | undefined,
): (row: Row) => boolean {
  if (!filter) return () => true;
  const conditions = filter.split('&&').map((part) => {
    const m = /^([\w.]+)\s*(!=|>=|<=|=|>|<)\s*"((?:\\.|[^"\\])*)"$/.exec(part.trim());
    if (!m) throw new Error(`fakePocketBase 不支援這個 filter：${part}`);
    const path = m[1]!.split('.');
    const compare = COMPARE[m[2]!]!;
    const value = m[3]!.replace(/\\(.)/g, '$1');
    return (row: Row) => {
      // 沿著關聯往下找：product.category → 先找 products 裡的那筆商品，再取它的 category
      let current: Row | undefined = row;
      for (const field of path.slice(0, -1)) {
        const target = RELATION_TABLE[field];
        if (!target) throw new Error(`fakePocketBase 不認得關聯欄位：${field}`);
        current = lookup(target, current?.[field]);
      }
      return current !== undefined && compare(toText(current[path.at(-1)!]), value);
    };
  });
  return (row) => conditions.every((c) => c(row));
}

function sortRows(rows: Row[], sort: string | undefined): Row[] {
  if (!sort) return rows;
  const keys = sort.split(',').map((k) => ({
    field: k.replace(/^-/, ''),
    dir: k.startsWith('-') ? -1 : 1,
  }));
  return [...rows].sort((a, b) => {
    for (const { field, dir } of keys) {
      const x = toText(a[field]);
      const y = toText(b[field]);
      if (x !== y) return x < y ? -dir : dir;
    }
    return 0;
  });
}

const httpError = (status: number, data: Record<string, unknown> = {}) =>
  new ClientResponseError({ status, response: { status, data } });

export function installFakePocketBase(initial: Partial<Tables> = {}) {
  const tables: Tables = {};
  let seq = 0;
  let clock = 0;
  const failures: {
    status: number;
    collection?: string;
    method?: Method;
    data?: Record<string, unknown>;
  }[] = [];
  const calls: { collection: string; method: Method; args: unknown[] }[] = [];

  const table = (name: string) => (tables[name] ??= []);
  const lookup = (name: string, id: unknown) => table(name).find((r) => r.id === id);
  const stamp = () => `2026-11-02 00:00:${String(clock++).padStart(2, '0')}.000Z`;
  for (const [name, rows] of Object.entries(initial)) {
    tables[name] = (rows ?? []).map((r) => ({ created: stamp(), ...r }));
  }

  function checkUnique(name: string, row: Row) {
    for (const fields of UNIQUE[name] ?? []) {
      const clash = table(name).some(
        (other) => other.id !== row.id && fields.every((f) => other[f] === row[f]),
      );
      if (clash) {
        throw httpError(
          400,
          Object.fromEntries(fields.map((f) => [f, { code: 'validation_not_unique' }])),
        );
      }
    }
  }

  /** 記錄呼叫、套用 failNext，並把同步結果包成 Promise（和真的 SDK 一樣是非同步） */
  function call<T>(collection: string, method: Method, args: unknown[], run: () => T): Promise<T> {
    calls.push({ collection, method, args });
    const i = failures.findIndex(
      (f) => (!f.collection || f.collection === collection) && (!f.method || f.method === method),
    );
    if (i >= 0) {
      const [failure] = failures.splice(i, 1);
      return Promise.reject(httpError(failure!.status, failure!.data));
    }
    try {
      return Promise.resolve(run());
    } catch (err) {
      return Promise.reject(err instanceof Error ? err : new Error(String(err)));
    }
  }

  function service(name: string) {
    return {
      getFullList: vi.fn((options: ListOptions = {}) =>
        call(name, 'getFullList', [options], () =>
          sortRows(table(name).filter(parseFilter(options.filter, lookup)), options.sort).map(
            (r) => ({
              ...r,
            }),
          ),
        ),
      ),
      getList: vi.fn((page: number, perPage: number, options: ListOptions = {}) =>
        call(name, 'getList', [page, perPage, options], () => {
          const all = sortRows(
            table(name).filter(parseFilter(options.filter, lookup)),
            options.sort,
          );
          const items = all.slice((page - 1) * perPage, page * perPage).map((r) => ({ ...r }));
          return {
            page,
            perPage,
            totalItems: all.length,
            totalPages: Math.ceil(all.length / perPage),
            items,
          };
        }),
      ),
      create: vi.fn((data: Record<string, unknown>) =>
        call(name, 'create', [data], () => {
          const row: Row = { ...data, id: `new${++seq}`, created: stamp() };
          checkUnique(name, row);
          table(name).push(row);
          return { ...row };
        }),
      ),
      update: vi.fn((id: string, data: Record<string, unknown>) =>
        call(name, 'update', [id, data], () => {
          const row = table(name).find((r) => r.id === id);
          if (!row) throw httpError(404);
          const next = { ...row, ...data, id };
          checkUnique(name, next);
          Object.assign(row, next);
          return { ...row };
        }),
      ),
      delete: vi.fn((id: string) =>
        call(name, 'delete', [id], () => {
          const index = table(name).findIndex((r) => r.id === id);
          if (index < 0) throw httpError(404);
          for (const [refTable, refField] of RESTRICT[name] ?? []) {
            if (table(refTable).some((r) => r[refField] === id)) throw httpError(400);
          }
          table(name).splice(index, 1);
          for (const [refTable, refField] of CASCADE[name] ?? []) {
            tables[refTable] = table(refTable).filter((r) => r[refField] !== id);
          }
          return true;
        }),
      ),
    };
  }

  const services = new Map<string, ReturnType<typeof service>>();
  vi.spyOn(pb, 'collection').mockImplementation((name: string) => {
    if (!services.has(name)) services.set(name, service(name));
    return services.get(name) as unknown as RecordService;
  });

  return {
    /** 某張表目前的資料（複本） */
    rows: (name: string) => table(name).map((r) => ({ ...r })),
    /** 直接放入資料（模擬另一個人在別的手機上操作） */
    insert: (name: string, row: Row) => table(name).push({ created: stamp(), ...row }),
    /** 下一次（符合條件的）呼叫丟出錯誤 */
    failNext: (
      status: number,
      where: { collection?: string; method?: Method; data?: Record<string, unknown> } = {},
    ) => failures.push({ status, ...where }),
    /** 所有呼叫紀錄 */
    calls,
  };
}
