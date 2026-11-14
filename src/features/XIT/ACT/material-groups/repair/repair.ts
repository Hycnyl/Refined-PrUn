import { act } from '@src/features/XIT/ACT/act-registry';
import Edit from '@src/features/XIT/ACT/material-groups/repair/Edit.vue';
import Configure from '@src/features/XIT/ACT/material-groups/repair/Configure.vue';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { Config } from '@src/features/XIT/ACT/material-groups/repair/config';
import { configurableValue } from '@src/features/XIT/ACT/shared-types';
import { computeRepairBill } from '@src/features/XIT/ACT/material-groups/repair/bill';

act.addMaterialGroup<Config>({
  type: 'Repair',
  shortDescription: '计算老旧建筑所需的维修材料',
  description: data => {
    if (!data.planet) {
      return '--';
    }

    const days = data.days;
    const daysLabel = days === configurableValue ? '?' : days;
    const daysPart = days !== undefined ? `楼龄超过 ${daysLabel} 天` : '';
    const advanceDays = data.advanceDays ?? 0;
    const advanceLabel = advanceDays === configurableValue ? '?' : advanceDays;
    return `维修星球建筑：${data.planet} ${daysPart}，于 ${advanceLabel} 天`;
  },
  editComponent: Edit,
  configureComponent: Configure,
  needsConfigure: data =>
    data.planet === configurableValue ||
    data.days === configurableValue ||
    data.advanceDays === configurableValue,
  isValidConfig: (data, config) =>
    (data.planet !== configurableValue || config.planet !== undefined) &&
    (data.days !== configurableValue || config.days !== undefined) &&
    (data.advanceDays !== configurableValue || config.advanceDays !== undefined),
  generateMaterialBill: async ({ data, config, log }) => {
    if (!data.planet) {
      log.error('尚未配置补给星球');
      return undefined;
    }

    const planet = data.planet === configurableValue ? config.planet : data.planet;
    const site = sitesStore.getByPlanetNaturalIdOrName(planet);
    if (!site?.platforms) {
      log.error('缺少维修星球的数据');
      return undefined;
    }

    const rawDays = data.days === configurableValue ? config.days : data.days;
    const rawAdvanceDays =
      data.advanceDays === configurableValue ? config.advanceDays : data.advanceDays;
    const days = typeof rawDays === 'number' ? rawDays : parseFloat(rawDays!);
    let advanceDays =
      typeof rawAdvanceDays === 'number' ? rawAdvanceDays : parseFloat(rawAdvanceDays!);
    const threshold = isNaN(days) ? 0 : days;
    advanceDays = isNaN(advanceDays) ? 0 : advanceDays;

    return computeRepairBill(site, threshold, advanceDays);
  },
});
