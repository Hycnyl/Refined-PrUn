async function focusSearchBar(tile: PrunTile) {
  // Only parameter-less commands have the search bar.
  if (tile.parameter) {
    return;
  }
  if (tile.docked) {
    return;
  }
  const input = await $(tile.anchor, 'input');
  input.focus();
}

function init() {
  tiles.observe(['PLI', 'SYSI'], focusSearchBar);
}

features.add(import.meta.url, init, '在 PLI 和 SYSI 中自动聚焦搜索栏');
