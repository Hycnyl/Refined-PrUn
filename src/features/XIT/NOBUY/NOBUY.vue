<script setup lang="ts">
import { userData } from '@src/store/user-data';
import { materialsStore } from '@src/infrastructure/prun-api/data/materials';
import SectionHeader from '@src/components/SectionHeader.vue';
import Active from '@src/components/forms/Active.vue';
import Passive from '@src/components/forms/Passive.vue';
import TextInput from '@src/components/forms/TextInput.vue';
import NumberInput from '@src/components/forms/NumberInput.vue';
import RadioItem from '@src/components/forms/RadioItem.vue';
import Commands from '@src/components/forms/Commands.vue';
import PrunButton from '@src/components/PrunButton.vue';

const input = ref('');
const inputError = ref(false);

function add() {
  const tickers = input.value
    .split(',')
    .map(x => materialsStore.getByTicker(x.trim())?.ticker)
    .filter(x => x !== undefined);

  if (tickers.length === 0) {
    inputError.value = true;
    return;
  }

  inputError.value = false;
  for (const ticker of tickers) {
    if (!userData.settings.noBuy.includes(ticker)) {
      userData.settings.noBuy.push(ticker);
    }
  }
  input.value = '';
}

function remove(ticker: string) {
  const i = userData.settings.noBuy.indexOf(ticker);
  if (i !== -1) {
    userData.settings.noBuy.splice(i, 1);
  }
}

function onInputKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Enter') {
    add();
  }
}
</script>

<template>
  <SectionHeader>XIT BS</SectionHeader>
  <form>
    <Active
      label="天数"
      tooltip="XIT BS 在消耗余量小于 10 天时显示一位小数；关闭时显示整数，500 天及以上显示为无限">
      <RadioItem v-model="userData.settings.burn.decimalDays">一位小数</RadioItem>
    </Active>
  </form>
  <SectionHeader>价格警告阈值</SectionHeader>
  <form>
    <Active
      label="黄色 (%)"
      tooltip="在 XIT ACT 中，交易所购买价格比 Refined PrUn 估值高出此百分比时发出警告">
      <NumberInput v-model="userData.settings.noBuyThresholds.yellow" float />
    </Active>
    <Active
      label="红色 (%)"
      tooltip="In XIT ACT, warn before a CX buy when its price exceeds the refined-PrUn value by more than this percent.">
      <NumberInput v-model="userData.settings.noBuyThresholds.red" float />
    </Active>
  </form>
  <SectionHeader>禁止购买列表</SectionHeader>
  <form>
    <Active
      label="所有材料"
      tooltip="从 ACT 材料组清单中排除所有材料，无需逐个列出代码；下方单独设置的材料代码会保留，关闭此项后重新生效">
      <RadioItem v-model="userData.settings.noBuyAll">所有材料</RadioItem>
    </Active>
  </form>
  <Passive v-if="userData.settings.noBuy.length === 0" label="指定材料"> 无 </Passive>
  <Passive v-for="ticker in userData.settings.noBuy" :key="ticker" :label="ticker">
    <PrunButton danger @click="remove(ticker)">x</PrunButton>
  </Passive>
  <SectionHeader>添加指定材料</SectionHeader>
  <form>
    <Active label="材料代码" tooltip="一个或多个材料代码，以逗号分隔" :error="inputError">
      <TextInput v-model="input" @keydown="onInputKeydown" />
    </Active>
    <Commands>
      <PrunButton primary @click="add">添加</PrunButton>
    </Commands>
  </form>
</template>
