import $style from './always-visible-tile-controls.module.css';
import css from '@src/utils/css-utils.module.css';

function init() {
  applyCssRule(`.${C.TileControls.container} > .${C.TileControls.icon}`, css.hidden);
  applyCssRule(`.${C.TileControls.container} > .${C.TileControls.controls}`, $style.show);
}

features.add(import.meta.url, init, '使右上角的窗口控制按钮始终可见');
