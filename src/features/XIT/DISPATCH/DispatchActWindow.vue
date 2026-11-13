<script setup lang="ts">
import ExecuteActionPackage from '@src/features/XIT/ACT/ExecuteActionPackage.vue';
import { stagedDispatch } from '@src/features/XIT/DISPATCH/staged';
</script>

<template>
  <div v-if="!stagedDispatch">暂无待执行计划。请打开 XIT DISPATCH 并点击“执行”。</div>
  <ExecuteActionPackage v-else :pkg="stagedDispatch.pkg" />
</template>
