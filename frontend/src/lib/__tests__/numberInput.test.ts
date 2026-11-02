// 數字輸入欄位（task 7.6）：輸入時整理成「數字＋小數點」，送出前轉成數字
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseDecimal, sanitizeDecimal } from '@/lib/numberInput';

describe('sanitizeDecimal：輸入時整理', () => {
  it.each([
    ['2', '2'],
    ['0.5', '0.5'],
    ['１２．５', '12.5'], // 全形數字與句點（注音鍵盤）
    ['abc3', '3'],
    ['1.2.3', '1.23'], // 只保留第一個小數點
    ['12 包', '12'],
    ['', ''],
  ])('「%s」→「%s」', (raw, clean) => expect(sanitizeDecimal(raw)).toBe(clean));

  it('預設去掉負號；allowNegative 時只保留開頭的負號（BDD：輸入 -5 要能看到 ERR-015）', () => {
    expect(sanitizeDecimal('-5')).toBe('5');
    expect(sanitizeDecimal('-5', { allowNegative: true })).toBe('-5');
    expect(sanitizeDecimal('5-', { allowNegative: true })).toBe('5');
    expect(sanitizeDecimal('－５', { allowNegative: true })).toBe('-5'); // 全形負號
  });

  it('屬性：整理後只剩數字、最多一個小數點，再整理一次結果不變', () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        const clean = sanitizeDecimal(raw);
        expect(clean).toMatch(/^\d*\.?\d*$/);
        expect(sanitizeDecimal(clean)).toBe(clean);
      }),
    );
  });
});

describe('parseDecimal：送出前轉成數字', () => {
  it.each([
    ['2', 2],
    ['0.5', 0.5],
    ['.5', 0.5],
    ['5.', 5],
    ['-5', -5],
    ['0', 0],
  ])('「%s」→ %s', (text, n) => expect(parseDecimal(text)).toBe(n));

  it.each(['', '  ', '.', '-', '-.'])('「%s」→ null（沒有填）', (text) =>
    expect(parseDecimal(text)).toBeNull(),
  );
});
