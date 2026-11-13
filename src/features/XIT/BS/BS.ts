import BS from '@src/features/XIT/BS/BS.vue';

xit.add({
  command: 'BS',
  name: '基地概览',
  description: '列出所有玩家基地及常用基地命令链接。',
  optionalParameters: '星球编号（可多个）',
  component: () => BS,
  bufferSize: [660, 300],
});
