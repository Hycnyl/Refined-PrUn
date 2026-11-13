import DEV from '@src/features/XIT/DEV/DEV.vue';

xit.add({
  command: 'DEV',
  name: '开发工具',
  description: '开发工具菜单。',
  component: () => DEV,
});
