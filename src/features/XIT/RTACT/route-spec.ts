import { localizeLabel } from '@src/infrastructure/i18n/labels';
export type WaitUnit = 'seconds' | 'minutes' | 'hours' | 'days';

export interface UnitsLimit {
  mode: 'units';
  amount: number;
}

export interface CapacityLimit {
  mode: 'capacity';
}

export interface AllCarriedLimit {
  mode: 'all';
}

export type LoadLimit = UnitsLimit | CapacityLimit;
export type UnloadLimit = UnitsLimit | AllCarriedLimit;
export type RefuelLimit = UnitsLimit | CapacityLimit;

export interface LoadStep {
  kind: 'load';
  ticker: string;
  min: LoadLimit;
  max: LoadLimit;
  // The game's Retain units: left at the location, everything above it is loaded.
  retain?: number;
}

export interface UnloadStep {
  kind: 'unload';
  ticker: string;
  min: UnloadLimit;
  max: UnloadLimit;
}

export interface WaitStep {
  kind: 'wait';
  amount: number;
  unit: WaitUnit;
}

export interface RefuelStep {
  kind: 'refuel';
  tank: 'STL' | 'FTL';
  source: 'ship' | 'local';
  min: RefuelLimit;
  max: RefuelLimit;
}

// The game's Load shipment and Unload shipment steps. They have no editor: the game adds
// them filled in, for every contract shipment bound for a later waypoint / for this one.
export interface ShipmentStep {
  kind: 'load-shipment' | 'unload-shipment';
}

// Steps the game opens an editor for after they are added.
export type EditableStep = LoadStep | UnloadStep | WaitStep | RefuelStep;

export type RouteStep = EditableStep | ShipmentStep;

export function isShipmentStep(step: RouteStep): step is ShipmentStep {
  return step.kind === 'load-shipment' || step.kind === 'unload-shipment';
}

export interface RouteStop {
  query: string;
  steps: RouteStep[];
  // Leg that flies to this waypoint. Absent when the text runner has no flight data.
  fuelUsage?: number;
  reactorUsage?: number;
  gateway?: boolean;
}

export interface RouteSpec {
  stops: RouteStop[];
  // Absent on a text spec, so the text runner leaves the game toggle alone.
  loop?: boolean;
}

export type ParseResult = { ok: true; spec: RouteSpec } | { ok: false; error: string };

const WAIT_UNITS: readonly WaitUnit[] = ['seconds', 'minutes', 'hours', 'days'];
const ROUTE_ID = /^RT-[A-Z0-9]+-\d+$/i;

export function parseRouteId(
  value: string,
): { ok: true; id?: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: true };
  }
  if (!ROUTE_ID.test(trimmed)) {
    return { ok: false, error: '路线编号格式应为 RT-SUUL-0521' };
  }
  return { ok: true, id: trimmed.toUpperCase() };
}

export function parseRouteSpec(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const stops: RouteStop[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (raw.length === 0 || raw.startsWith('#')) {
      continue;
    }
    const parsed = parseStopLine(raw, i + 1);
    if (!parsed.ok) {
      return parsed;
    }
    stops.push(parsed.stop);
  }
  if (stops.length < 2) {
    return { ok: false, error: '至少需要 2 个站点' };
  }
  return { ok: true, spec: { stops } };
}

export function stepCommandLabel(step: RouteStep): string {
  switch (step.kind) {
    case 'load':
      return 'Load';
    case 'unload':
      return 'Unload';
    case 'refuel':
      return 'Refuel';
    case 'wait':
      return 'Wait';
    case 'load-shipment':
      return 'Load shipment';
    case 'unload-shipment':
      return 'Unload shipment';
  }
}

// The text the game shows on a shipment step's row once it is added.
export function shipmentRowText(step: ShipmentStep): string {
  return step.kind === 'load-shipment'
    ? 'All shipments bound for a later waypoint'
    : 'All shipments bound for this waypoint';
}

// Plain-text step for the RTEXEC preview and log: "Load 120 RAT", "Unload all DW carried".
export function stepSummary(step: RouteStep): string {
  switch (step.kind) {
    case 'load':
      return loadText(step);
    case 'unload':
      return `卸下 ${amountText(step.ticker, step.min, step.max)}`;
    case 'refuel':
      return `加油 ${step.tank}，从 ${step.source === 'ship' ? '飞船' : '当地'}，${rangeText(step.min, step.max, 'SF')}`;
    case 'wait':
      return `等待 ${step.amount} ${localizeLabel(step.unit)}`;
    case 'load-shipment':
      return '装载货运';
    case 'unload-shipment':
      return '卸下货运';
  }
}

function limitText(limit: LoadLimit | UnloadLimit): string {
  switch (limit.mode) {
    case 'units':
      return String(limit.amount);
    case 'capacity':
      return '可用容量';
    case 'all':
      return '全部携带量';
  }
}

function rangeText(min: LoadLimit | UnloadLimit, max: LoadLimit | UnloadLimit, unit: string) {
  const low = limitText(min);
  const high = limitText(max);
  if (low === high) {
    return min.mode === 'units' ? `${low} ${unit}` : low;
  }
  return `最少 ${low}，最多 ${high}`;
}

function amountText(ticker: string, min: LoadLimit | UnloadLimit, max: LoadLimit | UnloadLimit) {
  if (min.mode === 'units' && max.mode === 'units' && min.amount === max.amount) {
    return `${min.amount} ${ticker}`;
  }
  if (min.mode === 'all' && max.mode === 'all') {
    return `全部 ${ticker} 携带量`;
  }
  return `${ticker}（最少 ${limitText(min)}，最多 ${limitText(max)}）`;
}

// "Load excess RAT, retain 120": take everything above what the location keeps.
function loadText(step: LoadStep): string {
  const retain = step.retain ?? 0;
  if (retain <= 0) {
    return `装载 ${amountText(step.ticker, step.min, step.max)}`;
  }
  if (step.min.mode === 'units' && step.min.amount === 0 && step.max.mode === 'capacity') {
    return `装载多余物资 ${step.ticker}，保留 ${retain}`;
  }
  return `装载 ${amountText(step.ticker, step.min, step.max)}，保留 ${retain}`;
}

// One line per waypoint setting and step, in run order.
export function routeSummaryLines(spec: RouteSpec, shipId?: string): string[] {
  const lines: string[] = [];
  for (const [index, stop] of spec.stops.entries()) {
    const flight: string[] = [];
    if (stop.fuelUsage !== undefined) {
      flight.push(`燃料 ${stop.fuelUsage}%`);
    }
    if (stop.reactorUsage !== undefined) {
      flight.push(`反应堆 ${stop.reactorUsage}%`);
    }
    if (stop.gateway !== undefined) {
      flight.push(stop.gateway ? '启用星门' : '禁用星门');
    }
    const head = `站点 ${index + 1}：${stop.query}`;
    lines.push(flight.length > 0 ? `${head}（${flight.join('，')}）` : head);
    if (stop.steps.length === 0) {
      lines.push(`${stop.query}：无步骤`);
    }
    for (const step of stop.steps) {
      lines.push(`${stop.query}：${stepSummary(step)}`);
    }
  }
  if (spec.loop !== undefined) {
    lines.push(spec.loop ? '开启循环' : '关闭循环');
  }
  if (shipId !== undefined && shipId.length > 0) {
    lines.push(`分配 ${shipId}`);
  }
  return lines;
}

export function editorTitle(step: EditableStep): string {
  switch (step.kind) {
    case 'load':
      return 'Edit load step';
    case 'unload':
      return 'Edit unload step';
    case 'refuel':
      return 'Edit refuel step';
    case 'wait':
      return 'Edit wait step';
  }
}

export function tankLabel(tank: RefuelStep['tank']): string {
  return tank === 'STL' ? 'STL tank' : 'FTL tank';
}

export function sourceLabel(source: RefuelStep['source']): string {
  return source === 'ship' ? 'ship store' : 'local store';
}

function parseStopLine(
  raw: string,
  line: number,
): { ok: true; stop: RouteStop } | { ok: false; error: string } {
  const parts = raw.split('|').map(part => part.trim());
  const query = parts[0] ?? '';
  if (query.length === 0) {
    return { ok: false, error: `行 ${line}：缺少站点` };
  }
  const steps: RouteStep[] = [];
  for (let i = 1; i < parts.length; i++) {
    const segment = parts[i];
    if (segment.length === 0) {
      return { ok: false, error: `行 ${line}：步骤为空` };
    }
    const parsed = parseStep(segment, line);
    if (!parsed.ok) {
      return parsed;
    }
    steps.push(parsed.step);
  }
  return { ok: true, stop: { query, steps } };
}

// One step in the text syntax ("load RAT 0 capacity retain 120"), outside a stop line.
export function parseRouteStep(
  text: string,
): { ok: true; step: RouteStep } | { ok: false; error: string } {
  const segment = text.trim();
  if (segment.length === 0) {
    return { ok: false, error: '步骤为空' };
  }
  const parsed = parseStep(segment, 0);
  if (parsed.ok) {
    return parsed;
  }
  return { ok: false, error: parsed.error.replace(/^行 0：\s*/, '') };
}

function parseStep(
  segment: string,
  line: number,
): { ok: true; step: RouteStep } | { ok: false; error: string } {
  const tokens = segment.split(/\s+/);
  const kind = tokens[0]?.toLowerCase();
  if ((kind === 'load' || kind === 'unload') && tokens[1]?.toLowerCase() === 'shipment') {
    if (tokens.length !== 2) {
      return { ok: false, error: `行 ${line}: ${kind} 货运步骤不接受数量` };
    }
    return { ok: true, step: { kind: kind === 'load' ? 'load-shipment' : 'unload-shipment' } };
  }
  if (kind === 'load' || kind === 'unload' || kind === 'refuel') {
    return parseCargoStep(kind, tokens, line);
  }
  if (kind === 'wait') {
    return parseWait(tokens, line);
  }
  return { ok: false, error: `行 ${line}：未知步骤“${tokens[0] ?? ''}”` };
}

function parseCargoStep(
  kind: 'load' | 'unload' | 'refuel',
  tokens: string[],
  line: number,
): { ok: true; step: RouteStep } | { ok: false; error: string } {
  if (kind === 'refuel') {
    if (tokens.length !== 5) {
      return { ok: false, error: `行 ${line}：加油语法为 refuel TANK ship|local MIN MAX` };
    }
    const tank = tokens[1].toUpperCase();
    const source = tokens[2].toLowerCase();
    if (tank !== 'STL' && tank !== 'FTL') {
      return { ok: false, error: `行 ${line}：油箱必须为 STL 或 FTL` };
    }
    if (source !== 'ship' && source !== 'local') {
      return { ok: false, error: `行 ${line}：燃料来源必须为 ship 或 local` };
    }
    const min = parseLimit(tokens[3], 'refuel', line, 'min');
    const max = parseLimit(tokens[4], 'refuel', line, 'max');
    if (!min.ok) {
      return min;
    }
    if (!max.ok) {
      return max;
    }
    return {
      ok: true,
      step: { kind: 'refuel', tank, source, min: min.limit, max: max.limit },
    };
  }
  const retainTokens = kind === 'load' && tokens[4]?.toLowerCase() === 'retain';
  if (tokens.length !== (retainTokens ? 6 : 4)) {
    return {
      ok: false,
      error:
        kind === 'load'
          ? `行 ${line}：装货语法为 load TICKER MIN MAX [retain N]`
          : `行 ${line}：卸货语法为 unload TICKER MIN MAX`,
    };
  }
  const ticker = tokens[1].toUpperCase();
  if (!/^[A-Z0-9]{1,4}$/.test(ticker)) {
    return { ok: false, error: `行 ${line}：无效材料代码“${tokens[1]}”` };
  }
  if (kind === 'load') {
    const min = parseLimit(tokens[2], 'load', line, 'min');
    const max = parseLimit(tokens[3], 'load', line, 'max');
    if (!min.ok) {
      return min;
    }
    if (!max.ok) {
      return max;
    }
    const step: LoadStep = { kind: 'load', ticker, min: min.limit, max: max.limit };
    if (retainTokens) {
      const retain = Number(tokens[5]);
      if (!Number.isInteger(retain) || retain < 0) {
        return { ok: false, error: `行 ${line}：保留量必须为整数` };
      }
      step.retain = retain;
    }
    return { ok: true, step };
  }
  const min = parseLimit(tokens[2], 'unload', line, 'min');
  const max = parseLimit(tokens[3], 'unload', line, 'max');
  if (!min.ok) {
    return min;
  }
  if (!max.ok) {
    return max;
  }
  return { ok: true, step: { kind: 'unload', ticker, min: min.limit, max: max.limit } };
}

function parseWait(
  tokens: string[],
  line: number,
): { ok: true; step: WaitStep } | { ok: false; error: string } {
  if (tokens.length !== 3) {
    return { ok: false, error: `行 ${line}：等待语法为 wait AMOUNT seconds|minutes|hours|days` };
  }
  const amount = Number(tokens[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: `行 ${line}：等待时长必须为正数` };
  }
  const unit = tokens[2].toLowerCase();
  if (!WAIT_UNITS.includes(unit as WaitUnit)) {
    return { ok: false, error: `行 ${line}：等待单位必须为 seconds、minutes、hours 或 days` };
  }
  return { ok: true, step: { kind: 'wait', amount, unit: unit as WaitUnit } };
}

function parseLimit(
  token: string,
  kind: 'load' | 'refuel',
  line: number,
  side: 'min' | 'max',
): { ok: true; limit: LoadLimit } | { ok: false; error: string };
function parseLimit(
  token: string,
  kind: 'unload',
  line: number,
  side: 'min' | 'max',
): { ok: true; limit: UnloadLimit } | { ok: false; error: string };
function parseLimit(
  token: string,
  kind: 'load' | 'unload' | 'refuel',
  line: number,
  side: 'min' | 'max',
): { ok: true; limit: LoadLimit | UnloadLimit } | { ok: false; error: string } {
  const word = token.toLowerCase();
  if (word === 'capacity') {
    if (kind === 'unload') {
      return { ok: false, error: `行 ${line}：卸货使用 units 或 all，不能使用 capacity` };
    }
    return { ok: true, limit: { mode: 'capacity' } };
  }
  if (word === 'all') {
    if (kind !== 'unload') {
      return { ok: false, error: `行 ${line}: ${kind} 不能使用 all` };
    }
    return { ok: true, limit: { mode: 'all' } };
  }
  const amount = Number(token);
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: `行 ${line}: ${side} 必须为数值、capacity 或 all` };
  }
  return { ok: true, limit: { mode: 'units', amount } };
}

// JSON RouteSpec from the ROUTECONFIG bridge. The text parser does not carry flight fields.
export function parseRoutePayload(text: string): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, error: '路线数据不是 JSON' };
  }
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: '路线数据格式不正确' };
  }
  const record = value as { stops?: unknown; loop?: unknown };
  if (!Array.isArray(record.stops)) {
    return { ok: false, error: '路线数据格式不正确' };
  }
  const stops: RouteStop[] = [];
  for (const entry of record.stops) {
    const parsed = parsePayloadStop(entry);
    if (!parsed.ok) {
      return parsed;
    }
    stops.push(parsed.stop);
  }
  if (stops.length < 2) {
    return { ok: false, error: '至少需要 2 个站点' };
  }
  if (record.loop !== undefined && typeof record.loop !== 'boolean') {
    return { ok: false, error: '路线数据的 loop 必须为布尔值' };
  }
  return {
    ok: true,
    spec: record.loop === undefined ? { stops } : { stops, loop: record.loop },
  };
}

function parsePayloadStop(
  entry: unknown,
): { ok: true; stop: RouteStop } | { ok: false; error: string } {
  if (typeof entry !== 'object' || entry === null) {
    return { ok: false, error: '路线站点数据不是对象' };
  }
  const record = entry as {
    query?: unknown;
    steps?: unknown;
    fuelUsage?: unknown;
    reactorUsage?: unknown;
    gateway?: unknown;
  };
  if (typeof record.query !== 'string' || record.query.trim().length === 0) {
    return { ok: false, error: '路线站点缺少 query' };
  }
  if (!Array.isArray(record.steps)) {
    return { ok: false, error: '路线站点缺少 steps' };
  }
  const steps: RouteStep[] = [];
  for (const step of record.steps) {
    const parsed = parsePayloadStep(step);
    if (!parsed.ok) {
      return parsed;
    }
    steps.push(parsed.step);
  }
  const stop: RouteStop = { query: record.query, steps };
  if (record.fuelUsage !== undefined) {
    if (typeof record.fuelUsage !== 'number' || !Number.isFinite(record.fuelUsage)) {
      return { ok: false, error: '路线燃料用量必须为数值' };
    }
    stop.fuelUsage = record.fuelUsage;
  }
  if (record.reactorUsage !== undefined) {
    if (typeof record.reactorUsage !== 'number' || !Number.isFinite(record.reactorUsage)) {
      return { ok: false, error: '路线反应堆用量必须为数值' };
    }
    stop.reactorUsage = record.reactorUsage;
  }
  if (record.gateway !== undefined) {
    if (typeof record.gateway !== 'boolean') {
      return { ok: false, error: '路线 gateway 必须为布尔值' };
    }
    stop.gateway = record.gateway;
  }
  return { ok: true, stop };
}

function parsePayloadStep(
  step: unknown,
): { ok: true; step: RouteStep } | { ok: false; error: string } {
  if (typeof step !== 'object' || step === null) {
    return { ok: false, error: '路线步骤不是对象' };
  }
  const kind = (step as { kind?: unknown }).kind;
  if (kind === 'load-shipment' || kind === 'unload-shipment') {
    return { ok: true, step: { kind } };
  }
  if (kind === 'wait') {
    const wait = step as { amount?: unknown; unit?: unknown };
    if (typeof wait.amount !== 'number' || !Number.isFinite(wait.amount) || wait.amount <= 0) {
      return { ok: false, error: '路线等待时长无效' };
    }
    if (
      wait.unit !== 'seconds' &&
      wait.unit !== 'minutes' &&
      wait.unit !== 'hours' &&
      wait.unit !== 'days'
    ) {
      return { ok: false, error: '路线等待单位无效' };
    }
    return { ok: true, step: { kind: 'wait', amount: wait.amount, unit: wait.unit } };
  }
  if (kind === 'refuel') {
    const refuel = step as { tank?: unknown; source?: unknown; min?: unknown; max?: unknown };
    if (refuel.tank !== 'STL' && refuel.tank !== 'FTL') {
      return { ok: false, error: '路线油箱必须为 STL 或 FTL' };
    }
    if (refuel.source !== 'ship' && refuel.source !== 'local') {
      return { ok: false, error: '路线燃料来源必须为 ship 或 local' };
    }
    const min = payloadLimit(refuel.min, 'refuel');
    const max = payloadLimit(refuel.max, 'refuel');
    if (!min.ok) {
      return min;
    }
    if (!max.ok) {
      return max;
    }
    return {
      ok: true,
      step: {
        kind: 'refuel',
        tank: refuel.tank,
        source: refuel.source,
        min: min.limit,
        max: max.limit,
      },
    };
  }
  if (kind !== 'load' && kind !== 'unload') {
    return { ok: false, error: '路线步骤类型无效' };
  }
  const cargo = step as { ticker?: unknown; min?: unknown; max?: unknown; retain?: unknown };
  if (typeof cargo.ticker !== 'string' || !/^[A-Z0-9]{1,4}$/.test(cargo.ticker)) {
    return { ok: false, error: '路线材料代码无效' };
  }
  if (kind === 'load') {
    const min = payloadLimit(cargo.min, 'load');
    const max = payloadLimit(cargo.max, 'load');
    if (!min.ok) {
      return min;
    }
    if (!max.ok) {
      return max;
    }
    const load: LoadStep = { kind: 'load', ticker: cargo.ticker, min: min.limit, max: max.limit };
    if (cargo.retain !== undefined) {
      if (typeof cargo.retain !== 'number' || !Number.isInteger(cargo.retain) || cargo.retain < 0) {
        return { ok: false, error: '路线保留量无效' };
      }
      load.retain = cargo.retain;
    }
    return { ok: true, step: load };
  }
  const min = payloadLimit(cargo.min, 'unload');
  const max = payloadLimit(cargo.max, 'unload');
  if (!min.ok) {
    return min;
  }
  if (!max.ok) {
    return max;
  }
  return {
    ok: true,
    step: { kind: 'unload', ticker: cargo.ticker, min: min.limit, max: max.limit },
  };
}

function payloadLimit(
  value: unknown,
  kind: 'load' | 'refuel',
): { ok: true; limit: LoadLimit } | { ok: false; error: string };
function payloadLimit(
  value: unknown,
  kind: 'unload',
): { ok: true; limit: UnloadLimit } | { ok: false; error: string };
function payloadLimit(
  value: unknown,
  kind: 'load' | 'unload' | 'refuel',
): { ok: true; limit: LoadLimit | UnloadLimit } | { ok: false; error: string } {
  if (typeof value !== 'object' || value === null) {
    return { ok: false, error: '路线限制无效' };
  }
  const mode = (value as { mode?: unknown }).mode;
  if (mode === 'capacity') {
    if (kind === 'unload') {
      return { ok: false, error: '路线卸货使用 units 或 all，不能使用 capacity' };
    }
    return { ok: true, limit: { mode: 'capacity' } };
  }
  if (mode === 'all') {
    if (kind !== 'unload') {
      return { ok: false, error: '路线装货不能使用 all' };
    }
    return { ok: true, limit: { mode: 'all' } };
  }
  if (mode !== 'units') {
    return { ok: false, error: '路线限制无效' };
  }
  const amount = (value as { amount?: unknown }).amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: '路线限制数量无效' };
  }
  return { ok: true, limit: { mode: 'units', amount } };
}
