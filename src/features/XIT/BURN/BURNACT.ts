import '@src/features/XIT/ACT/actions/cx-buy/cx-buy';
import '@src/features/XIT/ACT/actions/mtra/mtra';
import '@src/features/XIT/ACT/actions/refuel/refuel';
import '@src/features/XIT/ACT/material-groups/resupply/resupply';

import BurnActWindow from '@src/features/XIT/BURN/BurnActWindow.vue';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { getEntityNameFromAddress } from '@src/infrastructure/prun-api/data/addresses';

xit.add({
  command: 'BURNACT',
  name: parameters => {
    if (parameters[0]) {
      const site = sitesStore.getByPlanetNaturalIdOrName(parameters[0]);
      const name = site ? getEntityNameFromAddress(site.address) : parameters[0];
      return `消耗补给 - ${name}`;
    }
    return '消耗补给';
  },
  description: '从消耗监控界面为星球执行补给动作包。',
  component: () => BurnActWindow,
});
