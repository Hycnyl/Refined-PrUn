import { setCollapseLongContractCells } from '@src/features/XIT/CONTS/cap-contract-entries';

function init() {
  setCollapseLongContractCells(true);
}

features.add(
  import.meta.url,
  init,
  'XIT CONTS：标的物、对方进度和自身进度单元格过长时，仅显示前三项并以省略号收起其余内容',
);
