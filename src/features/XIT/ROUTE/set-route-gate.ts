// Why SET ROUTE stays disabled. Undefined means the button is armed.

export interface SetRouteGateInput {
  shipChosen: boolean;
  stopCount: number;
  billReady: boolean;
  legs: readonly { ok: boolean }[] | undefined;
  supplyDays: number;
  hasOverflow: boolean;
  inputOverloaded: boolean;
}

export function transitsReady(legs: readonly { ok: boolean }[] | undefined) {
  return legs !== undefined && legs.length > 0 && legs.every(x => x.ok);
}

export function supplyDaysReady(days: number) {
  return Number.isFinite(days) && days > 0;
}

export function setRouteBlock(input: SetRouteGateInput) {
  if (!input.shipChosen) {
    return '请先在上方设置飞船以创建路线。';
  }
  if (input.stopCount < 2) {
    return '请至少添加两个站点。';
  }
  if (!input.billReady) {
    return '材料清单尚未准备好。';
  }
  if (!transitsReady(input.legs)) {
    return '请先运行 TRANSITS。';
  }
  if (!supplyDaysReady(input.supplyDays)) {
    return '请设置补给天数。';
  }
  if (input.hasOverflow || input.inputOverloaded) {
    return '请处理超载的站点。';
  }
  return undefined;
}
