import { setActAutoCloseEnabled } from '@src/features/XIT/ACT/auto-close';

function init() {
  setActAutoCloseEnabled(true);
}

features.add(
  import.meta.url,
  init,
  '动作包执行完成后自动关闭对应窗口（XIT ACT、DISPATCHACT、BURNACT、REPAIRACT、' +
    'GOVBURNEXEC 等）',
);
