import CONTS from '@src/features/XIT/CONTS/CONTS.vue';

xit.add({
  command: ['CONTS', 'CONTRACTS'],
  name: '进行中的合同',
  description: '显示进行中的合同。',
  contextItems: () => [{ cmd: 'XIT CONTC' }, { cmd: 'CONTS' }, { cmd: 'CONTD' }],
  component: () => CONTS,
});
