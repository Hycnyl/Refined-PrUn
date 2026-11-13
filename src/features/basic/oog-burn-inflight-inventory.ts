import { setInboundShipInventoryEnabled } from '@src/core/burn';

function init() {
  setInboundShipInventoryEnabled(true);
}

features.add(import.meta.url, init, 'BURN：计算剩余天数时计入飞行中飞船的库存');
