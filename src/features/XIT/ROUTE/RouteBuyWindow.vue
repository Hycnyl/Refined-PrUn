<script setup lang="ts">
import ExecuteActionPackage from '@src/features/XIT/ACT/ExecuteActionPackage.vue';
import { stagedRouteAssign } from '@src/features/XIT/ROUTE/route-assign-run';
import { useMinBufferHeight } from '@src/hooks/use-min-buffer-height';

useMinBufferHeight();

// Taken once when the buffer opens, so the run cannot unmount itself.
const staged = stagedRouteAssign.value;
</script>

<template>
  <div v-if="staged === undefined">暂无待执行计划。请从 XIT ROUTEBURN 分配路线。</div>
  <div v-else-if="staged.shortLines !== undefined" :class="$style.short">
    <p>{{ staged.originLabel }}缺少此路线所需的装载物资。基地不会自动采购。</p>
    <p v-for="line in staged.shortLines" :key="line.ticker">
      {{ line.ticker }}：可用 {{ line.free }}，需要 {{ line.need }}
    </p>
  </div>
  <ExecuteActionPackage v-else :pkg="staged.pkg" :extra-steps="staged.steps" />
</template>

<style module>
.short {
  padding: 8px;
}
</style>
