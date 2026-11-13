import STO from '@src/features/XIT/STO/STO.vue';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { getEntityNameFromAddress } from '@src/infrastructure/prun-api/data/addresses';

xit.add({
  command: ['STO', 'STORAGE'],
  name: parameters => {
    if (parameters[0]) {
      const site = sitesStore.getByPlanetNaturalIdOrName(parameters[0]);
      if (site) {
        return `库存 — ${getEntityNameFromAddress(site.address)}`;
      }
    }
    return '库存分析';
  },
  description:
    '按基地分析库存：当前占用率、按当前生产速率预计满仓天数，以及按舰队容量估算的到访频率。',
  optionalParameters: 'PLANET',
  component: () => STO,
  bufferSize: [900, 500],
});
