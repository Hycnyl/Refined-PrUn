import type { PeakOverflow } from '@src/features/XIT/ACT/material-groups/resupply/milk-run';

// Names the load that stops FIT one step short: the inputs leaving the origin,
// or the hold after a base's pick-up, split into what was picked up so far and
// the inputs still aboard.
export function fitLimitText(
  days: number,
  overflow: PeakOverflow,
  originLabel: string,
  stopLabel: string | undefined,
  format: (amount: number) => string,
) {
  const weight = overflow.weightOver > 0;
  const volume = overflow.volumeOver > 0;
  const measure = weight && volume ? '重量和体积' : weight ? '重量' : '体积';
  const head = `可容纳 ${days.toFixed(1)}天，更多会导致超载：${measure}`;
  if (overflow.stopId === undefined) {
    return `${head}，出发于 ${originLabel}：基地所需原料。`;
  }
  const amount = (load: number, output: number, unit: string) =>
    `${format(output)}${unit} 已收取，${format(Math.max(0, load - output))}${unit} 生产原料`;
  const parts: string[] = [];
  if (weight) {
    parts.push(amount(overflow.weightLoad, overflow.outputWeight, 't'));
  }
  if (volume) {
    parts.push(amount(overflow.volumeLoad, overflow.outputVolume, 'm³'));
  }
  return `${head}，在收货站点之后：${stopLabel ?? overflow.stopId}： ${parts.join('；')}。`;
}
