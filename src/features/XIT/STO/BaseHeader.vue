<script setup lang="ts">
import { BaseStorageAnalysis, buildProjectedStore } from '@src/core/storage-analysis';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { userData } from '@src/store/user-data';
import PrunButton from '@src/components/PrunButton.vue';
import CargoBar from '@src/components/CargoBar.vue';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import { fillRatioClass, formatDays, formatDaysCompact } from '@src/features/XIT/STO/utils';
import { fixed01 } from '@src/utils/format';

const { analysis } = defineProps<{
  analysis: BaseStorageAnalysis;
  hasMinimize?: boolean;
  minimized?: boolean;
  onClick: () => void;
  tooltipPosition?: string;
  hideButtons?: boolean;
  showColumnTooltips?: boolean;
  planetOnlyClick?: boolean;
}>();

const COLUMN_LIMIT_TOOLTIP = '按当前净生产速率预计满仓的天数，届时必须安排飞船到访';
const COLUMN_SUPPLY_TOOLTIP =
  '运出货物后，库存填充至阈值时可容纳的消耗品总天数（库存增长时为 80%，减少时为 95%）；颜色同 XIT BURN，低于红色阈值显示红色，低于黄色阈值显示黄色';
const COLUMN_CURRENT_FILL_TOOLTIP = '当前基地库存，按材料类别着色';
const COLUMN_AFTER_RESUPPLY_TOOLTIP =
  '运出全部成品并将消耗品补足至 XIT BURN 需求量后的预计库存，红色斜线表示超出容量';

const currentStore = computed(() => storagesStore.getById(analysis.storeId));
const projectedStore = computed(() => buildProjectedStore(analysis.siteId));

const stripeClass = computed(() => {
  if (analysis.needFillRatio === 0) {
    return undefined;
  }
  return fillRatioClass(analysis.needFillRatio);
});

const limitTooltip = computed(() => {
  if (analysis.bindingLimit === undefined) {
    return '库存在减少，不会满仓。';
  }
  return analysis.bindingLimit === 't' ? '重量是容量瓶颈。' : '体积是容量瓶颈。';
});

const supplyTooltip = computed(() => {
  if (!isFinite(analysis.daysOfSuppliesFit)) {
    return '没有正在消耗的材料，无需补给。';
  }
  const pct = Math.round((1 - analysis.suppliesReserveFraction) * 100);
  const reason = analysis.suppliesReserveFraction >= 0.2 ? '持续积累的成品' : '生产波动';
  return `${fixed01(analysis.daysOfSuppliesFit)} 天，当运出货物后库存填充至 ${pct}%（剩余空间预留给 ${reason}).`;
});

const supplyClass = computed(() => {
  const floored = Math.floor(analysis.daysOfSuppliesFit);
  if (!isFinite(analysis.daysOfSuppliesFit)) {
    return undefined;
  }
  return {
    [C.Workforces.daysMissing]: floored <= userData.settings.burn.red,
    [C.Workforces.daysWarning]: floored <= userData.settings.burn.yellow,
    [C.Workforces.daysSupplied]: floored > userData.settings.burn.yellow,
  };
});
</script>

<template>
  <tr :class="$style.row">
    <td :class="[$style.planet, $style.clickable]" @click="onClick">
      <div v-if="stripeClass" :class="[$style.stripe, stripeClass]" />
      <span v-if="hasMinimize" :class="$style.minimize">
        {{ minimized ? '+' : '-' }}
      </span>
      <span>{{ analysis.planetName }}</span>
    </td>
    <td
      :class="[!planetOnlyClick && $style.clickable, $style.noWrap]"
      v-on="planetOnlyClick ? {} : { click: onClick }">
      <span
        v-if="showColumnTooltips"
        :class="[C.Tooltip.container, $style.tooltipSpan]"
        :data-tooltip="COLUMN_LIMIT_TOOLTIP"
        :data-tooltip-position="tooltipPosition ?? 'bottom'">
        {{ formatDays(analysis.daysUntilFull) }}
      </span>
      <span
        v-else
        :data-tooltip="limitTooltip"
        :data-tooltip-position="tooltipPosition ?? 'bottom'">
        {{ formatDays(analysis.daysUntilFull) }}
      </span>
    </td>
    <td
      :class="[!planetOnlyClick && $style.clickable, $style.supplyCell, $style.noWrap]"
      v-on="planetOnlyClick ? {} : { click: onClick }">
      <div v-if="supplyClass" :class="[$style.supplyBg, supplyClass]" />
      <span
        v-if="showColumnTooltips"
        :class="[C.Tooltip.container, $style.tooltipSpan]"
        :data-tooltip="COLUMN_SUPPLY_TOOLTIP"
        :data-tooltip-position="tooltipPosition ?? 'bottom'">
        {{ formatDaysCompact(analysis.daysOfSuppliesFit) }}
      </span>
      <span
        v-else
        :data-tooltip="supplyTooltip"
        :data-tooltip-position="tooltipPosition ?? 'bottom'">
        {{ formatDaysCompact(analysis.daysOfSuppliesFit) }}
      </span>
    </td>
    <td
      :class="[!planetOnlyClick && $style.clickable, $style.barCell]"
      v-on="planetOnlyClick ? {} : { click: onClick }">
      <div
        v-if="showColumnTooltips"
        :class="$style.colBg"
        :data-tooltip="COLUMN_CURRENT_FILL_TOOLTIP"
        :data-tooltip-position="tooltipPosition ?? 'bottom'">
        <CargoBar :store="currentStore" disable-mini-mode />
      </div>
      <CargoBar v-else :store="currentStore" disable-mini-mode />
    </td>
    <td
      :class="[!planetOnlyClick && $style.clickable, $style.barCell]"
      v-on="planetOnlyClick ? {} : { click: onClick }">
      <div
        v-if="showColumnTooltips"
        :class="[$style.colBg, $style.rightAlignedTooltip]"
        :data-tooltip="COLUMN_AFTER_RESUPPLY_TOOLTIP"
        :data-tooltip-position="tooltipPosition ?? 'bottom'">
        <CargoBar :store="projectedStore" disable-mini-mode />
      </div>
      <CargoBar v-else :store="projectedStore" disable-mini-mode />
    </td>
    <td v-if="!hideButtons">
      <div :class="$style.buttons">
        <PrunButton dark inline @click="showBuffer(`BS ${analysis.naturalId}`)">BS</PrunButton>
        <PrunButton dark inline @click="showBuffer(`INV ${analysis.storeId.substring(0, 8)}`)"
          >库存</PrunButton
        >
      </div>
    </td>
  </tr>
</template>

<style module>
.row {
  border-bottom: 1px solid #2b485a;
}

.planet {
  font-weight: bold;
  font-size: 12px;
  position: relative;
  padding-left: 12px;
  white-space: nowrap;
}

.stripe {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.clickable {
  cursor: pointer;
}

.noWrap {
  white-space: nowrap;
}

/* Tooltip ::before inherits white-space from its element. When the parent td
   has noWrap, the inherited nowrap prevents tooltip text from wrapping inside
   the tooltip box. Reset it here so the tooltip renders correctly. */
.tooltipSpan {
  white-space: normal;
}

.minimize {
  display: inline-block;
  width: 20px;
  text-align: center;
}

.buttons {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  column-gap: 0.25rem;
}

/* Equal width for both CargoBar cells. Using width:50% on each cell makes
   them split the remaining table width after fixed-size columns (planet,
   days, cmd) — the bar cells dominate and split evenly. */
.barCell {
  width: 50%;
  vertical-align: middle;
}

.supplyCell {
  position: relative;
}

.supplyBg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

/* Fills the td so background hover area covers empty space around the value. */
.colBg {
  display: block;
  position: relative;
  z-index: 1;
}

/* Right-aligns the tooltip box so it doesn't overflow the right buffer edge.
   The game centers 'top' tooltips via left:50%+translateX(-50%); overriding
   to right:0 anchors the box's right edge to the element's right edge. */
.rightAlignedTooltip {
  &::before {
    left: auto;
    right: 0;
    transform: translateX(0);
  }
}
</style>
