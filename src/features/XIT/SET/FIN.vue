<script setup lang="ts">
import SectionHeader from '@src/components/SectionHeader.vue';
import Tooltip from '@src/components/Tooltip.vue';
import Commands from '@src/components/forms/Commands.vue';
import PrunButton from '@src/components/PrunButton.vue';
import { fixed0, hhmm, ddmmyyyy } from '@src/utils/format';
import { clearBalanceHistory, userData } from '@src/store/user-data';
import { calcEquity } from '@src/core/balance/balance-sheet-summary';
import { showConfirmationOverlay } from '@src/infrastructure/prun-ui/tile-overlay';
import {
  balanceHistory,
  canCollectFinDataPoint,
  collectFinDataPoint,
} from '@src/store/user-data-balance';
import Active from '@src/components/forms/Active.vue';
import TextInput from '@src/components/forms/TextInput.vue';
import { objectId } from '@src/utils/object-id';
import RadioItem from '@src/components/forms/RadioItem.vue';

const sortedData = computed(() => balanceHistory.value.slice().reverse());

function confirmDataPointDelete(ev: Event, index: number) {
  index = balanceHistory.value.length - index - 1;
  showConfirmationOverlay(ev, () => deleteBalanceHistoryDataPoint(index), {
    message: `您即将删除一条历史数据点。是否继续？`,
  });
}

function deleteBalanceHistoryDataPoint(index: number) {
  const history = userData.balanceHistory;
  if (index < history.v1.length) {
    history.v1.splice(index, 1);
  } else {
    history.v2.splice(index - history.v1.length, 1);
  }
}

function confirmAllDataDelete(ev: Event) {
  showConfirmationOverlay(ev, clearBalanceHistory, {
    message: `您即将清除所有历史财务数据。是否继续？`,
  });
}

function formatValue(number?: number) {
  return number !== undefined ? fixed0(number) : '--';
}

const mmMaterials = ref(userData.settings.financial.mmMaterials);

function onMMMaterialsSubmit() {
  const formatted = (mmMaterials.value ?? '').replaceAll(' ', '').toUpperCase();
  userData.settings.financial.mmMaterials = formatted;
  mmMaterials.value = formatted;
}

const ignoredMaterials = ref(userData.settings.financial.ignoredMaterials);

function onIgnoredMaterialsSubmit() {
  const formatted = (ignoredMaterials.value ?? '').replaceAll(' ', '').toUpperCase();
  userData.settings.financial.ignoredMaterials = formatted;
  ignoredMaterials.value = formatted;
}
</script>

<template>
  <SectionHeader>股东权益模式</SectionHeader>
  <Active
    label="股东权益模式"
    tooltip="此模式下，股东权益包含所有资产的市场价值，包括飞船、总部升级和 ARC。不建议新手启用，因为初始飞船的价值远高于初始资源。关闭此模式时仍会完整采集财务历史数据，之后可随时切换"
    tooltip-position="bottom">
    <RadioItem v-model="userData.fullEquityMode">完整股东权益</RadioItem>
  </Active>
  <SectionHeader>价格设置</SectionHeader>
  <Active label="做市商材料" tooltip="以逗号分隔的做市商材料列表。这些材料的价格将等于做市商买入价">
    <TextInput
      v-model="mmMaterials"
      @keyup.enter="onMMMaterialsSubmit"
      @focusout="onMMMaterialsSubmit" />
  </Active>
  <Active label="忽略材料" tooltip="以逗号分隔的忽略材料列表。这些材料的价格将被视为零">
    <TextInput
      v-model="ignoredMaterials"
      @keyup.enter="onIgnoredMaterialsSubmit"
      @focusout="onIgnoredMaterialsSubmit" />
  </Active>
  <SectionHeader>采集的数据点</SectionHeader>
  <form>
    <Commands>
      <PrunButton primary :disabled="!canCollectFinDataPoint()" @click="collectFinDataPoint">
        手动采集数据点
      </PrunButton>
    </Commands>
  </form>
  <table>
    <thead>
      <tr>
        <th>日期</th>
        <th>净资产</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(balance, i) in sortedData" :key="objectId(balance)">
        <td>{{ hhmm(balance.timestamp) }} {{ ddmmyyyy(balance.timestamp) }}</td>
        <td>{{ formatValue(calcEquity(balance)) }}</td>
        <td>
          <PrunButton dark inline @click="confirmDataPointDelete($event, i)">删除</PrunButton>
        </td>
      </tr>
    </tbody>
  </table>
  <SectionHeader>
    危险区域 <Tooltip :class="$style.tooltip" tooltip="清除所有历史财务数据" />
  </SectionHeader>
  <form>
    <Commands>
      <PrunButton danger @click="confirmAllDataDelete">清除财务数据</PrunButton>
    </Commands>
  </form>
</template>

<style module>
.tooltip {
  float: revert;
  font-size: 12px;
  margin-top: -4px;
}
</style>
