import NOTE from '@src/features/XIT/NOTE/NOTE.vue';

xit.add({
  command: ['NOTE', 'NOTES'],
  name: '个人笔记',
  description: '个人笔记工具。',
  optionalParameters: '笔记编号或名称',
  component: () => NOTE,
});
