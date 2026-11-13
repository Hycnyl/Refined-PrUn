<script setup lang="ts">
import { configLegSeconds, matchConfigRoute, routeEta } from '@src/features/XIT/ROUTE/route-eta';
import {
  getAddressName,
  getEntityNaturalIdFromAddress,
} from '@src/infrastructure/prun-api/data/addresses';
import { exchangesStore } from '@src/infrastructure/prun-api/data/exchanges';
import { flightsStore } from '@src/infrastructure/prun-api/data/flights';
import { shipRoutesStore } from '@src/infrastructure/prun-api/data/ship-routes';
import { shipsStore } from '@src/infrastructure/prun-api/data/ships';
import { userData } from '@src/store/user-data';
import { timestampEachSecond } from '@src/utils/dayjs';
import { displaytimeBetween, formatEta } from '@src/utils/format';

const rows = computed(() => {
  const now = timestampEachSecond.value;
  return shipRoutesStore.all.value
    .map(execution => summarize(execution, now))
    .sort((a, b) => a.end - b.end);
});

// A saved stop's location id: an exchange's station (ANT), a base's planet (ZV-759c).
function stopLocationId(stop: UserData.ShippingRouteStop) {
  return stop.kind === 'cx' ? (exchangesStore.getNaturalIdFromCode(stop.id) ?? stop.id) : stop.id;
}

function summarize(execution: PrunApi.ShipRouteExecution, now: number) {
  const route = execution.route;
  const ship = shipsStore.getById(execution.shipId);
  const waypointIds = route.waypoints.map(x => getEntityNaturalIdFromAddress(x.destination));
  const saved = matchConfigRoute(waypointIds, ship?.registration, userData.routes, stopLocationId);
  const current = route.waypoints[execution.waypointIndex];
  const currentId = waypointIds[execution.waypointIndex];
  const atWaypoint =
    ship !== undefined &&
    !ship.flightId &&
    currentId !== undefined &&
    getEntityNaturalIdFromAddress(ship.address ?? undefined) === currentId;
  const flight = flightsStore.getById(execution.flightId);
  const eta = routeEta({
    execution,
    now,
    flightArrival: flight?.arrival.timestamp,
    atWaypoint,
    legSeconds: configLegSeconds(saved, route.repeats),
  });
  const place = getAddressName(current?.destination) ?? '?';
  const step = current?.steps[execution.stepIndex];
  return {
    id: execution.shipId,
    ship: ship?.name ?? ship?.registration ?? execution.shipId.slice(0, 8),
    route: route.name ? `${route.naturalId} ${route.name}` : route.naturalId,
    position: `${execution.waypointIndex + 1}/${route.waypoints.length}`,
    status: statusText(execution.state, place, step?.type, atWaypoint),
    blocked: execution.state === 'STEP_BLOCKED',
    loop: route.repeats,
    saved: saved?.name,
    ...eta,
  };
}

function statusText(
  state: PrunApi.ShipRouteExecutionState,
  place: string,
  step: string | undefined,
  atWaypoint: boolean,
) {
  switch (state) {
    case 'FLYING':
      return `正在飞往 ${place}`;
    case 'WAITING':
      return `等待于 ${place}`;
    case 'RUNNING_STEPS':
      return `${step ?? 'Steps'} 于 ${place}`;
    case 'STEP_BLOCKED':
      return `受阻：${step ?? 'step'} 于 ${place}`;
    default:
      return atWaypoint ? `位于 ${place}` : `即将前往 ${place}`;
  }
}

function etaText(now: number, time: number | undefined, partial = false) {
  if (time === undefined) {
    return '-';
  }
  const text = `${formatEta(now, time)} (${displaytimeBetween(now, time)})`;
  return partial ? `≥ ${text}` : text;
}

// A blocked step does not retry by itself, so a blocked route has no end yet.
function endText(row: { blocked: boolean; end: number; partial: boolean }) {
  return row.blocked ? '-' : etaText(timestampEachSecond.value, row.end, row.partial);
}

function endTitle(row: { saved?: string; partial: boolean; estimated: boolean; loop: boolean }) {
  const lines = [row.loop ? '下一轮开始时间。' : '路线结束时间。'];
  if (row.saved !== undefined) {
    lines.push(`尚未飞行的航段：${row.saved} 试飞时间缩短 15%，不加缓冲。`);
  } else {
    lines.push('没有 ROUTECONFIG 路线匹配这些站点，未飞航段暂无时间数据。');
  }
  if (row.partial) {
    lines.push('部分航段或等待步骤没有时间数据，实际结束时间会更晚。');
  }
  return lines.join('\n');
}
</script>

<template>
  <div>
    <p v-if="rows.length === 0" :class="$style.note">
      {{
        shipRoutesStore.fetched.value
          ? '没有正在执行路线的飞船。'
          : '尚未发现执行路线的飞船。请先打开一次 FLT 或 RT 以加载。'
      }}
    </p>
    <table v-else :class="$style.table">
      <thead>
        <tr>
          <th>飞船</th>
          <th>路线</th>
          <th>站点</th>
          <th>当前操作</th>
          <th>下次抵达</th>
          <th>结束 / 下一轮</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id" :class="$style.row">
          <td :class="$style.nowrap">{{ row.ship }}</td>
          <td :class="$style.nowrap">{{ row.route }}</td>
          <td :class="$style.nowrap">{{ row.position }}</td>
          <td :class="[$style.nowrap, row.blocked && C.Workforces.daysMissing]">
            {{ row.status }}
          </td>
          <td :class="$style.nowrap">{{ etaText(timestampEachSecond, row.nextArrival) }}</td>
          <td :class="$style.nowrap" :title="endTitle(row)">
            {{ row.loop ? '↻ ' : '' }}{{ endText(row) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style module>
.table {
  border-collapse: collapse;
}

.row {
  border-bottom: 1px solid #2b485a;
}

.nowrap {
  white-space: nowrap;
}

.note {
  margin: 8px;
}
</style>
