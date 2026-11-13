import '@src/features/XIT/ACT/actions/cx-buy/cx-buy';
import '@src/features/XIT/ACT/actions/mtra/mtra';

import GovBurnExecWindow from '@src/features/XIT/GOVBURN/GovBurnExecWindow.vue';

xit.add({
  command: 'GOVBURNEXEC',
  name: '执行星球维护补给',
  description: '执行已准备好的星球维护补给动作包。',
  component: () => GovBurnExecWindow,
});
