import RtActWindow from '@src/features/XIT/RTACT/RtActWindow.vue';

xit.add({
  command: 'RTACT',
  name: 'RT 路线',
  description: '按有序站点列表创建 RT 路线。',
  bufferSize: [640, 560],
  component: () => RtActWindow,
});
