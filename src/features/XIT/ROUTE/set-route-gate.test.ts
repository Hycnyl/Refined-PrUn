import { describe, expect, it } from 'vitest';
import { setRouteBlock, type SetRouteGateInput } from '@src/features/XIT/ROUTE/set-route-gate';

function ready(patch: Partial<SetRouteGateInput> = {}): SetRouteGateInput {
  return {
    shipChosen: true,
    stopCount: 2,
    billReady: true,
    legs: [{ ok: true }],
    supplyDays: 1,
    hasOverflow: false,
    inputOverloaded: false,
    ...patch,
  };
}

describe('setRouteBlock', () => {
  it('arms the button when transits, days, and loads all pass', () => {
    expect(setRouteBlock(ready())).toBeUndefined();
  });

  it('stays blocked until every recorded leg succeeded', () => {
    expect(setRouteBlock(ready({ legs: undefined }))).toBe('请先运行 TRANSITS。');
    expect(setRouteBlock(ready({ legs: [] }))).toBe('请先运行 TRANSITS。');
    expect(setRouteBlock(ready({ legs: [{ ok: true }, { ok: false }] }))).toBe(
      '请先运行 TRANSITS。',
    );
  });

  it('stays blocked until supply days is a positive finite number', () => {
    expect(setRouteBlock(ready({ supplyDays: 0 }))).toBe('请设置补给天数。');
    expect(setRouteBlock(ready({ supplyDays: Number.NaN }))).toBe('请设置补给天数。');
    expect(setRouteBlock(ready({ supplyDays: Number.POSITIVE_INFINITY }))).toBe('请设置补给天数。');
  });

  it('stays blocked while a stop is overloaded', () => {
    expect(setRouteBlock(ready({ hasOverflow: true }))).toBe('请处理超载的站点。');
    expect(setRouteBlock(ready({ inputOverloaded: true }))).toBe('请处理超载的站点。');
  });
});
