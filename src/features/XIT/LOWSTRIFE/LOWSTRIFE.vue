<script setup lang="ts">
import { localizeLabel } from '@src/infrastructure/i18n/labels';
import { useXitParameters } from '@src/hooks/use-xit-parameters';
import { getPlanetBurn } from '@src/core/burn';
import { sortMaterials } from '@src/core/sort-materials';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import {
  getEntityNameFromAddress,
  getEntityNaturalIdFromAddress,
} from '@src/infrastructure/prun-api/data/addresses';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';
import { shipsStore } from '@src/infrastructure/prun-api/data/ships';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import { fixed02 } from '@src/utils/format';
import { getBaseStore } from '@src/core/store-id';
import Active from '@src/components/forms/Active.vue';
import Commands from '@src/components/forms/Commands.vue';
import NumberInput from '@src/components/forms/NumberInput.vue';
import Passive from '@src/components/forms/Passive.vue';
import SelectInput from '@src/components/forms/SelectInput.vue';
import CopyButton from '@src/components/CopyButton.vue';
import PrunButton from '@src/components/PrunButton.vue';
import SectionHeader from '@src/components/SectionHeader.vue';
import {
  computeLowstrifeLoad,
  lowstrifePackage,
  lowstrifeRole,
} from '@src/features/XIT/LOWSTRIFE/ship-loading';
import { stagedLowstrife } from '@src/features/XIT/LOWSTRIFE/staged';
import { useTileState } from '@src/features/XIT/LOWSTRIFE/tile-state';
import { getShipsAtCX } from '@src/features/XIT/DISPATCH/utils';
import PlanetSelector from '@src/components/forms/PlanetSelector.vue';
import RadioItem from '@src/components/forms/RadioItem.vue';
import { computeRepairBill } from '@src/features/XIT/ACT/material-groups/repair/bill';
import { userData } from '@src/store/user-data';
import type { BurnValues } from '@src/core/burn';

// Join all parameters in case a natural id was split on underscores by the XIT router.
const parameters = useXitParameters();
const planetParameter = parameters.join(' ');

// The selected base's natural id. A command parameter picks the base it names, otherwise
// the tile keeps its last pick, and a new tile starts on the last base picked anywhere.
const planet = useTileState('planet');
if (!planet.value) {
  planet.value = userData.lowstrife.lastPlanet;
}
watch(planet, value => {
  if (value) {
    userData.lowstrife.lastPlanet = value;
  }
});
// Sites can load after the tile opens, so apply the parameter once it resolves.
const parameterPlanet = computed(() => {
  const site = sitesStore.getByPlanetNaturalIdOrName(planetParameter);
  return site ? getEntityNaturalIdFromAddress(site.address) : undefined;
});
let parameterApplied = false;
watch(
  parameterPlanet,
  naturalId => {
    if (naturalId && !parameterApplied) {
      planet.value = naturalId;
      parameterApplied = true;
    }
  },
  { immediate: true },
);

const site = computed(() => sitesStore.getByPlanetNaturalId(planet.value));
const planetName = computed(() =>
  site.value ? getEntityNameFromAddress(site.value.address) : undefined,
);
const fullBurn = computed(() => getPlanetBurn(site.value)?.burn);

// Materials the user supplies separately. Sticky per planet across tiles.
const excluded = computed(() => userData.lowstrife.exclusions[planet.value ?? ''] ?? []);

function setExcluded(ticker: string, value: boolean) {
  const key = planet.value;
  if (!key) {
    return;
  }
  const next = excluded.value.filter(x => x !== ticker);
  if (value) {
    next.push(ticker);
  }
  if (next.length > 0) {
    userData.lowstrife.exclusions[key] = next;
  } else {
    delete userData.lowstrife.exclusions[key];
  }
}

const burn = computed(() => {
  if (!fullBurn.value) {
    return undefined;
  }
  const result: BurnValues = {};
  for (const [ticker, mat] of Object.entries(fullBurn.value)) {
    if (!excluded.value.includes(ticker)) {
      result[ticker] = mat;
    }
  }
  return result;
});

const shipName = useTileState('ship');
const consumableDays = useTileState('consumableDays');
const repair = useTileState('repair');
const repairOffset = useTileState('repairOffset');

// Every production building on the base, aged by the time offset. A zero day threshold
// is what makes the bill cover all of them.
const fullRepairBill = computed(() => {
  if (!repair.value || site.value === undefined) {
    return undefined;
  }
  return computeRepairBill(site.value, 0, repairOffset.value ?? 0);
});

const repairBill = computed(() => {
  if (fullRepairBill.value === undefined) {
    return undefined;
  }
  const result: Record<string, number> = {};
  for (const [ticker, amount] of Object.entries(fullRepairBill.value)) {
    if (!excluded.value.includes(ticker)) {
      result[ticker] = amount;
    }
  }
  return result;
});

// Only ships docked at an exchange can pick up the load.
const shipOptions = computed(() =>
  (getShipsAtCX() ?? [])
    .map(x => x.ship.name)
    .filter(x => !!x)
    .sort(),
);

watch(
  shipOptions,
  options => {
    if (options.length > 0 && !options.includes(shipName.value ?? '')) {
      shipName.value = options[0];
    }
  },
  { immediate: true },
);

const ship = computed(() => (shipName.value ? shipsStore.getByName(shipName.value) : undefined));

const freeCapacity = computed(() => {
  const store = storagesStore.getById(ship.value?.idShipStore);
  if (!store) {
    return { weight: 0, volume: 0 };
  }
  return {
    weight: Number((store.weightCapacity - store.weightLoad).toFixed(2)),
    volume: Number((store.volumeCapacity - store.volumeLoad).toFixed(2)),
  };
});

// Editable caps, re-seeded from the selected ship's free cargo space whenever it changes.
const maxWeight = ref<number | undefined>(0);
const maxVolume = ref<number | undefined>(0);
watch(
  freeCapacity,
  free => {
    maxWeight.value = free.weight;
    maxVolume.value = free.volume;
  },
  { immediate: true },
);

const baseSpace = computed(() => {
  const store = getBaseStore(planet.value);
  return store
    ? {
        weight: store.weightCapacity,
        volume: store.volumeCapacity,
      }
    : undefined;
});

const load = computed(() => {
  if (!burn.value) {
    return undefined;
  }
  return computeLowstrifeLoad({
    burn: burn.value,
    excludeDwFill: excluded.value.includes('DW'),
    consumableDays: consumableDays.value ?? 0,
    maxWeight: maxWeight.value ?? 0,
    maxVolume: maxVolume.value ?? 0,
    baseSpace: baseSpace.value,
    repair: repairBill.value,
    getMaterial: ticker => materialsStore.getByTicker(ticker),
  });
});

const roleLabels = { consumable: 'consumable', input: 'input', both: 'consumable + input' };

// Loaded materials plus the excluded ones, so an exclusion can be undone from the table.

const rows = computed(() => {
  const result = load.value;
  if (!result || !fullBurn.value) {
    return [];
  }
  const repairTickers = fullRepairBill.value ?? {};
  const tickers = new Set([
    ...Object.keys(result.materials),
    ...excluded.value.filter(
      x => fullBurn.value![x] !== undefined || repairTickers[x] !== undefined,
    ),
  ]);
  const materials = [...tickers].map(materialsStore.getByTicker).filter(x => x !== undefined);
  return sortMaterials(materials).map(x => {
    const burnTickers = fullBurn.value!;
    const isExcluded = excluded.value.includes(x.ticker);
    const burnRole =
      x.ticker in burnTickers ? roleLabels[lowstrifeRole(burnTickers[x.ticker])] : undefined;
    let role = burnRole ?? 'fill';
    if (x.ticker in repairTickers) {
      role = burnRole !== undefined ? `${burnRole} + 维修` : '维修';
    }
    return {
      ticker: x.ticker,
      amount: isExcluded ? 0 : result.materials[x.ticker],
      role,
      excluded: isExcluded,
    };
  });
});

const pkg = computed(() =>
  lowstrifePackage({
    planetName: planetName.value ?? planet.value ?? '',
    planetNaturalId: planet.value || undefined,
    shipName: shipName.value || undefined,
    materials: load.value?.materials ?? {},
  }),
);

const canExecute = computed(() => rows.value.length > 0 && load.value?.fits === true);

function copyJson() {
  return JSON.stringify(pkg.value);
}

function execute() {
  // Deep-clone to detach the staged package from this tile's reactivity.
  stagedLowstrife.value = JSON.parse(JSON.stringify(pkg.value));
  showBuffer('XIT LOWSTRIFEACT');
}
</script>

<template>
  <form>
    <Active label="星球" tooltip="要装载补给的目标基地，可输入文字筛选">
      <PlanetSelector v-model="planet" />
    </Active>
  </form>
  <div v-if="!site" :class="$style.summary">请选择基地。</div>
  <div v-else-if="!burn">正在加载消耗数据……</div>
  <template v-else>
    <form>
      <Active label="飞船" tooltip="要装载的飞船，下方容量上限初始值取其剩余货舱空间">
        <SelectInput v-model="shipName" :options="shipOptions" />
      </Active>
      <Active label="重量上限 (t)">
        <NumberInput v-model="maxWeight" float :class="$style.number" />
      </Active>
      <Active label="体积上限 (m³)">
        <NumberInput v-model="maxVolume" float :class="$style.number" />
      </Active>
    </form>
    <div :class="$style.break" />
    <form>
      <Active
        label="消耗品天数"
        tooltip="装载指定天数的劳动力消耗品，生产原料在此天数内尽量多装；设为 0 时，尽量装满生产原料，再用 DW 填满剩余空间">
        <NumberInput v-model="consumableDays" float :class="$style.number" />
      </Active>
      <template v-if="load">
        <Passive label="原料天数" tooltip="装载的生产原料天数">
          <span :class="$style.value">
            {{ load.inputDays === undefined ? '--' : fixed02(load.inputDays) }}
          </span>
        </Passive>
        <Passive
          label="生产天数"
          tooltip="卸下消耗品后，基地库存仍可容纳的生产原料或产品天数；降低消耗品天数可增加此值">
          <span v-if="load.productionLimit" :class="$style.value">
            ({{ load.productionLimit }})&nbsp;
          </span>
          <span :class="$style.value">
            {{ load.productionDays === undefined ? '--' : load.productionDays.toFixed(1) }}
          </span>
        </Passive>
        <Passive
          label="DW 填充"
          tooltip="额外装载 DW，填满飞船剩余空间；生产原料已满足全部消耗品天数时跳过">
          <span :class="$style.value">{{ load.dwFill }}</span>
        </Passive>
      </template>
    </form>
    <template v-if="load">
      <div :class="$style.break" />
      <form>
        <Active label="维修" tooltip="为基地所有生产建筑装载维修材料，计入装载量但不计入生产天数">
          <RadioItem v-model="repair">维修</RadioItem>
        </Active>
        <Active
          label="时间偏移"
          tooltip="The number of days in the future this repair will be conducted.">
          <NumberInput v-model="repairOffset" float :class="$style.number" />
        </Active>
      </form>
      <div :class="$style.break" />
      <form>
        <Passive
          label="填充"
          :tooltip="
            load.fits
              ? undefined
              : repair
                ? '仅消耗品和维修材料就已超出容量上限。'
                : '仅消耗品就已超出容量上限。'
          ">
          <span :class="load.fits ? $style.value : $style.error">
            {{ fixed02(load.weight) }}t, {{ fixed02(load.volume) }}m³
          </span>
        </Passive>
      </form>
    </template>
    <Commands>
      <CopyButton :copy-fn="copyJson" />
      <PrunButton primary :disabled="!canExecute" @click="execute">执行</PrunButton>
    </Commands>
    <SectionHeader>加载</SectionHeader>
    <table>
      <thead>
        <tr>
          <th title="勾选的材料将被装载。单独供应的材料可取消勾选，选择会按基地保存。"> 加载 </th>
          <th>代码</th>
          <th>数量</th>
          <th>天数</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="rows.length === 0">
          <td colspan="4">无需装载。</td>
        </tr>
        <tr v-for="row in rows" :key="row.ticker" :class="{ [$style.excluded]: row.excluded }">
          <td>
            <input
              type="checkbox"
              :class="$style.checkbox"
              :checked="!row.excluded"
              @change="setExcluded(row.ticker, !($event.target as HTMLInputElement).checked)" />
          </td>
          <td>{{ row.ticker }}</td>
          <td>{{ row.excluded ? '--' : row.amount }}</td>
          <td>{{ row.excluded ? '已排除' : localizeLabel(row.role) }}</td>
        </tr>
      </tbody>
    </table>
  </template>
</template>

<style module>
.summary {
  margin: 4px 4px 4px 8px;
}

.value {
  color: #f7a600;
}

.number {
  width: 158px;
  margin-right: 0;
  margin-left: auto;
}

.number input {
  width: 100%;
  box-sizing: border-box;
}

.break {
  height: 8px;
}

.error {
  color: #d9534f;
}

.excluded {
  color: var(--rp-color-text);
}

.checkbox {
  margin: 0;
  accent-color: #f7a600;
  cursor: pointer;
}
</style>
