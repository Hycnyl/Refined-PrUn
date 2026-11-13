import { setRepairButtonEnabled } from '@src/features/XIT/REP/repair-button';

function init() {
  setRepairButtonEnabled(true);
}

features.add(import.meta.url, init, 'REP：在命令列显示维修按钮，打开对应星球的 XIT REPAIRACT');
