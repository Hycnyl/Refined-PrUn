<script setup lang="ts">
import { localizeOptions, localizeLabel } from '@src/infrastructure/i18n/labels';
import Active from '@src/components/forms/Active.vue';
import Commands from '@src/components/forms/Commands.vue';
import PrunButton from '@src/components/PrunButton.vue';
import SelectInput from '@src/components/forms/SelectInput.vue';
import RadioItem from '@src/components/forms/RadioItem.vue';
import { showTileOverlay } from '@src/infrastructure/prun-ui/tile-overlay';
import EditPriceLimits from '@src/features/XIT/ACT/actions/cx-buy/EditPriceLimits.vue';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';
import { configurableValue } from '@src/features/XIT/ACT/shared-types';

const { action, pkg } = defineProps<{
  action: UserData.ActionData;
  pkg: UserData.ActionPackageData;
}>();

const materialGroups = computed(() => pkg.groups.map(x => x.name!).filter(x => x));
const materialGroup = ref(action.group ?? materialGroups.value[0]);

const exchanges = [configurableValue, 'AI1', 'CI1', 'IC1', 'NC1', 'CI2', 'NC2'];
const exchange = ref(action.exchange ?? exchanges[0]);

const priceLimits = ref(getPriceLimits());

function getPriceLimits() {
  const priceLimits = action.priceLimits ?? {};
  return Object.keys(priceLimits).map(x => [x, priceLimits[x]]) as [string, number][];
}

const buyPartial = ref(action.buyPartial ?? false);

const allowUnfilled = ref(action.allowUnfilled ?? false);
const useCXInv = ref(action.useCXInv ?? true);

function onEditPriceLimitsClick(e: Event) {
  showTileOverlay(e, EditPriceLimits, reactive({ priceLimits }));
}

function validate() {
  return true;
}

function save() {
  action.group = materialGroup.value;
  action.exchange = exchange.value;
  action.priceLimits = {};
  for (let [ticker, price] of priceLimits.value) {
    const material = materialsStore.getByTicker(ticker);
    if (!material || price === 0 || !isFinite(price)) {
      continue;
    }
    action.priceLimits[material.ticker] = price;
  }
  action.buyPartial = buyPartial.value;
  action.allowUnfilled = allowUnfilled.value;
  action.useCXInv = useCXInv.value;
}

defineExpose({ validate, save });
</script>

<template>
  <Active label="材料组">
    <SelectInput v-model="materialGroup" :options="materialGroups" />
  </Active>
  <Active label="交易所">
    <SelectInput v-model="exchange" :options="localizeOptions(exchanges, localizeLabel)" />
  </Active>
  <Commands label="价格限制">
    <PrunButton primary @click="onEditPriceLimitsClick">编辑</PrunButton>
  </Commands>
  <Active
    label="部分购买"
    tooltip="将订单数量锁定为动作包开始时的可用库存；关闭后在执行此步骤时重新检查数量，两种情况下库存不足都只发出警告">
    <RadioItem v-model="buyPartial">允许部分购买</RadioItem>
  </Active>
  <Active label="允许未成交" tooltip="即使交易所库存不足，也创建完整数量的买单">
    <RadioItem v-model="allowUnfilled">允许未成交</RadioItem>
  </Active>
  <Active label="使用交易所库存" tooltip="计算购买数量时，是否计入交易所仓库的库存">
    <RadioItem v-model="useCXInv">使用交易所库存</RadioItem>
  </Active>
</template>
