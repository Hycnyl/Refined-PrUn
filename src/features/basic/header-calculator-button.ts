import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import TileControlsButton from '@src/components/TileControlsButton.vue';

async function onTileReady(tile: PrunTile) {
  const tileControls = await $(tile.frame, C.TileFrame.controls);
  createFragmentApp(TileControlsButton, {
    icon: '\uf1ec',
    onClick: () => showBuffer('XIT CALC'),
    marginTop: 4,
  }).prependTo(tileControls);
  return;
}

function init() {
  tiles.observe(['LM', 'CX', 'XIT'], onTileReady);
}

features.add(import.meta.url, init, '在窗口标题栏增加计算器快捷按钮');
