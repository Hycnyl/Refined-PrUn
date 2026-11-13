import { createCollectionSource, createRecordSource } from '@src/core/data-query/catalog';
import { DataCompleteness, DataSourceDescriptor, DataProvenance } from '@src/core/data-query/types';
import { getPlanetBurnPassive } from '@src/core/burn';
import { calculateBuildingEntries, calculateShipEntries } from '@src/core/repair';
import { alertsStore } from '@src/infrastructure/prun-api/data/alerts';
import { balancesStore } from '@src/infrastructure/prun-api/data/balances';
import { blueprintsStore } from '@src/infrastructure/prun-api/data/blueprints';
import { companyStore } from '@src/infrastructure/prun-api/data/company';
import { contractDraftsStore } from '@src/infrastructure/prun-api/data/contract-drafts';
import { contractsStore } from '@src/infrastructure/prun-api/data/contracts';
import { corporationHoldingsStore } from '@src/infrastructure/prun-api/data/corporation-holdings';
import { cxobStore } from '@src/infrastructure/prun-api/data/cxob';
import { cxosStore } from '@src/infrastructure/prun-api/data/cxos';
import { cxpcStore } from '@src/infrastructure/prun-api/data/cxpc';
import { exchangesStore } from '@src/infrastructure/prun-api/data/exchanges';
import { expertsStore } from '@src/infrastructure/prun-api/data/experts';
import { flightPlansStore } from '@src/infrastructure/prun-api/data/flight-plans';
import { flightsStore } from '@src/infrastructure/prun-api/data/flights';
import { fxobStore } from '@src/infrastructure/prun-api/data/fxob';
import { fxosStore } from '@src/infrastructure/prun-api/data/fxos';
import { localAdsStore } from '@src/infrastructure/prun-api/data/local-ads';
import { materialCategoriesStore } from '@src/infrastructure/prun-api/data/material-categories';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';
import { planetsStore } from '@src/infrastructure/prun-api/data/planets';
import { productionStore } from '@src/infrastructure/prun-api/data/production';
import { request } from '@src/infrastructure/prun-api/data/request-hooks';
import { sectorsStore } from '@src/infrastructure/prun-api/data/sectors';
import { shipsStore } from '@src/infrastructure/prun-api/data/ships';
import { shipyardProjectsStore } from '@src/infrastructure/prun-api/data/shipyard-projects';
import { shipyardsStore } from '@src/infrastructure/prun-api/data/shipyards';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { starsStore } from '@src/infrastructure/prun-api/data/stars';
import { stationsStore } from '@src/infrastructure/prun-api/data/stations';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { usersStore } from '@src/infrastructure/prun-api/data/users';
import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { workforcesStore } from '@src/infrastructure/prun-api/data/workforces';
import { userData } from '@src/store/user-data';

const fioWarning = '仅供参考：星球数据来自 FIO 备用数据，可能过时。PrUn 实时消息仅更新部分字段。';

interface EntitySourceOptions {
  id: string;
  label: string;
  description: string;
  provenance?: DataProvenance;
  partial?: boolean;
  warning?: string;
  store: {
    all: Ref<unknown[] | undefined>;
    fetched: Ref<boolean>;
  };
  load?: DataSourceDescriptor['load'];
}

function entitySource(options: EntitySourceOptions) {
  const {
    description,
    id,
    label,
    load,
    partial = false,
    provenance = 'prun-live',
    store,
    warning,
  } = options;
  return createCollectionSource({
    id,
    label,
    description,
    provenance,
    completeness: fetchedCompleteness(store.fetched, partial),
    snapshot: () => store.all.value,
    ...(warning ? { warning } : {}),
    ...(load ? { load } : {}),
  });
}

function fetchedCompleteness(fetched: Ref<boolean>, partial = false) {
  return (): DataCompleteness => {
    if (!fetched.value) {
      return 'not-loaded';
    }
    return partial ? 'partial' : 'complete';
  };
}

const blueprintsState = blueprintsStore.peek();
const shipyardProjectsState = shipyardProjectsStore.peek();

function getBurnRows() {
  return sitesStore.all.value?.map(getPlanetBurnPassive).filter(x => x !== undefined);
}

function getBurnCompleteness(): DataCompleteness {
  const sites = sitesStore.all.value;
  if (sites === undefined) {
    return 'not-loaded';
  }
  const rowCount = getBurnRows()?.length ?? 0;
  if (sites.length > 0 && rowCount === 0) {
    return 'not-loaded';
  }
  return rowCount === sites.length ? 'complete' : 'partial';
}

export const gameDataSources: DataSourceDescriptor[] = [
  entitySource({
    id: 'alerts',
    label: '通知',
    description: '从 PrUn 获取的当前公司通知。',
    store: alertsStore,
  }),
  entitySource({
    id: 'balances',
    label: '余额',
    description: '从 PrUn 获取的当前公司货币余额。',
    store: balancesStore,
  }),
  entitySource({
    id: 'blueprints',
    label: '蓝图',
    description: '从 PrUn 加载的飞船蓝图。',
    store: blueprintsState,
    load: { execute: () => request.blueprints() },
  }),
  createCollectionSource({
    id: 'burn',
    label: '消耗',
    description: '计算得到的公司各基地消耗数据。',
    provenance: 'prun-live',
    completeness: getBurnCompleteness,
    snapshot: getBurnRows,
  }),
  createRecordSource({
    id: 'company',
    label: '公司',
    description: '从 PrUn 获取的当前公司记录。',
    provenance: 'prun-live',
    completeness: () => (companyStore.value === undefined ? 'not-loaded' : 'complete'),
    snapshotRecord: () => companyStore.value,
  }),
  entitySource({
    id: 'contract-drafts',
    label: '合同草稿',
    description: '从 PrUn 获取的合同草稿。',
    store: contractDraftsStore,
  }),
  entitySource({
    id: 'contracts',
    label: '合同',
    description: '从 PrUn 获取的公司合同。',
    store: contractsStore,
  }),
  entitySource({
    id: 'corporation-holdings',
    label: '集团持股',
    description: '从 PrUn 获取的集团股东持股记录。',
    store: corporationHoldingsStore,
  }),
  entitySource({
    id: 'cx-order-books',
    label: '商品交易所订单簿',
    description: '各材料市场的商品交易所订单簿快照。',
    store: cxobStore,
    partial: true,
  }),
  entitySource({
    id: 'cx-orders',
    label: '商品交易所订单',
    description: '公司的商品交易所订单。',
    store: { all: cxosStore.passiveAll, fetched: cxosStore.fetched },
    load: { execute: () => request.cxos() },
  }),
  entitySource({
    id: 'cx-prices',
    label: '商品交易所价格',
    description: '各市场的商品交易所价格历史。',
    store: cxpcStore,
    partial: true,
  }),
  entitySource({
    id: 'exchanges',
    label: '交易所',
    description: '内置商品交易所默认数据，并以 PrUn 实时数据更新。',
    provenance: 'prun-live-with-defaults',
    store: exchangesStore,
  }),
  entitySource({
    id: 'experts',
    label: '专家',
    description: '访问专家界面时获取的基地专家记录。',
    store: expertsStore,
    partial: true,
  }),
  entitySource({
    id: 'flight-plans',
    label: '航行计划',
    description: '访问飞行控制时获取的飞船航行计划。',
    store: flightPlansStore,
    partial: true,
  }),
  entitySource({
    id: 'flights',
    label: '航行',
    description: '从 PrUn 获取的当前公司航行记录。',
    store: flightsStore,
  }),
  entitySource({
    id: 'fx-order-books',
    label: '外汇订单簿',
    description: '各货币对的外汇订单簿快照。',
    store: fxobStore,
    partial: true,
  }),
  entitySource({
    id: 'fx-orders',
    label: '外汇订单',
    description: '公司的外汇订单。',
    store: { all: fxosStore.passiveAll, fetched: fxosStore.fetched },
    load: { execute: () => request.fxos() },
  }),
  entitySource({
    id: 'local-ads',
    label: '本地广告',
    description: '各地点的本地市场广告。',
    store: localAdsStore,
    partial: true,
  }),
  entitySource({
    id: 'material-categories',
    label: '材料类别',
    description: 'PrUn 材料类别及对应材料定义。',
    store: materialCategoriesStore,
  }),
  entitySource({
    id: 'materials',
    label: '材料',
    description: 'PrUn 材料定义。',
    store: materialsStore,
  }),
  createRecordSource({
    id: 'planet-settings',
    label: '星球设置',
    description: '全局和各星球的原始消耗与维修设置。',
    provenance: 'prun-live',
    completeness: () => 'complete',
    snapshotRecord: () => ({
      burn: {
        red: userData.settings.burn.red,
        yellow: userData.settings.burn.yellow,
        resupply: userData.settings.burn.resupply,
        planetResupply: userData.settings.burn.planetResupply,
        planetPickup: userData.settings.burn.planetPickup,
        planetCxExchange: userData.settings.burn.planetCxExchange,
      },
      repair: {
        threshold: userData.settings.repair.threshold,
        red: userData.settings.repair.red,
        yellow: userData.settings.repair.yellow,
        countdown: userData.settings.repair.countdown,
        planetOverrides: userData.settings.repair.planetOverrides,
      },
    }),
  }),
  entitySource({
    id: 'planets',
    label: '星球',
    description: 'FIO 星球备用数据，并以部分 PrUn 实时字段更新。',
    provenance: 'fio-reference-with-prun-overrides',
    warning: fioWarning,
    store: planetsStore,
  }),
  createCollectionSource({
    id: 'production',
    label: '生产设施',
    description: '全局或主动加载基地的生产线数据。',
    provenance: 'prun-live',
    completeness: () => {
      if (!productionStore.fetched.value) {
        return 'not-loaded';
      }
      return productionStore.fetchedAll.value ? 'complete' : 'partial';
    },
    snapshot: () => productionStore.all.value,
    load: {
      parameter: 'siteId',
      execute: siteId => loadSiteData(siteId, request.production),
    },
  }),
  createCollectionSource({
    id: 'repair',
    label: '维修',
    description: '计算得到的建筑和飞船维修记录。',
    provenance: 'prun-live',
    completeness: () => {
      const sitesFetched = sitesStore.fetched.value;
      const shipsFetched = shipsStore.fetched.value;
      if (!sitesFetched && !shipsFetched) {
        return 'not-loaded';
      }
      return sitesFetched && shipsFetched ? 'complete' : 'partial';
    },
    snapshot: () => {
      const buildingEntries = calculateBuildingEntries(sitesStore.all.value);
      const shipEntries = calculateShipEntries(shipsStore.all.value);
      if (buildingEntries === undefined) {
        return shipEntries;
      }
      if (shipEntries === undefined) {
        return buildingEntries;
      }
      return [...buildingEntries, ...shipEntries];
    },
  }),
  entitySource({
    id: 'sectors',
    label: '星区',
    description: '从 PrUn 获取的宇宙星区。',
    store: sectorsStore,
  }),
  entitySource({
    id: 'ships',
    label: '飞船',
    description: '从 PrUn 获取的当前公司飞船。',
    store: shipsStore,
  }),
  entitySource({
    id: 'shipyard-projects',
    label: '船坞项目',
    description: '从 PrUn 加载的船坞项目。',
    store: shipyardProjectsState,
    load: { execute: () => request.shipyardProjects() },
  }),
  entitySource({
    id: 'shipyards',
    label: '船坞',
    description: '从 PrUn 加载的船坞。',
    store: shipyardsStore,
    load: { execute: () => request.shipyards() },
  }),
  entitySource({
    id: 'sites',
    label: '基地',
    description: '从 PrUn 获取的公司基地、平台和基地数据。',
    store: sitesStore,
  }),
  entitySource({
    id: 'stars',
    label: '恒星',
    description: '从 PrUn 获取的宇宙恒星系。',
    store: starsStore,
  }),
  entitySource({
    id: 'stations',
    label: '空间站',
    description: '内置空间站默认数据，并以 PrUn 实时数据更新。',
    provenance: 'prun-live-with-defaults',
    store: stationsStore,
  }),
  entitySource({
    id: 'storages',
    label: '库存',
    description: '从 PrUn 获取的公司库存及存储内容。',
    store: storagesStore,
  }),
  entitySource({
    id: 'users',
    label: '用户',
    description: '浏览 PrUn 时获取的用户记录。',
    store: usersStore,
    partial: true,
  }),
  entitySource({
    id: 'warehouses',
    label: '仓库',
    description: '从 PrUn 获取的公司仓库记录。',
    store: warehousesStore,
  }),
  entitySource({
    id: 'workforces',
    label: '劳动力',
    description: '主动访问或加载基地时获取的劳动力数据。',
    store: workforcesStore,
    partial: true,
    load: {
      parameter: 'siteId',
      execute: siteId => loadSiteData(siteId, request.workforce),
    },
  }),
];

function loadSiteData(siteId: string | undefined, load: (siteId: string) => void) {
  const site = sitesStore.getById(siteId);
  if (!site) {
    throw Error(`未知基地 ID：“${siteId ?? ''}".`);
  }
  load(site.siteId);
}
