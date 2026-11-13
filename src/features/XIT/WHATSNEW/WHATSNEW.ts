import WHATSNEW from '@src/features/XIT/WHATSNEW/WHATSNEW.vue';

xit.add({
  command: 'WHATSNEW',
  name: '更新日志',
  description: 'Refined PrUn 版本更新说明。',
  component: () => WHATSNEW,
  bufferSize: [500, 500],
});
