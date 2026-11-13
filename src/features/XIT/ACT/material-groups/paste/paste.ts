import { act } from '@src/features/XIT/ACT/act-registry';
import Edit from '@src/features/XIT/ACT/material-groups/paste/Edit.vue';
import Configure from '@src/features/XIT/ACT/material-groups/paste/Configure.vue';
import { Config } from '@src/features/XIT/ACT/material-groups/paste/config';
import {
  parseMaterials,
  ResolveTicker,
} from '@src/features/XIT/ACT/material-groups/paste/paste-parse';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';

export const resolveTicker: ResolveTicker = ticker => materialsStore.getByTicker(ticker)?.ticker;

act.addMaterialGroup<Config>({
  type: 'Paste',
  shortDescription: '执行时从剪贴板粘贴材料',
  description: () => {
    return '执行时粘贴材料';
  },
  editComponent: Edit,
  configureComponent: Configure,
  needsConfigure: () => true,
  isValidConfig: (_data, config) => parseMaterials(config.materials, resolveTicker) !== undefined,
  generateMaterialBill: async ({ config, log, setPrices }) => {
    const result = parseMaterials(config.materials, resolveTicker);
    if (!result) {
      log.error('粘贴的材料无效或缺失。');
      return undefined;
    }
    if (result.prices) {
      setPrices(result.prices);
    }
    return result.materials;
  },
});
