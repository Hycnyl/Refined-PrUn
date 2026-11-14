// Translates display labels while preserving command, storage and protocol values.
const labels: Record<string, string> = {
  Manual: '手动',
  Resupply: '补给',
  Repair: '维修',
  Paste: '粘贴',
  'CX Buy': '购买 (CX Buy)',
  MTRA: '转账/转移 (MTRA)',
  Refuel: '加油 (Refuel)',
  'CONT Ship': '货运合同',
  'CONT Trade': '交易合同',
  'GovBurn Data': '星球维护数据',
  'Staging RT': 'RT 路线',
  'Configure on Execution': '执行时配置',
  'CX Buy Only': '仅交易所购买',
  'All Exchanges': '所有交易所',
  'Auto Offload': '自动卸货',
  'Item xfer': '材料转移',
  'Buy Missing Materials': '购买缺失材料',
  'Select your ship in the "To" field ↓': '在下方“目的地”字段选择飞船 ↓',
  'Refuel All Exchanges': '交易所飞船批量加油',
  Dispatch: '调度',
  GovBurn: '星球维护',
  Collect: '收集',
  'GovBurn Data All': '收集全部星球维护数据',
  'Build route': '创建路线',
  'Staging RT new route': '新建 RT 路线',
  'Route Restock': '路线补货',
  'Route Assign': '路线分配',
  BUYING: '买入',
  SELLING: '卖出',
  Workforce: '劳动力',
  All: '全部',
  Production: '生产',
  Fuel: '燃料',
  None: '无',
  DOCKED: '已停靠',
  EMPTY: '空载',
  PARTIAL: '部分装载',
  FULL: '满载',
  UNK: '未知',
  '<1H': '少于 1 小时',
  '1-6H': '1–6 小时',
  '6-24H': '6–24 小时',
  '24H+': '24 小时以上',
  '6-12H': '6–12 小时',
  '12-24H': '12–24 小时',
  '>24H': '超过 24 小时',
  both: '消耗品/原料',
  consumable: '消耗品',
  input: '原料',
  output: '产出',
  workforce: '劳动力',
  repair: '维修',
  INFO: '信息',
  ACTION: '操作',
  SUCCESS: '成功',
  ERROR: '错误',
  SKIP: '跳过',
  WARNING: '警告',
  CANCEL: '取消',
  'not-loaded': '未加载',
  partial: '部分',
  complete: '完整',
  idle: '空闲',
  connecting: '连接中',
  authenticating: '认证中',
  connected: '已连接',
  disconnected: '已断开',
  error: '错误',
  seconds: '秒',
  minutes: '分钟',
  hours: '小时',
  days: '天',
};

export function localizeLabel(value: string) {
  return Object.hasOwn(labels, value) ? labels[value] : value;
}

const storageSuffixes: Record<string, string> = {
  'STL Store': 'STL 燃料箱',
  'FTL Store': 'FTL 燃料箱',
  Cargo: '货舱',
  Base: '基地',
  Warehouse: '仓库',
};

export function localizeStorage(value: string) {
  return localizeLabel(value).replace(
    / (STL Store|FTL Store|Cargo|Base|Warehouse)$/,
    (_, suffix: string) => ` ${storageSuffixes[suffix]}`,
  );
}

export function localizeOptions(
  options: (string | { label: string; value: string })[],
  format = localizeLabel,
) {
  return options.map(x =>
    typeof x === 'string'
      ? { value: x, label: format(x) }
      : { value: x.value, label: format(x.label) },
  );
}

export function localizeName(value: string) {
  return localizeLabel(value)
    .replace(/^Base Resupply /, '基地补给 ')
    .replace(/^Burn Resupply: /, '消耗补给：')
    .replace(/^GovBurn Resupply /, '星球维护补给 ')
    .replace(/^GovBurn Data /, '星球维护数据 ')
    .replace(/^Repair: /, '维修：')
    .replace(/^LOWSTRIFE: /, '飞船装载：')
    .replace(/^Route buy /, '路线采购 ')
    .replace(/^Restock /, '补货 ')
    .replace(/^CX Buy /, '交易所购买 ')
    .replace(/^Collect /, '收集 ')
    .replace(/^Staging RT /, 'RT 路线 ');
}
