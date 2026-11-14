import { act } from '@src/features/XIT/ACT/act-registry';
import Edit from '@src/features/XIT/ACT/material-groups/resupply/Edit.vue';
import Configure from '@src/features/XIT/ACT/material-groups/resupply/Configure.vue';
import { Config } from '@src/features/XIT/ACT/material-groups/resupply/config';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { workforcesStore } from '@src/infrastructure/prun-api/data/workforces';
import { productionStore } from '@src/infrastructure/prun-api/data/production';
import { configurableValue } from '@src/features/XIT/ACT/shared-types';
import { computeResupplyBill } from '@src/features/XIT/ACT/material-groups/resupply/bill';
import { watchWhile } from '@src/utils/watch';
import {
  getEntityNameFromAddress,
  getEntityNaturalIdFromAddress,
} from '@src/infrastructure/prun-api/data/addresses';

act.addMaterialGroup<Config>({
  type: 'Resupply',
  shortDescription: '根据消耗速率计算所需消耗品',
  description: data => {
    if (!data.planet || data.days === undefined) {
      return '--';
    }

    const daysLabel = data.days === configurableValue ? '?' : data.days;
    return `补给 ${data.planet}，所需 ${daysLabel} 天 的补给`;
  },
  editComponent: Edit,
  configureComponent: Configure,
  needsConfigure: data => data.planet === configurableValue || data.days === configurableValue,
  isValidConfig: (data, config) =>
    (data.planet !== configurableValue || config.planet !== undefined) &&
    (data.days !== configurableValue || config.days !== undefined),
  generateMaterialBill: async ({ data, config, log, setStatus }) => {
    if (!data.planet) {
      log.error('缺少补给星球');
    }
    if (data.days === undefined) {
      log.error('缺少补给天数');
    }

    const planet = data.planet === configurableValue ? config.planet : data.planet;
    const days =
      data.days === configurableValue
        ? (config.days ?? 10)
        : typeof data.days === 'number'
          ? data.days
          : parseFloat(data.days as string);
    const site = sitesStore.getByPlanetNaturalIdOrName(planet);
    if (!site) {
      log.error(`星球上没有基地：${data.planet}`);
    }

    if (!site || days === undefined || isNaN(days)) {
      return undefined;
    }

    const workforce = computed(() => workforcesStore.getById(site?.siteId)?.workforces);
    const production = computed(() => productionStore.getBySiteId(site.siteId));
    if (workforce.value === undefined || production.value === undefined) {
      const name =
        getEntityNameFromAddress(site.address) ?? getEntityNaturalIdFromAddress(site.address);
      setStatus(`正在加载 ${name} 消耗数据……`);
      await watchWhile(
        toRef(() => workforce.value === undefined || production.value === undefined),
      );
    }

    return computeResupplyBill(data, planet, days, config.materialFilter);
  },
});
