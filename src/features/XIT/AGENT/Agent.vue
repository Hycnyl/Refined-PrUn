<script setup lang="ts">
import {
  agentChannelStore,
  channelIdentifier,
  fetchAgentChannel,
} from '@src/infrastructure/prun-api/data/agent-channel';
import { openAgentChannelWithDraft } from '@src/infrastructure/prun-ui/agent-channel-messaging';
import {
  agentReadyPackages,
  getPackageShip,
  isShipAtDestination,
  type PackageDestination,
} from '@src/features/XIT/ACT/agent-sync';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';
import { flightsStore } from '@src/infrastructure/prun-api/data/flights';
import { getEntityNaturalIdFromAddress } from '@src/infrastructure/prun-api/data/addresses';
import { formatEta } from '@src/utils/format';
import { timestampEachMinute } from '@src/utils/dayjs';
import LoadingSpinner from '@src/components/LoadingSpinner.vue';
import PrunButton from '@src/components/PrunButton.vue';
import PrunLink from '@src/components/PrunLink.vue';
import ActionBar from '@src/components/ActionBar.vue';

const loading = ref(false);

async function refresh() {
  loading.value = true;
  await fetchAgentChannel();
  loading.value = false;
}

const fetched = computed(() => agentChannelStore.fetched.value);
const inaccessible = computed(() => agentChannelStore.inaccessible.value);

function getEta(pkg: UserData.ActionPackageData, destinationNaturalId: string | undefined) {
  if (!destinationNaturalId) {
    return undefined;
  }
  const ship = getPackageShip(pkg);
  if (isShipAtDestination(ship, destinationNaturalId)) {
    return '已着陆';
  }
  const flight = flightsStore.getById(ship?.flightId);
  if (!flight || getEntityNaturalIdFromAddress(flight.destination) !== destinationNaturalId) {
    return undefined;
  }
  return formatEta(timestampEachMinute.value, flight.arrival.timestamp);
}

// Older posted packages named themselves "Offload <naturalId>" (see mtra.ts history);
// swap the natural id for the same display name shown in the Destination column.
function getDisplayName(
  pkg: UserData.ActionPackageData,
  destination: PackageDestination | undefined,
) {
  const name = pkg.global.name ?? '';
  return destination ? name.replaceAll(destination.naturalId, destination.name) : name;
}

const packages = computed(() =>
  agentReadyPackages.value.map(entry => ({
    ...entry,
    name: getDisplayName(entry.pkg, entry.destination),
    eta: getEta(entry.pkg, entry.destination?.naturalId),
  })),
);

function openPackage(messageId: string) {
  showBuffer(`XIT AGENT ${messageId}`);
}
</script>

<template>
  <ActionBar>
    <PrunButton dark @click="showBuffer('XIT HELP AGT')">这是什么？</PrunButton>
    <PrunButton primary :disabled="loading" @click="refresh">刷新</PrunButton>
  </ActionBar>
  <div v-if="inaccessible"
    >“{{ channelIdentifier }}”频道尚未设置。打开
    <PrunLink command="COM" inline>COM</PrunLink>，点击“new
    group”，不添加其他成员，并将频道命名为“{{ channelIdentifier }}".
  </div>
  <LoadingSpinner v-else-if="loading" />
  <div v-else-if="!fetched">点击“刷新”加载同步频道。</div>
  <table v-else>
    <thead>
      <tr>
        <th>名称</th>
        <th>编号</th>
        <th>目的地</th>
        <th>预计到达</th>
        <th>执行</th>
        <th>忽略</th>
      </tr>
    </thead>
    <tbody v-if="packages.length === 0">
      <tr>
        <td colspan="6">暂无可执行的动作包。</td>
      </tr>
    </tbody>
    <tbody v-else>
      <tr v-for="entry in packages" :key="entry.messageId">
        <td>{{ entry.name }}</td>
        <td>{{ entry.id ?? '--' }}</td>
        <td>
          <PrunLink v-if="entry.destination" inline :command="`BS ${entry.destination.naturalId}`">
            {{ entry.destination.name }}
          </PrunLink>
          <template v-else>--</template>
        </td>
        <td>{{ entry.eta ?? '--' }}</td>
        <td>
          <PrunButton v-if="entry.ready" primary @click="openPackage(entry.messageId)">
            打开
          </PrunButton>
          <template v-else>等待飞船着陆</template>
        </td>
        <td>
          <PrunButton v-if="entry.id" dark inline @click="openAgentChannelWithDraft(entry.id)"
            >忽略</PrunButton
          >
          <template v-else>--</template>
        </td>
      </tr>
    </tbody>
  </table>
</template>
