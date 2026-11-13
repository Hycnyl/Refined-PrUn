import ELEC from '@src/features/XIT/ELEC/ELEC.vue';

xit.add({
  command: 'ELEC',
  name: '选举',
  description: '查看基地所在星球即将举行的选举。',
  component: () => ELEC,
});
