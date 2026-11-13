import '@src/features/XIT/ACT/actions/cx-buy/cx-buy';
import '@src/features/XIT/ACT/material-groups/manual/manual';
import '@src/features/XIT/ROUTE/RT_ASSIGN';

import RouteBuyWindow from '@src/features/XIT/ROUTE/RouteBuyWindow.vue';

xit.add({
  command: 'ROUTEBUY',
  name: '路线采购',
  description: '购买非循环路线所缺物资，然后分配飞船。',
  component: () => RouteBuyWindow,
  bufferSize: [640, 480],
});
