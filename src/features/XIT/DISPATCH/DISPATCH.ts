import '@src/features/XIT/ACT/actions/cx-buy/cx-buy';
import '@src/features/XIT/ACT/actions/mtra/mtra';
import '@src/features/XIT/ACT/material-groups/resupply/resupply';
import '@src/features/XIT/ACT/material-groups/repair/repair';

import DISPATCH from '@src/features/XIT/DISPATCH/DISPATCH.vue';

xit.add({
  command: ['DISPATCH', 'DSP'],
  name: '调度',
  description: '为整个舰队规划补给和维修。',
  component: () => DISPATCH,
  bufferSize: [800, 500],
});
