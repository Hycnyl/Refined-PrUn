import { act } from '@src/features/XIT/ACT/act-registry';
import Edit from '@src/features/XIT/ACT/actions/cont-ship/Edit.vue';
import Configure from '@src/features/XIT/ACT/actions/cont-ship/Configure.vue';
import { CONT_SEND } from '@src/features/XIT/ACT/action-steps/CONT_SEND';
import { Config } from '@src/features/XIT/ACT/actions/cont-ship/config';
import { AssertFn, configurableValue } from '@src/features/XIT/ACT/shared-types';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';
import {
  displayLocationValue,
  resolveLocation,
} from '@src/features/XIT/ACT/actions/cont-locations';

act.addAction<Config>({
  type: 'CONT Ship',
  shortDescription: '为材料组创建货运合同草稿',
  description: (action, config) => {
    if (!action.group || !action.contOrigin || !action.contDest) {
      return '--';
    }

    const origin =
      action.contOrigin === configurableValue
        ? (config?.origin ?? '配置的位置')
        : displayLocationValue(action.contOrigin);
    const dest =
      action.contDest === configurableValue
        ? (config?.destination ?? 'configured location')
        : displayLocationValue(action.contDest);

    const payment = action.paymentPerTon ?? 0;
    const paymentStr = payment > 0 ? ` @ ${payment}/t` : '';

    return `发送合同，材料组 [${action.group}]，从 ${origin} 到 ${dest}${paymentStr}`;
  },
  editComponent: Edit,
  configureComponent: Configure,
  // Only ask for a configure dialog when something in it is actually settable.
  needsConfigure: data =>
    data.contOrigin === configurableValue ||
    data.contDest === configurableValue ||
    data.autoProvision === true,
  isValidConfig: (data, config) => {
    return (
      (data.contOrigin !== configurableValue || config.origin !== undefined) &&
      (data.contDest !== configurableValue || config.destination !== undefined) &&
      (!data.autoProvision || config.autoProvisionStoreId !== undefined)
    );
  },
  generateSteps: async ctx => {
    const { data, config, packageName, getMaterialGroup, getMaterialGroupPlanet, emitStep } = ctx;
    const assert: AssertFn = ctx.assert;

    const materials = await getMaterialGroup(data.group);
    assert(materials, '材料组无效');

    const contOrigin = resolveLocation(data.contOrigin, config?.origin, getMaterialGroupPlanet);
    assert(contOrigin, '来源无效');

    const contDest = resolveLocation(data.contDest, config?.destination, getMaterialGroupPlanet);
    assert(contDest, '目的地无效');

    const paymentPerTon = Number(data.paymentPerTon ?? 0);
    const daysToFulfill = data.daysToFulfill ?? 3;
    const currency = data.currency ?? 'NCC';

    let totalTonnage = 0;
    for (const [ticker, amount] of Object.entries(materials)) {
      const material = materialsStore.getByTicker(ticker);
      totalTonnage += material ? material.weight * amount : amount;
    }
    const totalPayment = Math.round(totalTonnage * paymentPerTon);

    emitStep(
      CONT_SEND({
        packageName,
        materials,
        contractNote: data.contractNote,
        payment: totalPayment,
        currency,
        daysToFulfill,
        contOrigin,
        contDest,
        autoProvisionStoreId: data.autoProvision ? config?.autoProvisionStoreId : undefined,
      }),
    );
  },
});
