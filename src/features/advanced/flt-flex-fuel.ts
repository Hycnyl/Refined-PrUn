import $style from './flt-flex-fuel.module.css';

function init() {
  applyCssRule(['FLT', 'FLTS', 'FLTP'], `.${C.ShipFuel.container}`, $style.fuelFlex);
}

features.add(import.meta.url, init, 'FLT：让燃料列布局更充分地利用可用空间');
