import CHAT from '@src/features/XIT/CHAT.vue';

xit.add({
  command: 'CHAT',
  name: 'FIO 聊天',
  description: '只读查看星球聊天。',
  mandatoryParameters: '星球编号',
  component: () => CHAT,
});
