import PLANETS from '@src/features/XIT/PLANETS/PLANETS.vue';

xit.add({
  command: ['PLANETS', 'PLNT', 'PLS'],
  name: '基地星球',
  description: '按基地星球设置补给天数、收货飞船容量和维修目标。',
  component: () => PLANETS,
  bufferSize: [700, 400],
});
