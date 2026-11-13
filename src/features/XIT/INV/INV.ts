import INV from './INV.vue';

xit.add({
  command: 'INV',
  name: '库存列表',
  description: '列出所有库存及容量条，并按类型筛选。',
  component: () => INV,
  bufferSize: [620, 400],
});
