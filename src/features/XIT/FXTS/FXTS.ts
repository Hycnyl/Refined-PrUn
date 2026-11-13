import FXTS from '@src/features/XIT/FXTS/FXTS.vue';

xit.add({
  command: ['FXTS'],
  name: '外汇交易记录',
  description: '所有外汇交易记录。',
  optionalParameters: 'Page Size',
  component: () => FXTS,
});
