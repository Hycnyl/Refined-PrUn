import './actions/cx-buy/cx-buy';
import './actions/mtra/mtra';
import './actions/refuel/refuel';
import './actions/cont-ship/cont-ship';
import './actions/cont-trade/cont-trade';

import './material-groups/repair/repair';
import './material-groups/resupply/resupply';
import './material-groups/manual/manual';
import './material-groups/paste/paste';

import ACT from '@src/features/XIT/ACT/ACT.vue';

xit.add({
  command: ['ACT', 'ACTION'],
  name: parameters => {
    if (parameters.length === 0) {
      return '自动化动作包';
    }
    if (parameters[0].toUpperCase() == 'GEN' || parameters[0].toUpperCase() == 'EDIT') {
      return '编辑动作包';
    }
    return '执行动作包';
  },
  description: '自动化执行特定任务。',
  optionalParameters: 'GEN 和/或动作包名称',
  contextItems: parameters => (parameters.length > 0 ? [{ cmd: 'XIT ACT' }] : []),
  component: () => ACT,
});
