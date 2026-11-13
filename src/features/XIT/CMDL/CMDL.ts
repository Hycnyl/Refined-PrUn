import CMDL from '@src/features/XIT/CMDL/CMDL.vue';

xit.add({
  command: 'CMDL',
  name: '指令列表',
  description: '自定义指令快捷链接列表。',
  optionalParameters: '列表编号或名称',
  component: () => CMDL,
});
