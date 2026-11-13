import ROUTETRACK from '@src/features/XIT/ROUTE/ROUTETRACK.vue';

xit.add({
  command: 'ROUTETRACK',
  name: '路线追踪',
  description: '查看执行游戏路线的飞船、下次抵达时间及路线结束或循环时间。',
  component: () => ROUTETRACK,
  bufferSize: [760, 300],
});
