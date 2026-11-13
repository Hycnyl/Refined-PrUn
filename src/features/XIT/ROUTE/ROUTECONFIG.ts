import ROUTECONFIG from '@src/features/XIT/ROUTE/ROUTECONFIG.vue';

xit.add({
  command: 'ROUTECONFIG',
  name: '路线配置',
  description: '按顺序排列交易所和基地，规划运输路线。',
  optionalParameters: '路线编号',
  component: () => ROUTECONFIG,
  bufferSize: [980, 520],
});
