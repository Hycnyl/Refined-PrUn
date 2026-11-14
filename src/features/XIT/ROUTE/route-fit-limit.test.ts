import { describe, expect, it } from 'vitest';
import { fitLimitText } from '@src/features/XIT/ROUTE/route-fit-limit';

const fixed = (amount: number) => amount.toFixed(0);

const overflow = {
  weightLoad: 0,
  volumeLoad: 0,
  weightOver: 0,
  volumeOver: 0,
  outputWeight: 0,
  outputVolume: 0,
};

describe('fitLimitText', () => {
  it('names the inputs leaving the origin', () => {
    const text = fitLimitText(
      4.2,
      { ...overflow, weightLoad: 510, weightOver: 10 },
      'NC1',
      'X',
      fixed,
    );
    expect(text).toBe('可容纳 4.2天，更多会导致超载：重量，出发于 NC1：基地所需原料。');
  });

  it('splits a base pick-up into output and inputs still aboard', () => {
    const text = fitLimitText(
      7,
      { ...overflow, stopId: 'KW-688c', volumeLoad: 505, volumeOver: 5, outputVolume: 400 },
      'NC1',
      'Etherwind',
      fixed,
    );
    expect(text).toBe(
      '可容纳 7.0天，更多会导致超载：体积，在收货站点之后：Etherwind：400m³ 已收取，105m³ 生产原料。',
    );
  });
});
