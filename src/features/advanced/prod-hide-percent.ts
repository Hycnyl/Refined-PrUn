import css from '@src/utils/css-utils.module.css';

function init() {
  applyCssRule('PROD', `.${C.OrderStatus.inProgress}`, css.hidden);
}

features.add(import.meta.url, init, 'PROD : 在订单列表中隐藏百分比值');
