import $style from './table-rows-alternating-colors.module.css';

function init() {
  applyCssRule('table', $style.table);
}

features.add(import.meta.url, init, '为所有表格的偶数行应用浅色背景');
