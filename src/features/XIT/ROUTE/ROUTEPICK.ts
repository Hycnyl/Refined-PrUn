import RoutePickWindow from '@src/features/XIT/ROUTE/RoutePickWindow.vue';

xit.add({
  command: 'ROUTEPICK',
  name: '选择飞船',
  description: '为非循环路线选择空闲飞船。',
  component: () => RoutePickWindow,
  bufferSize: [360, 280],
});
