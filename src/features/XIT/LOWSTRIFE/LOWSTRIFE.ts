import LOWSTRIFE from '@src/features/XIT/LOWSTRIFE/LOWSTRIFE.vue';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { getEntityNameFromAddress } from '@src/infrastructure/prun-api/data/addresses';

xit.add({
  command: 'LOWSTRIFE',
  name: parameters => {
    if (parameters.length === 0) {
      return '飞船装载';
    }
    const site = sitesStore.getByPlanetNaturalIdOrName(parameters.join(' '));
    const name = site ? getEntityNameFromAddress(site.address) : parameters.join(' ');
    return `飞船装载 - ${name}`;
  },
  description: '为飞船装载指定天数的消耗品，并尽量多装生产原料，最后用 DW 填满剩余空间。',
  component: () => LOWSTRIFE,
});
