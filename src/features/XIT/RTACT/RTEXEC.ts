import '@src/features/XIT/RTACT/rt-action';

import RtExecWindow from '@src/features/XIT/RTACT/RtExecWindow.vue';

xit.add({
  command: 'RTEXEC',
  name: '执行 RT 路线',
  description: '执行已准备好的 RT 路线。',
  component: () => RtExecWindow,
});
