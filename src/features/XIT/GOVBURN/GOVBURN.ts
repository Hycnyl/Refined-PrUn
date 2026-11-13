import GovBurnOverview from '@src/features/XIT/GOVBURN/GovBurnOverview.vue';
import GovBurnPlanetView from '@src/features/XIT/GOVBURN/GovBurnPlanetView.vue';
import { planetsStore } from '@src/infrastructure/prun-api/data/planets';

xit.add({
  command: 'GOVBURN',
  name: parameters => {
    if (parameters.length === 0) {
      return '星球维护消耗';
    }
    // Join in case a naturalId/name was split by the XIT router.
    const parameter = parameters.join(' ');
    const planet = planetsStore.find(parameter);
    return `星球维护消耗 - ${planet?.name ?? parameter}`;
  },
  description: '监控星球基础设施维护消耗。',
  optionalParameters: 'Planet Identifier',
  component: params => (params.length > 0 ? GovBurnPlanetView : GovBurnOverview),
});
