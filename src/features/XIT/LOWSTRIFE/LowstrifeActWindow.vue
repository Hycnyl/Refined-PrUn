<script setup lang="ts">
import ExecuteActionPackage from '@src/features/XIT/ACT/ExecuteActionPackage.vue';
import { stagedLowstrife } from '@src/features/XIT/LOWSTRIFE/staged';
</script>

<template>
  <div v-if="!stagedLowstrife">暂无待执行计划。请打开 XIT LOWSTRIFE 并点击“执行”。</div>
  <ExecuteActionPackage v-else :pkg="stagedLowstrife" />
</template>
