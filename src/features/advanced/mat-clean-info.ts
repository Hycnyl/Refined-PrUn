import css from '@src/utils/css-utils.module.css';

function onTileReady(tile: PrunTile) {
  subscribe($$(tile.anchor, C.FormComponent.containerPassive), async container => {
    const label = await $(container, 'label');
    if (
      label?.textContent === L.MaterialInformation.ticker() ||
      label?.textContent === L.MaterialInformation.resource()
    ) {
      container.classList.add(css.hidden);
      return;
    }
  });
}

function init() {
  tiles.observe('MAT', onTileReady);
}

features.add(import.meta.url, init, 'MAT：隐藏“代码”和“自然资源”字段');
