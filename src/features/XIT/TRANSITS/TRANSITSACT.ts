import '@src/features/XIT/TRANSITS/route-test';

import TransitsActWindow from '@src/features/XIT/TRANSITS/TransitsActWindow.vue';

xit.add({
  command: 'TRANSITSACT',
  name: '执行航程计算',
  description: '逐段使用飞船蓝图试飞已准备好的路线。',
  component: () => TransitsActWindow,
});
