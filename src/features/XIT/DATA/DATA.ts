import DATA from '@src/features/XIT/DATA/DATA.vue';

xit.add({
  command: 'DATA',
  name: '数据浏览器',
  description: '只读浏览 Refined PrUn 内存中的游戏和窗口数据。',
  optionalParameters: '来源 ID、本机连接地址、JSON',
  component: () => DATA,
  bufferSize: [1080, 720],
});
