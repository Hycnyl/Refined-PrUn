import FLOW from '@src/features/XIT/FLOW/FLOW.vue';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { getEntityNameFromAddress } from '@src/infrastructure/prun-api/data/addresses';

xit.add({
  command: 'FLOW',
  name: parameters => {
    if (parameters[0] && !parameters[1]) {
      const site = sitesStore.getByPlanetNaturalIdOrName(parameters[0]);
      if (site) {
        const name = getEntityNameFromAddress(site.address);
        return `材料流量 - ${name}`;
      }
    }

    return '材料流量';
  },
  description: '汇总各基地每种材料的每日生产、消耗和价值。',
  optionalParameters: '星球编号（可多个）、NOT',
  contextItems: () => [{ cmd: 'XIT BURN' }, { cmd: 'XIT FINPR' }, { cmd: 'XIT SET FIN' }],
  component: () => FLOW,
  bufferSize: [1000, 500],
});
