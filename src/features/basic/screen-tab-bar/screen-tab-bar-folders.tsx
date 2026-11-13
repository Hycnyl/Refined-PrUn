import FolderCreator from './FolderCreator.vue';
import FldrButton from './FldrButton.vue';

function onContainerReady(container: HTMLElement) {
  let fldrInserted = false;
  subscribe($$(container, C.HeadItem.label), label => {
    if (fldrInserted || label.textContent !== 'FULL') {
      return;
    }
    const fullItem = label.closest(`.${C.HeadItem.container}`) as HTMLElement | null;
    if (!fullItem) {
      return;
    }
    fldrInserted = true;
    createFragmentApp(FldrButton).before(fullItem);
  });
}

function init() {
  subscribe($$(document, C.ScreenControls.container), onContainerReady);
  xit.add({
    command: 'FLDR',
    name: '新建文件夹',
    description: '创建屏幕文件夹。',
    component: () => FolderCreator,
    bufferSize: [450, 110],
  });
}

features.add(import.meta.url, init, '为屏幕标签栏增加文件夹管理');
