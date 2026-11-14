<script setup lang="ts">
import { BaseStorageAnalysis, getBaseStorageAnalysis } from '@src/core/storage-analysis';
import BaseHeader from '@src/features/XIT/STO/BaseHeader.vue';
import BaseSection from '@src/features/XIT/STO/BaseSection.vue';
import LoadingSpinner from '@src/components/LoadingSpinner.vue';
import InlineFlex from '@src/components/InlineFlex.vue';
import Tooltip from '@src/components/Tooltip.vue';
import { useTileState } from '@src/features/XIT/STO/tile-state';
import { useXitParameters } from '@src/hooks/use-xit-parameters';
import { sitesStore } from '@src/infrastructure/prun-api/data/sites';
import { comparePlanets } from '@src/util';

// Fake sample used by the invisible reference row that sets column widths.
const fakeAnalysis: BaseStorageAnalysis = {
  siteId: '',
  storeId: '',
  planetName: 'Placeholder',
  naturalId: '',
  weightCapacity: 1,
  weightLoad: 0.5,
  volumeCapacity: 1,
  volumeLoad: 0.5,
  importWeight: 0,
  importVolume: 0,
  exportWeight: 0,
  exportVolume: 0,
  fillPercentWeight: 0.5,
  fillPercentVolume: 0.5,
  fillPercentWeightNoInf: 0.5,
  fillPercentVolumeNoInf: 0.5,
  needFillPercentWeight: 0.5,
  needFillPercentVolume: 0.5,
  needFillRatio: 0.5,
  availableAfterShipOutWeight: 0.5,
  availableAfterShipOutVolume: 0.5,
  daysOfSuppliesFit: 10,
  suppliesReserveFraction: 0.2,
  daysUntilFull: 10,
  bindingLimit: 't',
};

const parameters = useXitParameters();
const expand = useTileState('expand');

const analyses = computed<BaseStorageAnalysis[] | undefined>(() => {
  if (!sitesStore.all.value) {
    return undefined;
  }
  let sites = sitesStore.all.value;
  if (parameters[0]) {
    const match = sitesStore.getByPlanetNaturalIdOrName(parameters[0]);
    sites = match ? [match] : [];
  }
  const result = sites.map(getBaseStorageAnalysis).filter((x): x is BaseStorageAnalysis => !!x);
  result.sort((a, b) => {
    const aInf = !isFinite(a.daysUntilFull);
    const bInf = !isFinite(b.daysUntilFull);
    // Non-infinite first, sorted by days. Infinite bases go to the bottom
    // sorted alphabetically by planet name.
    if (aInf && bInf) {
      return a.planetName.localeCompare(b.planetName);
    }
    if (aInf !== bInf) {
      return aInf ? 1 : -1;
    }
    if (a.daysUntilFull !== b.daysUntilFull) {
      return a.daysUntilFull - b.daysUntilFull;
    }
    return comparePlanets(a.naturalId, b.naturalId);
  });
  return result;
});

watchEffect(() => {
  if (parameters[0] && analyses.value?.length === 1) {
    const naturalId = analyses.value[0].naturalId;
    if (!expand.value.includes(naturalId)) {
      expand.value = [...expand.value, naturalId];
    }
  }
});

const noMatch = computed(
  () => !!parameters[0] && analyses.value !== undefined && analyses.value.length === 0,
);
</script>

<template>
  <LoadingSpinner v-if="analyses === undefined" />
  <div v-else-if="noMatch" :class="$style.empty">没有基地匹配“{{ parameters[0] }}”</div>
  <div v-else-if="analyses.length === 0" :class="$style.empty">暂无基地</div>
  <table v-else>
    <thead>
      <tr>
        <th :class="$style.planet">星球</th>
        <th>
          <InlineFlex
            >预计满仓天数<Tooltip
              position="bottom"
              tooltip="按当前净生产速率预计满仓的天数，届时必须安排飞船到访" />
          </InlineFlex>
        </th>
        <th>
          <InlineFlex
            >补给天数<Tooltip
              position="bottom"
              tooltip="运出货物后，库存填充至阈值时可容纳的消耗品总天数（库存增长时为 80%，减少时为 95%）；颜色同 XIT BURN，低于红色阈值显示红色，低于黄色阈值显示黄色" />
          </InlineFlex>
        </th>
        <th>
          <InlineFlex
            >当前占用<Tooltip position="bottom" tooltip="当前基地库存，按材料类别着色" />
          </InlineFlex>
        </th>
        <th>
          <InlineFlex
            >补给后占用<Tooltip
              position="bottom"
              tooltip="运出全部成品并将消耗品补足至 XIT BURN 需求量后的预计库存，红色斜线表示超出容量" />
          </InlineFlex>
        </th>
        <th>命令</th>
      </tr>
    </thead>
    <tbody :class="$style.fakeRow">
      <BaseHeader :analysis="fakeAnalysis" :on-click="() => {}" />
    </tbody>
    <BaseSection
      v-for="analysis in analyses"
      :key="analysis.siteId"
      can-minimize
      :analysis="analysis" />
  </table>
</template>

<style module>
.planet {
  text-align: left;
  padding-left: 26px;
}

.empty {
  padding: 1rem;
  font-style: italic;
  opacity: 0.7;
  text-align: center;
}

.fakeRow {
  visibility: collapse;
}
</style>
