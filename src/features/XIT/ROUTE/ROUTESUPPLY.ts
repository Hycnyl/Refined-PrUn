import '@src/features/XIT/ACT/actions/cx-buy/cx-buy';
import '@src/features/XIT/ACT/material-groups/manual/manual';

import RestockWindow from '@src/features/XIT/ROUTE/RestockWindow.vue';

xit.add({
  command: 'ROUTESUPPLY',
  name: '路线补货',
  description: '购买路线补给天数内即将出发的各轮路线所需物资。',
  optionalParameters: '交易所代码',
  component: () => RestockWindow,
});
