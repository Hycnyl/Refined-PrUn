<script setup lang="ts">
import { localizeOptions, localizeLabel } from '@src/infrastructure/i18n/labels';
import Active from '@src/components/forms/Active.vue';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { getEntityNameFromAddress } from '@src/infrastructure/prun-api/data/addresses';
import SelectInput from '@src/components/forms/SelectInput.vue';
import NumberInput from '@src/components/forms/NumberInput.vue';
import { comparePlanets } from '@src/util';
import TextInput from '@src/components/forms/TextInput.vue';
import RadioItem from '@src/components/forms/RadioItem.vue';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';
import { configurableValue } from '@src/features/XIT/ACT/shared-types';

const { group } = defineProps<{ group: UserData.MaterialGroupData }>();

const planets = computed(() => {
  const planets = (sitesStore.all.value ?? [])
    .map(x => getEntityNameFromAddress(x.address))
    .filter(x => x !== undefined)
    .sort(comparePlanets);
  planets.unshift(configurableValue);
  return planets;
});

const planet = ref(group.planet ?? planets.value[0]);
const planetError = ref(false);

const configureDaysOnExecution = ref(group.days === configurableValue);
const days = ref(
  typeof group.days === 'string' && group.days !== configurableValue
    ? parseInt(group.days || '10')
    : typeof group.days === 'number'
      ? group.days
      : 10,
);
const daysError = ref(false);

const exclusions = ref(group.exclusions?.join(', ') ?? '');

const useBaseInventory = ref(group.useBaseInv ?? true);

const workforceOnly = ref(group.consumablesOnly ?? false);

function validate() {
  let isValid = true;
  planetError.value = !planet.value;
  isValid &&= !planetError.value;
  daysError.value = !configureDaysOnExecution.value && days.value <= 0;
  isValid &&= !daysError.value;
  return isValid;
}

function save() {
  group.planet = planet.value;
  group.days = configureDaysOnExecution.value ? configurableValue : days.value;
  group.exclusions = exclusions.value
    .split(',')
    .map(x => materialsStore.getByTicker(x.trim())?.ticker)
    .filter(x => x !== undefined);
  group.useBaseInv = useBaseInventory.value;
  group.consumablesOnly = workforceOnly.value;
}

defineExpose({ validate, save });
</script>

<template>
  <Active label="星球" :error="planetError">
    <SelectInput v-model="planet" :options="localizeOptions(planets, localizeLabel)" />
  </Active>
  <Active label="天数" tooltip="为星球补充多少天的物资" :error="daysError">
    <NumberInput v-if="!configureDaysOnExecution" v-model="days" float />
    <RadioItem v-model="configureDaysOnExecution">执行时配置</RadioItem>
  </Active>
  <Active label="排除材料" tooltip="从组中排除的材料，使用逗号分隔材料代码">
    <TextInput v-model="exclusions" />
  </Active>
  <Active label="使用基地库存" tooltip="计算总需求时，是否计入基地现有库存">
    <RadioItem v-model="useBaseInventory">使用基地库存</RadioItem>
  </Active>
  <Active label="仅限劳动力" tooltip="是否仅包含劳动力消耗品">
    <RadioItem v-model="workforceOnly">仅限劳动力</RadioItem>
  </Active>
</template>
