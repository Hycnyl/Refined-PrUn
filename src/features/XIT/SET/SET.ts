import PMMG from '@src/features/XIT/SET/PMMG.vue';
import FINMERGE from '@src/features/XIT/SET/FINMERGE.vue';
import SET from '@src/features/XIT/SET/SET.vue';

xit.add({
  command: ['SET', 'SETTINGS'],
  name: 'Refined PrUn 设置',
  description: 'Refined PrUn 设置。',
  optionalParameters: '设置页编号',
  component: parameters => {
    switch (parameters[0]?.toUpperCase()) {
      case 'PMMG':
        return PMMG;
      case 'FINMERGE':
        return FINMERGE;
      default:
        return SET;
    }
  },
});
