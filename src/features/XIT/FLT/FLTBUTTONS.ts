import FLTBUTTONS from './FLTBUTTONS.vue';

xit.add({
  command: ['FLTBUTTONS', 'FLTCOLORS'],
  name: '舰队按钮颜色',
  description: '设置 XIT FLT 中基地及交易所飞船在空载或载货时的卸货按钮颜色。',
  component: () => FLTBUTTONS,
  bufferSize: [360, 280],
});
