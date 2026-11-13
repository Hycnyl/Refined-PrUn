function onTileReady(tile: PrunTile) {
  subscribe($$(tile.anchor, C.Message.controls), async controls => {
    const button = await $(controls, C.Button.btn);
    button.addEventListener('click', e => {
      if (e.shiftKey) {
        return;
      }

      button.setAttribute('data-tooltip', '请按住 Shift 再点击此按钮，防止误操作');
      button.setAttribute('data-tooltip-position', 'top');
      e.preventDefault();
      e.stopPropagation();
    });
  });
}

function init() {
  tiles.observe(['COMG', 'COMP', 'COMU'], onTileReady);
}

features.add(import.meta.url, init, '聊天中的删除按钮仅在按住 Shift 时生效');
