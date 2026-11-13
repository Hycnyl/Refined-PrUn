import '@src/features/XIT/ACT/actions/refuel/refuel';

import RefuelActWindow from '@src/features/XIT/ACT/actions/refuel/RefuelActWindow.vue';

xit.add({
  command: 'REFUELACT',
  name: '交易所飞船批量加油',
  description: '为停靠在交易所的所有飞船执行加油动作包。',
  component: () => RefuelActWindow,
});
