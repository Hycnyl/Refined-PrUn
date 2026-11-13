<script setup lang="ts">
import Header from '@src/components/Header.vue';
import PrunButton from '@src/components/PrunButton.vue';
import { buildStagingPackage } from '@src/features/XIT/RTACT/staging-package';
import { stagedRtRoute } from '@src/features/XIT/RTACT/staged';
import { isRtHost, PRODUCTION_HOST } from '@src/features/XIT/RTACT/rt-host';
import { useTile } from '@src/hooks/use-tile';
import { UI_TILES_CHANGE_COMMAND } from '@src/infrastructure/prun-api/client-messages';
import { dispatchClientPrunMessage } from '@src/infrastructure/prun-api/prun-api-listener';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';

const tile = useTile();
const rtHost = isRtHost(location.hostname);
const routeId = ref('');
const specText = ref('');
const shipId = ref('');
const error = ref('');

function onRunClick() {
  const built = buildStagingPackage(location.hostname, routeId.value, specText.value, shipId.value);
  if (!built.ok) {
    error.value = built.error;
    return;
  }
  error.value = '';
  stagedRtRoute.value = { pkg: built.pkg };
  if (!dispatchClientPrunMessage(UI_TILES_CHANGE_COMMAND(tile.id, null))) {
    showBuffer('XIT RTEXEC');
    return;
  }
  dispatchClientPrunMessage(UI_TILES_CHANGE_COMMAND(tile.id, 'XIT RTEXEC'));
}
</script>

<template>
  <div>
    <Header>RT 路线</Header>
    <p v-if="!rtHost">此执行器仅支持 {{ PRODUCTION_HOST }}.</p>
    <template v-else>
      <p
        >每行一个站点，至少两个站点。步骤写在竖线之后。每次点击“执行下一步”授权一次添加或保存操作。若指定飞船，将在最后一个站点配置完成后分配给路线。</p
      >
      <p>ZV-307d</p>
      <p>ANT | load DW 1 100</p>
      <p>ZV-759c | unload DW 1 all</p>
      <p>OT-580 | wait 1 minutes</p>
      <p>AI1 | refuel STL local 100 capacity</p>
      <label
        >路线编号（可选，留空则创建新路线）<input
          v-model="routeId"
          type="text"
          autocomplete="off" />
      </label>
      <textarea v-model="specText" :class="$style.spec" />
      <label
        >飞船（可选，最后分配）<input v-model="shipId" type="text" autocomplete="off" />
      </label>
      <p v-if="error.length > 0">{{ error }}</p>
      <PrunButton primary @click="onRunClick">运行</PrunButton>
    </template>
  </div>
</template>

<style module>
.spec {
  width: 100%;
  min-height: 160px;
  box-sizing: border-box;
}
</style>
