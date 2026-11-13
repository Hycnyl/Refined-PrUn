import FINBS from '@src/features/XIT/FINBS/FINBS.vue';

xit.add({
  command: ['FINBS'],
  name: '资产负债表',
  description: '显示资产和负债的详细报表。',
  contextItems: () => [
    { cmd: 'XIT FIN' },
    { cmd: 'XIT FINPR' },
    { cmd: 'XIT FINCH' },
    { cmd: 'XIT SET FIN' },
  ],
  component: () => FINBS,
});
