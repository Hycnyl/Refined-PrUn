import { describe, expect, it } from 'vitest';
import { matchShipBlueprint } from '@src/features/XIT/TRANSITS/ship-blueprint';

const named = { naturalId: 'BP-PSXY-5838', name: '1st 2k' };
const unnamed = { naturalId: 'BP-BPXQ-4544', name: null };

describe('matchShipBlueprint', () => {
  it('matches the ship id to that blueprint, named or not', () => {
    expect(matchShipBlueprint([named, unnamed], 'BP-PSXY-5838')).toEqual({ blueprint: named });
    expect(matchShipBlueprint([named, unnamed], 'bp-bpxq-4544')).toEqual({ blueprint: unnamed });
  });

  it('fails when the loaded list has no match', () => {
    expect(matchShipBlueprint([unnamed], 'BP-PSXY-5838')).toEqual({
      error: '蓝图 BP-PSXY-5838 没有匹配的蓝图',
    });
  });

  it('fails when the list is not loaded', () => {
    expect(matchShipBlueprint(undefined, 'BP-PSXY-5838')).toEqual({
      error: '尚未加载蓝图',
    });
  });

  it('fails when more than one blueprint has the id', () => {
    expect(matchShipBlueprint([named, { ...named }], 'BP-PSXY-5838')).toEqual({
      error: '蓝图 BP-PSXY-5838 匹配了 2 个蓝图',
    });
  });
});
