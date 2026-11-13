import HELP from '@src/features/XIT/HELP.vue';
import AgentHelp from '@src/features/XIT/HELP/AgentHelp.vue';

xit.add({
  command: 'HELP',
  name: '帮助',
  description: 'Refined PrUn 入门帮助。',
  optionalParameters: 'Command',
  component: params => {
    switch (params[0]?.toUpperCase()) {
      case 'AGT':
      case 'AGENT':
        return AgentHelp;
      default:
        return HELP;
    }
  },
});
