import { describe, expect, it } from 'vitest';
import { exportRoute, importRoute } from '@src/features/XIT/ROUTE/route-share';
import { repeatOriginKey, stopInstanceKey } from '@src/features/XIT/ROUTE/route-stops';

const origin = { kind: 'cx' as const, id: 'AI1' };
const deimos = { kind: 'base' as const, id: 'ZV-759c' };
const phobos = { kind: 'base' as const, id: 'ZV-307d' };

function saved(): UserData.ShippingRoute {
  return {
    id: 'route-id',
    name: 'Route 1',
    stops: [origin, deimos, { ...origin, key: repeatOriginKey(origin) }, phobos],
    ship: 'AVI-00090',
    days: 7.5,
    loop: false,
    returnToOrigin: true,
    legs: [{ ok: true, seconds: 3600, fuelUsage: 0.05 }],
    rtId: 'RT-ZGIX-5381',
    legsAfterRt: true,
    wait: { amount: 3, unit: 'days' },
  };
}

describe('route export', () => {
  it('keeps the plan and leaves the flight times and game route behind', () => {
    expect(exportRoute(saved())).toEqual({
      format: 'rpr-route',
      version: 1,
      name: 'Route 1',
      stops: [origin, deimos, origin, phobos],
      ship: 'AVI-00090',
      supplyDays: 7.5,
      loop: false,
      returnToOrigin: true,
      wait: { amount: 3, unit: 'days' },
    });
  });

  it('writes an absent loop as a loop', () => {
    expect(exportRoute({ id: 'x', name: 'R', stops: [origin] }).loop).toBe(true);
  });
});

describe('route import', () => {
  it('round-trips an export, with a fresh key on each repeated origin', () => {
    const result = importRoute(JSON.stringify(exportRoute(saved())));
    if (!result.ok) {
      throw new Error(result.error);
    }
    const { stops, ...rest } = result.route;
    expect(rest).toEqual({
      name: 'Route 1',
      ship: 'AVI-00090',
      days: 7.5,
      loop: false,
      returnToOrigin: true,
      wait: { amount: 3, unit: 'days' },
    });
    expect(stops.map(stop => stop.id)).toEqual(['AI1', 'ZV-759c', 'AI1', 'ZV-307d']);
    expect(stops[0]?.key).toBeUndefined();
    expect(stops[2]?.key?.startsWith('cx:AI1#')).toBe(true);
    expect(new Set(stops.map(stopInstanceKey)).size).toBe(4);
  });

  it('takes a hand-written route with only stops', () => {
    const result = importRoute(
      '{"stops":[{"kind":"cx","id":" ai1 "},{"kind":"base","id":"ZV-759c"}]}',
    );
    expect(result).toEqual({
      ok: true,
      route: { name: '导入的路线', stops: [origin, deimos] },
    });
  });

  it('refuses a stop that repeats when it is not the origin', () => {
    const result = importRoute(JSON.stringify({ stops: [origin, deimos, phobos, deimos] }));
    expect(result).toEqual({
      ok: false,
      error: '站点 4（ZV-759c）已在路线中，只有首站可以重复。',
    });
  });

  it('drops a zero wait and snaps supply days to the route step', () => {
    const result = importRoute(
      JSON.stringify({ stops: [origin], supplyDays: 2.26, wait: { amount: 0, unit: 'hours' } }),
    );
    expect(result).toEqual({
      ok: true,
      route: { name: '导入的路线', stops: [origin], days: 2.3 },
    });
  });

  it('carries a set delivery and stop steps both ways', () => {
    const route = saved();
    route.stops[1] = { ...deimos, supply: { RAT: 120 }, steps: ['unload ALO all all'] };
    route.stops[3] = { ...phobos, supply: {} };
    const json = exportRoute(route);
    expect(json.stops[1]).toEqual({
      ...deimos,
      supply: { RAT: 120 },
      steps: ['unload ALO all all'],
    });
    expect(json.stops[3]).toEqual({ ...phobos, supply: {} });
    const result = importRoute(JSON.stringify(json));
    if (!result.ok) {
      throw new Error(result.error);
    }
    expect(result.route.stops[1]).toEqual(json.stops[1]);
    expect(result.route.stops[3]).toEqual(json.stops[3]);
  });

  it.each([
    [
      '{"stops":[{"kind":"cx","id":"AI1","supply":{"RAT":5}}]}',
      '站点 1（AI1）：supply 仅适用于基地，交易所请使用 steps。',
    ],
    [
      '{"stops":[{"kind":"base","id":"ZV-759c","supply":{"RAT":1.5}}]}',
      '站点 1（ZV-759c）：RAT 数量必须为不小于 0 的整数。',
    ],
    [
      '{"stops":[{"kind":"cx","id":"AI1","steps":"load RAT 1 1"}]}',
      '站点 1（AI1）：steps 应为字符串列表。',
    ],
    [
      '{"stops":[{"kind":"cx","id":"AI1","steps":["load RAT 1 1","fly home"]}]}',
      '站点 1（AI1）：步骤 2（fly home）：未知步骤“fly”。',
    ],
    ['not json', 'JSON 无效。'],
    ['[]', '应为 JSON 对象。'],
    ['{"format":"contract","stops":[]}', '不是路线数据，format 必须为“rpr-route”。'],
    ['{"version":2,"stops":[]}', '路线版本 2 高于此扩展支持的版本。'],
    ['{"stops":[]}', 'stops 无效，应为 {"kind": "cx" | "base", "id": ...} 对象的列表。'],
    [
      '{"stops":[{"kind":"ship","id":"AI1"}]}',
      '站点无效：1（应为 {"kind": "cx" | "base", "id": ...}）。',
    ],
    ['{"stops":[{"kind":"cx","id":"  "}]}', '站点无效：1（ID 为空）。'],
    ['{"stops":[{"kind":"cx","id":"AI1"}],"loop":"yes"}', 'loop 无效，应为 true 或 false。'],
    [
      '{"stops":[{"kind":"cx","id":"AI1"}],"supplyDays":-1}',
      'supplyDays 无效，应为不小于 0 的数值。',
    ],
    [
      '{"stops":[{"kind":"cx","id":"AI1"}],"wait":{"amount":3,"unit":"weeks"}}',
      'wait 无效，应为 {"amount": 3, "unit": "days"}。',
    ],
  ])('rejects %s', (text, error) => {
    expect(importRoute(text)).toEqual({ ok: false, error });
  });
});
