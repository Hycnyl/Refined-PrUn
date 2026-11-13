import FLT from './FLT.vue';
import { formatFltLocationFilter, resolveFltLocationFilter } from './location-filter';

xit.add({
  command: ['FLT', 'FLEET'],
  name: parameters => {
    const filter = resolveFltLocationFilter(parameters);
    if (filter !== undefined) {
      return `舰队 — ${formatFltLocationFilter(filter)}`;
    }
    return '舰队';
  },
  description:
    '增强舰队表格，显示详细状态、货物、燃料和快捷操作。可使用星系或星球编号筛选列表，例如 XIT FLT ANT。',
  optionalParameters: '星系或星球编号',
  component: () => FLT,
  bufferSize: [500, 300],
});
