import '@src/features/XIT/TRANSITS/route-test';

import TransitsWindow from '@src/features/XIT/TRANSITS/TRANSITS.vue';

xit.add({
  command: 'TRANSITS',
  name: '航程计算',
  description: '通过蓝图试飞计算星球或交易所路线各航段的时间和燃料。',
  component: () => TransitsWindow,
  bufferSize: [520, 480],
});
