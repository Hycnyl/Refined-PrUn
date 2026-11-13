import CXOS from '@src/features/XIT/CXOS/CXOS.vue';

xit.add({
  command: ['CXOS'],
  name: '交易概览',
  description: '按材料代码汇总近期交易所成交、库存及卖单。',
  component: () => CXOS,
});
