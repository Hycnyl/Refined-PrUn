import CXTS from '@src/features/XIT/CXTS/CXTS.vue';

xit.add({
  command: ['CXTS'],
  name: '商品交易所成交记录',
  description: '所有商品交易所成交记录。',
  optionalParameters: '每页条数',
  component: () => CXTS,
});
