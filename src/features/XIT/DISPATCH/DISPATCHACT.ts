import '@src/features/XIT/ACT/actions/cx-buy/cx-buy';
import '@src/features/XIT/ACT/actions/mtra/mtra';
import '@src/features/XIT/ACT/actions/refuel/refuel';
import '@src/features/XIT/ACT/material-groups/resupply/resupply';
import '@src/features/XIT/ACT/material-groups/repair/repair';

import DispatchActWindow from '@src/features/XIT/DISPATCH/DispatchActWindow.vue';

xit.add({
  command: ['DISPATCHACT', 'DISPATCHEXEC'],
  name: '执行调度',
  description: '执行已准备好的调度补给或维修动作包。',
  component: () => DispatchActWindow,
});
