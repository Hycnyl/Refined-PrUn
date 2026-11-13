import '@src/features/XIT/ACT/actions/cx-buy/cx-buy';
import '@src/features/XIT/ACT/actions/mtra/mtra';

import GovBurnActWindow from '@src/features/XIT/GOVBURN/GovBurnActWindow.vue';
import { planetsStore } from '@src/infrastructure/prun-api/data/planets';

xit.add({
  command: 'GOVBURNACT',
  name: parameters => {
    // Join in case a naturalId/name was split by the XIT router.
    const parameter = parameters.join(' ');
    if (parameter) {
      const planet = planetsStore.find(parameter);
      return `星球维护补给 - ${planet?.name ?? parameter}`;
    }
    return '星球维护补给';
  },
  description: '执行星球维护补给动作包。',
  mandatoryParameters: 'Planet Identifier',
  component: () => GovBurnActWindow,
});
