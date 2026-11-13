import Agent from './Agent.vue';
import ExecuteStoredPackage from './ExecuteStoredPackage.vue';

xit.add({
  command: ['AGENT', 'AGT'],
  name: '同步代理',
  description: '列出通过 refined-agent 私人频道同步的动作包。',
  optionalParameters: '消息 ID',
  component: params => (params.length > 0 ? ExecuteStoredPackage : Agent),
});
