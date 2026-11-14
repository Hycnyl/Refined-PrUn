<script setup lang="ts">
import PrunButton from '@src/components/PrunButton.vue';
import SectionHeader from '@src/components/SectionHeader.vue';
import Active from '@src/components/forms/Active.vue';
import TextInput from '@src/components/forms/TextInput.vue';
import Commands from '@src/components/forms/Commands.vue';
import { userData } from '@src/store/user-data';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import NumberInput from '@src/components/forms/NumberInput.vue';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import {
  getEntityNameFromAddress,
  getEntityNaturalIdFromAddress,
  getLocationLineFromAddress,
} from '@src/infrastructure/prun-api/data/addresses';
import { comparePlanets } from '@src/util';
import SelectInput from '@src/components/forms/SelectInput.vue';
import PlanetSelector from '@src/components/forms/PlanetSelector.vue';
import { warehousesStore } from '@src/infrastructure/prun-api/data/warehouses';
import { configurableValue } from '@src/features/XIT/ACT/shared-types';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { serializeStorage } from '@src/features/XIT/ACT/actions/utils';

const emit = defineEmits<{ (e: 'close'): void }>();

const days = ref(userData.settings.burn.resupply);
const name = ref(`Base Resupply ${days.value}d`);
const planets = computed(() =>
  (sitesStore.all.value ?? [])
    .map(x => getEntityNameFromAddress(x.address))
    .filter(x => x !== undefined)
    .sort(comparePlanets),
);
const planet = ref(planets.value[0]);

const cxes = computed(
  () =>
    warehousesStore.all.value
      ?.filter(x => getLocationLineFromAddress(x.address)?.type === 'STATION')
      .map(x => ({
        label: getEntityNameFromAddress(x.address)!,
        value: getEntityNaturalIdFromAddress(x.address)!,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)) ?? [],
);
const cx = ref(cxes.value[0].value);

function onCreateClick() {
  if (name.value.length === 0) {
    return;
  }
  const warehouse = warehousesStore.getByEntityNaturalId(cx.value);
  const storage = storagesStore.getById(warehouse!.storeId)!;
  const cxTicker = ExchangeTickers[cx.value];
  userData.actionPackages.push({
    global: { name: name.value },
    groups: [
      {
        name: 'Resupply',
        type: 'Resupply',
        planet: planet.value,
        days: days.value,
        useBaseInv: true,
      },
    ],
    actions: [
      {
        name: 'Buy Missing Materials',
        type: 'CX Buy',
        group: 'Resupply',
        exchange: cxTicker,
        useCXInv: true,
      },
      {
        name: 'Select your ship in the "To" field ↓',
        type: 'MTRA',
        group: 'Resupply',
        origin: serializeStorage(storage),
        dest: configurableValue,
      },
    ],
  });
  showBuffer('XIT ACT_' + name.value.split(' ').join('_'));
  emit('close');
}

const ExchangeTickers = {
  ANT: 'AI1',
  BEN: 'CI1',
  MOR: 'NC1',
  HRT: 'IC1',
  HUB: 'NC2',
  ARC: 'CI2',
};
</script>

<template>
  <div :class="C.DraftConditionEditor.form">
    <SectionHeader>快速入门</SectionHeader>
    <div :class="$style.description"
      >此预填动作包将为基地补充指定天数所需的材料。<br />创建的动作包包含两个动作：从交易所购买缺失材料，再转移到下一步配置的飞船。<br />点击“创建”后进入动作包执行界面。先配置目标飞船，再点击“执行”，并逐步点击“执行下一步”直至完成。<br />
      <mark>注意：所选交易所必须停靠一艘飞船。</mark>
    </div>
    <form>
      <Active label="名称">
        <TextInput v-model="name" />
      </Active>
      <Active label="补给来源交易所">
        <SelectInput v-model="cx" :options="cxes" />
      </Active>
      <Active label="补给星球">
        <PlanetSelector v-model="planet" value="name" />
      </Active>
      <Active label="补给天数">
        <NumberInput v-model="days" float />
      </Active>
      <Commands>
        <PrunButton primary @click="onCreateClick">创建</PrunButton>
      </Commands>
    </form>
  </div>
</template>

<style module>
.description {
  line-height: 13px;
  padding: 0 4px;
  background-color: #26353e;
  margin-bottom: 5px;
}
</style>
