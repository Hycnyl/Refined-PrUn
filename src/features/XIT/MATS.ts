import MATS from '@src/features/XIT/MATS.vue';

xit.add({
  command: 'MATS',
  name: '材料',
  description: '材料列表。',
  optionalParameters: '材料类别或材料代码（可多个）',
  component: () => MATS,
});
