import css from '@src/utils/css-utils.module.css';

function init() {
  applyCssRule(`.${C.ContextControls.item}:hover .${C.ContextControls.label}`, css.hidden);
}

features.add(import.meta.url, init, '禁用悬停时显示上下文控件描述');
