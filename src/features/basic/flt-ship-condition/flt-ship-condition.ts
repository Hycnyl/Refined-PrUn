import { refPrunId } from '@src/infrastructure/prun-ui/attributes';
import ShipCondition from './ShipCondition.vue';

function onTileReady(tile: PrunTile) {
  subscribe($$(tile.anchor, 'tr'), row => {
    createFragmentApp(
      ShipCondition,
      reactive({
        id: refPrunId(row),
      }),
    ).appendTo(row.children[0]);
  });
}

function init() {
  tiles.observe(['FLT', 'FLTS', 'FLTP'], onTileReady);
}

features.add(import.meta.url, init, 'FLT：在“名称”列增加飞船状况标签');
