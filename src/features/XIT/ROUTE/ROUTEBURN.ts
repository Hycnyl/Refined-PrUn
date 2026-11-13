import ROUTEBURN from '@src/features/XIT/ROUTE/ROUTEBURN.vue';

xit.add({
  command: 'ROUTEBURN',
  name: '路线消耗',
  description: '每条运输路线一行，显示最低补给、生产和维修余量。',
  component: () => ROUTEBURN,
  bufferSize: [504, 360],
});
