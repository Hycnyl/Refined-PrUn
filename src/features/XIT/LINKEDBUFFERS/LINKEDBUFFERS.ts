import LINKEDBUFFERS from '@src/features/XIT/LINKEDBUFFERS/LINKEDBUFFERS.vue';
import EditPreset from '@src/features/XIT/LINKEDBUFFERS/EditPreset.vue';
import { userData } from '@src/store/user-data';
import { isEmpty } from 'ts-extras';

function findPreset(parameters: string[]) {
  const byId = userData.linkedBuffersPresets.find(x => x.id.startsWith(parameters[0]));
  if (byId) {
    return byId;
  }
  return userData.linkedBuffersPresets.find(x => x.name === parameters.join(' '));
}

function isEditMode(parameters: string[]) {
  return parameters[0]?.toUpperCase() === 'EDIT';
}

xit.add({
  command: ['LINKEDBUFFERS', 'LB'],
  name: parameters => {
    if (isEmpty(parameters)) {
      return '联动窗口';
    }
    if (isEditMode(parameters)) {
      const preset = findPreset(parameters.slice(1));
      return preset ? `编辑联动窗口：${preset.name}` : '编辑联动窗口';
    }
    const preset = findPreset(parameters);
    return preset ? `联动窗口：${preset.name}` : '联动窗口';
  },
  description: '打开由文本输入驱动的联动窗口面板。',
  optionalParameters: '预设名称',
  component: parameters => {
    if (isEditMode(parameters)) {
      return EditPreset;
    }
    return LINKEDBUFFERS;
  },
  bufferSize: [205, 400],
});
