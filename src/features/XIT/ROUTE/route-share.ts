import { snapDays } from '@src/features/XIT/ROUTE/route-calc';
import { checkSupply, parseStopSteps } from '@src/features/XIT/ROUTE/route-cargo';
import { repeatOriginKey, stopIdentity } from '@src/features/XIT/ROUTE/route-stops';
import type { WaitUnit } from '@src/features/XIT/RTACT/route-spec';

// The shareable JSON for one ROUTECONFIG route. Stops are natural ids (AI1, ZV-759c), so a
// route moves between players. Flight times and the game route id stay behind: they belong
// to one player's ship and game, and TRANSITS measures them again.
export const ROUTE_SHARE_FORMAT = 'rpr-route';
export const ROUTE_SHARE_VERSION = 1;

export interface RouteShareJson {
  format: typeof ROUTE_SHARE_FORMAT;
  version: typeof ROUTE_SHARE_VERSION;
  name: string;
  stops: RouteShareStop[];
  ship?: string;
  supplyDays?: number;
  loop: boolean;
  returnToOrigin?: boolean;
  wait?: { amount: number; unit: WaitUnit };
}

export interface RouteShareStop {
  kind: 'cx' | 'base';
  id: string;
  supply?: Record<string, number>;
  steps?: string[];
}

export type ImportedRoute = Omit<UserData.ShippingRoute, 'id'>;

export type RouteImportResult = { ok: true; route: ImportedRoute } | { ok: false; error: string };

const WAIT_UNITS: readonly WaitUnit[] = ['seconds', 'minutes', 'hours', 'days'];

export function exportRoute(route: UserData.ShippingRoute): RouteShareJson {
  const json: RouteShareJson = {
    format: ROUTE_SHARE_FORMAT,
    version: ROUTE_SHARE_VERSION,
    name: route.name,
    stops: route.stops.map(exportStop),
    loop: route.loop !== false,
  };
  if (route.ship !== undefined && route.ship.length > 0) {
    json.ship = route.ship;
  }
  if (route.days !== undefined) {
    json.supplyDays = route.days;
  }
  if (route.returnToOrigin !== undefined) {
    json.returnToOrigin = route.returnToOrigin;
  }
  if (route.wait !== undefined && route.wait.amount > 0) {
    json.wait = { amount: route.wait.amount, unit: route.wait.unit };
  }
  return json;
}

function exportStop(stop: UserData.ShippingRouteStop): RouteShareStop {
  const shared: RouteShareStop = { kind: stop.kind, id: stop.id };
  if (stop.supply !== undefined) {
    shared.supply = { ...stop.supply };
  }
  if (stop.steps !== undefined && stop.steps.length > 0) {
    shared.steps = [...stop.steps];
  }
  return shared;
}

export function importRoute(text: string): RouteImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'JSON 无效。' };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: '应为 JSON 对象。' };
  }
  const json = data as Record<string, unknown>;

  if (json.format !== undefined && json.format !== ROUTE_SHARE_FORMAT) {
    return { ok: false, error: `不是路线数据，format 必须为“${ROUTE_SHARE_FORMAT}").` };
  }
  if (json.version !== undefined) {
    if (typeof json.version !== 'number' || !Number.isInteger(json.version)) {
      return { ok: false, error: 'version 无效。' };
    }
    if (json.version > ROUTE_SHARE_VERSION) {
      return { ok: false, error: `路线版本 ${json.version} 高于此扩展支持的版本。` };
    }
  }

  let name = '导入的路线';
  if (json.name !== undefined) {
    if (typeof json.name !== 'string') {
      return { ok: false, error: 'name 无效。' };
    }
    if (json.name.trim().length > 0) {
      name = json.name.trim();
    }
  }

  const stops = importStops(json.stops);
  if (typeof stops === 'string') {
    return { ok: false, error: stops };
  }
  const route: ImportedRoute = { name, stops };

  if (json.ship !== undefined) {
    if (typeof json.ship !== 'string') {
      return { ok: false, error: 'ship 无效。' };
    }
    if (json.ship.trim().length > 0) {
      route.ship = json.ship.trim();
    }
  }
  if (json.supplyDays !== undefined) {
    if (typeof json.supplyDays !== 'number' || !(json.supplyDays >= 0)) {
      return { ok: false, error: 'supplyDays 无效，应为不小于 0 的数值。' };
    }
    route.days = snapDays(json.supplyDays);
  }
  if (json.loop !== undefined) {
    if (typeof json.loop !== 'boolean') {
      return { ok: false, error: 'loop 无效，应为 true 或 false。' };
    }
    route.loop = json.loop;
  }
  if (json.returnToOrigin !== undefined) {
    if (typeof json.returnToOrigin !== 'boolean') {
      return { ok: false, error: 'returnToOrigin 无效，应为 true 或 false。' };
    }
    route.returnToOrigin = json.returnToOrigin;
  }
  if (json.wait !== undefined) {
    const wait = importWait(json.wait);
    if (typeof wait === 'string') {
      return { ok: false, error: wait };
    }
    route.wait = wait;
  }
  return { ok: true, route };
}

function importStops(value: unknown): UserData.ShippingRouteStop[] | string {
  if (!Array.isArray(value) || value.length === 0) {
    return 'Invalid stops (expected a list of {"kind": "cx" | "base", "id": ...}).';
  }
  const stops: UserData.ShippingRouteStop[] = [];
  for (let i = 0; i < value.length; i++) {
    const entry = value[i] as Record<string, unknown> | null;
    const kind = typeof entry === 'object' && entry !== null ? entry.kind : undefined;
    const rawId = typeof entry === 'object' && entry !== null ? entry.id : undefined;
    if ((kind !== 'cx' && kind !== 'base') || typeof rawId !== 'string') {
      return `站点无效：${i + 1} (expected {"kind": "cx" | "base", "id": ...}).`;
    }
    const trimmed = rawId.trim();
    if (trimmed.length === 0) {
      return `站点无效：${i + 1}（ID 为空）。`;
    }
    // Exchange codes are upper case. Planet ids keep their case (ZV-759c).
    const id = kind === 'cx' ? trimmed.toUpperCase() : trimmed;
    const stop: UserData.ShippingRouteStop = { kind, id };
    const cargo = importStopCargo(entry as Record<string, unknown>, stop, i + 1);
    if (cargo !== undefined) {
      return cargo;
    }
    const origin = stops[0];
    if (stops.some(x => stopIdentity(x) === stopIdentity(stop))) {
      if (origin === undefined || stopIdentity(origin) !== stopIdentity(stop)) {
        return `站点 ${i + 1} (${id}）已在路线中，只有首站可以重复。`;
      }
      stop.key = repeatOriginKey(stop);
    }
    stops.push(stop);
  }
  return stops;
}

// Fills the stop's supply and steps. Returns an error, or undefined when they are fine.
function importStopCargo(
  entry: Record<string, unknown>,
  stop: UserData.ShippingRouteStop,
  place: number,
) {
  if (entry.supply !== undefined) {
    if (stop.kind !== 'base') {
      return `站点 ${place} (${stop.id}）：supply 仅适用于基地，交易所请使用 steps。`;
    }
    const supply = checkSupply(entry.supply);
    if (!supply.ok) {
      return `站点 ${place} (${stop.id}): ${supply.error}.`;
    }
    stop.supply = supply.supply;
  }
  if (entry.steps !== undefined) {
    if (!Array.isArray(entry.steps) || entry.steps.some(x => typeof x !== 'string')) {
      return `站点 ${place} (${stop.id}）：steps 应为字符串列表。`;
    }
    const lines = (entry.steps as string[]).map(x => x.trim()).filter(x => x.length > 0);
    const parsed = parseStopSteps(lines);
    if (!parsed.ok) {
      return `站点 ${place} (${stop.id}): ${parsed.error}.`;
    }
    if (lines.length > 0) {
      stop.steps = lines;
    }
  }
  return undefined;
}

function importWait(value: unknown): UserData.ShippingRoute['wait'] | string {
  const error = 'Invalid wait (expected {"amount": 3, "unit": "days"}).';
  if (typeof value !== 'object' || value === null) {
    return error;
  }
  const { amount, unit } = value as Record<string, unknown>;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    return error;
  }
  if (!WAIT_UNITS.includes(unit as WaitUnit)) {
    return error;
  }
  return amount > 0 ? { amount, unit: unit as WaitUnit } : undefined;
}
