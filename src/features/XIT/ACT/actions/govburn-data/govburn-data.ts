import { act } from '@src/features/XIT/ACT/act-registry';
import Edit from '@src/features/XIT/ACT/actions/govburn-data/Edit.vue';
import { OPEN_POPI } from '@src/features/XIT/ACT/action-steps/OPEN_POPI';
import { OPEN_POPID } from '@src/features/XIT/ACT/action-steps/OPEN_POPID';
import { OPEN_COGC } from '@src/features/XIT/ACT/action-steps/OPEN_COGC';
import { AssertFn } from '@src/features/XIT/ACT/shared-types';
import { planetsStore } from '@src/infrastructure/prun-api/data/planets';
import { popiBuildings } from '@src/features/XIT/GOVBURN/buildings';

act.addAction({
  type: 'GovBurn Data',
  shortDescription: '通过 POPI、POPID 和 COGC 窗口收集星球维护数据',
  description: action => (action.planet ? `收集星球维护数据：${action.planet}` : '--'),
  editComponent: Edit,
  generateSteps: async ctx => {
    const { data, emitStep } = ctx;
    const assert: AssertFn = ctx.assert;

    const planet = planetsStore.find(data.planet);
    assert(planet, '未找到星球');
    const naturalId = planet.naturalId;

    emitStep(OPEN_POPI({ planet: naturalId }));
    for (const entry of popiBuildings) {
      emitStep(OPEN_POPID({ planet: naturalId, ticker: entry.ticker }));
    }
    emitStep(OPEN_COGC({ planet: naturalId }));
  },
});
