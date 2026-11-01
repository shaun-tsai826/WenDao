// 訊息常數（task 2.7）：逐字比對 design.md 訊息表與 requirements.md
// 規格文字一改，這個測試就會失敗，提醒同步更新 messages.ts。
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MSG, ERR, CONFIRM, STATUS } from '@/constants/messages';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const design = read('../../../../.kiro/specs/home-erp/design.md');
const requirements = read('../../../../.kiro/specs/home-erp/requirements.md');
const source = read('../messages.ts');

// design.md 表格列：| MSG-001 | 文字 | 情境 | 對應需求 |
const specRows = [
  ...design.matchAll(/^\| ((?:MSG|ERR|CONFIRM|STATUS)-\d{3}) \| ([^|]+) \| [^|]+ \| ([^|]+) \|/gm),
].map((m) => ({ id: m[1]!, text: m[2]!.trim(), req: m[3]!.trim() }));

// messages.ts 每一行：xxx: '文字', // MSG-001 · ...
const codeById = new Map(
  [...source.matchAll(/: '([^']+)', \/\/ ((?:MSG|ERR|CONFIRM|STATUS)-\d{3})/g)].map((m) => [
    m[2]!,
    m[1]!,
  ]),
);

describe('訊息常數', () => {
  it('數量與規格一致：MSG 10、ERR 19、CONFIRM 2、STATUS 8', () => {
    expect(Object.keys(MSG)).toHaveLength(10);
    expect(Object.keys(ERR)).toHaveLength(19);
    expect(Object.keys(CONFIRM)).toHaveLength(2);
    expect(Object.keys(STATUS)).toHaveLength(8);
    expect(specRows).toHaveLength(39);
  });

  it.each(specRows)('$id 與 design.md 一字不差：「$text」', ({ id, text }) => {
    expect(codeById.get(id)).toBe(text);
  });

  it.each(specRows.filter((r) => r.req.startsWith('REQ') && !r.req.includes('設計補充')))(
    '$id「$text」出現在 requirements.md（$req）',
    ({ text }) => {
      expect(requirements).toContain(text);
    },
  );

  it('沒有重複的文字', () => {
    const all = [MSG, ERR, CONFIRM, STATUS].flatMap((o) => Object.values(o));
    expect(new Set(all).size).toBe(all.length);
  });
});
