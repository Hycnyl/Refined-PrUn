<script setup lang="ts">
import ExecuteActionPackage from '@src/features/XIT/ACT/ExecuteActionPackage.vue';
import { stagedGovBurn } from '@src/features/XIT/GOVBURN/staged';
import { useMinBufferHeight } from '@src/hooks/use-min-buffer-height';

useMinBufferHeight();
</script>

<template>
  <div v-if="!stagedGovBurn">暂无待执行计划。请打开 XIT GOVBURNACT 并点击“执行”。</div>
  <ExecuteActionPackage v-else :pkg="stagedGovBurn.pkg" />
</template>
