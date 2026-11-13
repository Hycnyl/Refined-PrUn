import TODO from './TODO.vue';

xit.add({
  command: ['TODO'],
  name: '待办事项',
  description: '用待办事项列表安排计划。',
  optionalParameters: '待办列表编号或名称',
  component: () => TODO,
});
