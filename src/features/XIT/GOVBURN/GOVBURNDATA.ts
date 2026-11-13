import '@src/features/XIT/ACT/actions/govburn-data/govburn-data';

import GovBurnDataWindow from '@src/features/XIT/GOVBURN/GovBurnDataWindow.vue';
import { planetsStore } from '@src/infrastructure/prun-api/data/planets';

xit.add({
  command: 'GOVBURNDATA',
  name: parameters => {
    // Join in case a naturalId/name was split by the XIT router.
    const parameter = parameters.join(' ');
    if (parameter) {
      const planet = planetsStore.find(parameter);
      return `星球维护数据 - ${planet?.name ?? parameter}`;
    }
    return '星球维护数据';
  },
  description: '通过 POPI 和 POPID 窗口收集星球基础设施维护数据。',
  optionalParameters: 'Planet Identifier',
  component: () => GovBurnDataWindow,
});
