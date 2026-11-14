import { describe, expect, it } from 'vitest';
import { parseMaterials, parsePaste } from './paste-parse';

const known = ['RAT', 'DW', 'OVE', 'FEO'];
const resolveTicker = (ticker: string) => known.find(x => x === ticker.toUpperCase());

describe('parsePaste', () => {
  it('reads a tab-separated paste with prices', () => {
    const result = parsePaste('RAT\t100\t530\nDW\t50\t62.5', resolveTicker);
    expect(result.errors).toEqual([]);
    expect(result.delimiter).toBe('\t');
    expect(result.rows).toEqual([
      { ticker: 'RAT', amount: 100, price: 530 },
      { ticker: 'DW', amount: 50, price: 62.5 },
    ]);
  });

  it('accepts rows with and without a price in either order', () => {
    const pricedFirst = parsePaste('DW,50,62.5\nRAT,100', resolveTicker);
    expect(pricedFirst.errors).toEqual([]);
    expect(pricedFirst.rows).toEqual([
      { ticker: 'DW', amount: 50, price: 62.5 },
      { ticker: 'RAT', amount: 100 },
    ]);

    const unpricedFirst = parsePaste('RAT,100\nDW,50,62.5', resolveTicker);
    expect(unpricedFirst.errors).toEqual([]);
    expect(unpricedFirst.rows).toEqual([
      { ticker: 'RAT', amount: 100 },
      { ticker: 'DW', amount: 50, price: 62.5 },
    ]);
  });

  it('reports the failing row instead of discarding the paste', () => {
    const result = parsePaste('RAT,100\nXYZ,50\nDW,25', resolveTicker);
    expect(result.rows).toEqual([
      { ticker: 'RAT', amount: 100 },
      { ticker: 'DW', amount: 25 },
    ]);
    expect(result.errors).toEqual([{ line: 2, reason: '未知材料代码“XYZ”' }]);
  });

  it('numbers rows by their position in the paste, blank rows included', () => {
    const result = parsePaste('RAT,100\n\n\nXYZ,50', resolveTicker);
    expect(result.errors.map(x => x.line)).toEqual([4]);
  });

  it('reads a quoted thousands separator inside a tab-separated paste', () => {
    const result = parsePaste('RAT\t"1,600"\t530', resolveTicker);
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([{ ticker: 'RAT', amount: 1600, price: 530 }]);
  });

  it('reads semicolon-separated rows with comma decimals', () => {
    const result = parsePaste('RAT;100;62,5', resolveTicker);
    expect(result.errors).toEqual([]);
    expect(result.delimiter).toBe(';');
    expect(result.rows).toEqual([{ ticker: 'RAT', amount: 100, price: 62.5 }]);
  });

  it('reads a paste that uses bare carriage returns', () => {
    const result = parsePaste('RAT,100\rDW,50', resolveTicker);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(2);
  });

  it('rejects a price with more than three significant figures', () => {
    const result = parsePaste('RAT,100,45.67', resolveTicker);
    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([
      {
        line: 1,
        reason: '价格“45.67”超过 3 位有效数字（请使用 45.7）',
      },
    ]);
  });

  it('accepts prices whose extra digits are non-significant zeros', () => {
    const result = parsePaste('RAT,100,530\nDW,50,123000000', resolveTicker);
    expect(result.errors).toEqual([]);
    expect(result.rows.map(x => x.price)).toEqual([530, 123000000]);
  });

  it('reads a grouped quantity but refuses a grouped price', () => {
    // "1,600" is 1600 as a quantity — 1.6 is not a whole number — but as a
    // price both readings are legal and the player has to disambiguate.
    const quantity = parsePaste('RAT\t1,600', resolveTicker);
    expect(quantity.errors).toEqual([]);
    expect(quantity.rows).toEqual([{ ticker: 'RAT', amount: 1600 }]);

    const price = parsePaste('RAT\t100\t1,600', resolveTicker);
    expect(price.errors).toEqual([
      { line: 1, reason: '价格“1,600”的分隔符有歧义，请去除分组符号' },
    ]);
  });

  it('rejects a price with more than two decimal places', () => {
    const result = parsePaste('RAT,100,0.125', resolveTicker);
    expect(result.errors).toEqual([{ line: 1, reason: '价格“0.125”超过两位小数' }]);
  });

  it('rejects a fractional quantity', () => {
    const result = parsePaste('RAT,10.5', resolveTicker);
    expect(result.errors).toEqual([{ line: 1, reason: '数量“10.5”不是整数' }]);
  });

  it('rejects two different prices for one ticker but allows a repeated one', () => {
    const conflicting = parsePaste('RAT,100,530\nRAT,50,540', resolveTicker);
    expect(conflicting.rows).toHaveLength(1);
    expect(conflicting.errors).toEqual([{ line: 2, reason: '价格冲突：RAT；行 1 使用了 530' }]);

    const repeated = parsePaste('RAT,100,530\nRAT,50,530', resolveTicker);
    expect(repeated.errors).toEqual([]);
    expect(repeated.rows).toHaveLength(2);
  });

  it('fails the whole paste when rows use different delimiters', () => {
    const result = parsePaste('RAT,100\nDW;50', resolveTicker);
    expect(result.fatal).toBe('粘贴内容混用了 逗号分隔 和 分号分隔 行，请统一使用同一种分隔符。');
    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('rejects a row that is not two or three fields', () => {
    const result = parsePaste('RAT\nDW,50,530,999', resolveTicker);
    expect(result.errors).toEqual([
      { line: 1, reason: '应为材料代码、数量和可选价格，实际为 1 列' },
      { line: 2, reason: '应为材料代码、数量和可选价格，实际为 4 列' },
    ]);
  });
});

describe('parseMaterials', () => {
  it('sums repeated tickers and keeps their price', () => {
    const result = parseMaterials('RAT,100,530\nRAT,50,530\nDW,25', resolveTicker);
    expect(result).toEqual({
      materials: { RAT: 150, DW: 25 },
      prices: { RAT: 530 },
    });
  });

  it('omits prices entirely when no row carries one', () => {
    expect(parseMaterials('RAT,100', resolveTicker)).toEqual({
      materials: { RAT: 100 },
      prices: undefined,
    });
  });

  it('returns undefined when any row failed, so a partial bill never runs', () => {
    expect(parseMaterials('RAT,100\nXYZ,50', resolveTicker)).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    expect(parseMaterials('', resolveTicker)).toBeUndefined();
    expect(parseMaterials(undefined, resolveTicker)).toBeUndefined();
  });
});
