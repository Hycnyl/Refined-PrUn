import '@src/features/XIT/ACT/actions/mtra/mtra';
import '@src/features/XIT/ACT/material-groups/manual/manual';

import LowstrifeActWindow from '@src/features/XIT/LOWSTRIFE/LowstrifeActWindow.vue';

xit.add({
  command: 'LOWSTRIFEACT',
  name: '执行飞船装载',
  description: '执行 XIT LOWSTRIFE 准备的飞船装载动作包。',
  component: () => LowstrifeActWindow,
});
