<script setup lang="ts">
import ExecuteActionPackage from '@src/features/XIT/ACT/ExecuteActionPackage.vue';
import { stagedRtRoute } from '@src/features/XIT/RTACT/staged';
import { isRtHost, PRODUCTION_HOST } from '@src/features/XIT/RTACT/rt-host';

const rtHost = isRtHost(location.hostname);
</script>

<template>
  <div v-if="!rtHost">此执行器仅支持 {{ PRODUCTION_HOST }}.</div>
  <div v-else-if="!stagedRtRoute">暂无待执行计划。请打开 XIT RTACT 并点击“运行”。</div>
  <ExecuteActionPackage v-else :pkg="stagedRtRoute.pkg" />
</template>
