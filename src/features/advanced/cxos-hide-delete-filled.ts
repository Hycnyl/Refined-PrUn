import css from '@src/utils/css-utils.module.css';

function init() {
  applyCssRule(
    'CXOS',
    `.${C.ActionBar.container} > .${C.ActionBar.element}:has(> .${C.CollapsibleSection.container}:not(.${C.CollapsibleSection.open})) + .${C.ActionBar.element}`,
    css.hidden,
  );
}

features.add(import.meta.url, init, 'CXOS：隐藏“删除已成交”按钮');
