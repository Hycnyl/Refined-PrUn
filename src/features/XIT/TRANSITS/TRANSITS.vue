<script setup lang="ts">
import ActionBar from '@src/components/ActionBar.vue';
import Header from '@src/components/Header.vue';
import PrunButton from '@src/components/PrunButton.vue';
import Active from '@src/components/forms/Active.vue';
import { transitStopIds } from '@src/features/XIT/ROUTE/route-calc';
import { ownedShipOfSize } from '@src/features/XIT/ROUTE/owned-ship';
import { findRoute } from '@src/features/XIT/ROUTE/routes';
import { routeLegPayloads } from '@src/features/XIT/ROUTE/route-origins';
import { acceptDroppedStop, stopIdentity } from '@src/features/XIT/ROUTE/route-stops';
import { shipOptions } from '@src/features/XIT/TRANSITS/ship-options';
import { stopLines } from '@src/features/XIT/TRANSITS/plan-route';
import { routeResults } from '@src/features/XIT/TRANSITS/route-results';
import { stagedRoute } from '@src/features/XIT/TRANSITS/staged';
import { useMinBufferHeight } from '@src/hooks/use-min-buffer-height';
import { useTile } from '@src/hooks/use-tile';
import { useXitParameters } from '@src/hooks/use-xit-parameters';
import { UI_TILES_CHANGE_COMMAND } from '@src/infrastructure/prun-api/client-messages';
import { dispatchClientPrunMessage } from '@src/infrastructure/prun-api/prun-api-listener';
import { showBuffer } from '@src/infrastructure/prun-ui/buffers';

const tile = useTile();
useMinBufferHeight();

const parameters = useXitParameters();
const shipRegistration = ref('');
const routeStops = ref('');
const formError = ref('');
const askReturn = ref(false);
const options = computed(() => shipOptions());
let appliedStops = false;
let appliedShip = false;

watch(
  options,
  list => {
    const routeId = parameters[0];
    routeResults.routeId = routeId;
    if (routeId !== undefined) {
      const route = findRoute(routeId);
      if (route !== undefined) {
        if (!appliedStops) {
          routeStops.value = transitStopIds(route.stops, route.loop).join('\n');
          appliedStops = true;
        }
        if (!appliedShip) {
          const named = route.ship?.trim() ?? '';
          const fromSize =
            named.length > 0 ? '' : (ownedShipOfSize(route.shipSize)?.registration.trim() ?? '');
          const registration = named.length > 0 ? named : fromSize;
          const listed = registration.length > 0 && list.some(x => x.value === registration);
          const waiting =
            list.length === 0 ||
            (registration.length === 0 && (named.length > 0 || route.shipSize !== undefined));
          if (listed) {
            shipRegistration.value = registration;
            appliedShip = true;
          } else if (!waiting) {
            appliedShip = true;
          }
        }
      } else {
        appliedStops = true;
        appliedShip = true;
      }
    } else {
      appliedStops = true;
      appliedShip = true;
    }
    if (!appliedShip) {
      return;
    }
    if (list.some(x => x.value === shipRegistration.value)) {
      return;
    }
    shipRegistration.value = list[0]?.value ?? '';
  },
  { immediate: true },
);

// ROUTECONFIG can change the route's ship while this buffer stays open.
watch(
  () => findRoute(parameters[0])?.ship?.trim(),
  ship => {
    if (ship !== undefined && options.value.some(x => x.value === ship)) {
      shipRegistration.value = ship;
    }
  },
);

// ROUTECONFIG can reorder, add or remove stops while this buffer stays open.
watch(
  () => {
    const route = findRoute(parameters[0]);
    return route === undefined ? undefined : transitStopIds(route.stops, route.loop).join('\n');
  },
  stops => {
    if (stops !== undefined) {
      routeStops.value = stops;
    }
  },
);

const lines = computed(() => stopLines(routeStops.value));
const canTest = computed(() => shipRegistration.value.length > 0 && lines.value.length >= 2);

// A one-way route that does not end at its origin, asked once per route.
function needsReturnQuestion() {
  const route = findRoute(parameters[0]);
  if (route === undefined || route.loop !== false || route.returnToOrigin !== undefined) {
    return false;
  }
  const origin = route.stops[0];
  const last = route.stops.at(-1);
  return (
    origin !== undefined &&
    last !== undefined &&
    route.stops.length >= 2 &&
    stopIdentity(origin) !== stopIdentity(last)
  );
}

function onTest() {
  routeResults.routeId = parameters[0];
  formError.value = '';
  if (!canTest.value) {
    formError.value = '请选择飞船，并至少输入两个站点';
    return;
  }
  if (needsReturnQuestion()) {
    askReturn.value = true;
    return;
  }
  startRun();
}

// YES ends the route with another visit to its origin, which unloads what the
// ship brings back. The answer is saved on the route.
function onReturn(yes: boolean) {
  askReturn.value = false;
  const route = findRoute(parameters[0]);
  const origin = route?.stops[0];
  if (route !== undefined && origin !== undefined) {
    route.returnToOrigin = yes;
    const visit = yes
      ? acceptDroppedStop(route.stops, { kind: origin.kind, id: origin.id })
      : undefined;
    if (visit !== undefined) {
      route.stops.push(visit);
      route.legs = undefined;
      routeStops.value = `${routeStops.value.trimEnd()}\n${origin.id}`;
    }
  }
  startRun();
}

// The route's planned load sets each leg's payload. Stops edited here no longer
// match that plan, so those legs fly full.
function legPayloads() {
  const route = findRoute(parameters[0]);
  if (route === undefined) {
    return undefined;
  }
  const planned = transitStopIds(route.stops, route.loop);
  const typed = lines.value;
  if (planned.length !== typed.length || planned.some((id, i) => id !== typed[i])) {
    return undefined;
  }
  return routeLegPayloads(route);
}

function startRun() {
  stagedRoute.value = {
    global: { name: 'Transits' },
    groups: [],
    actions: [
      {
        type: 'Transits',
        name: 'Route',
        shipRegistration: shipRegistration.value,
        routeStops: routeStops.value,
        legPayloads: legPayloads(),
      },
    ],
  };
  if (!dispatchClientPrunMessage(UI_TILES_CHANGE_COMMAND(tile.id, null))) {
    showBuffer('XIT TRANSITSACT');
    return;
  }
  dispatchClientPrunMessage(UI_TILES_CHANGE_COMMAND(tile.id, 'XIT TRANSITSACT'));
}
</script>

<template>
  <div :class="$style.root">
    <Header>航程计算</Header>
    <form :class="$style.form" @submit.prevent="onTest">
      <p v-if="options.length === 0" :class="$style.note">尚未加载飞船。</p>
      <Active v-else label="飞船">
        <select v-model="shipRegistration" :class="$style.select">
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </Active>
      <Active label="站点">
        <textarea
          v-model="routeStops"
          :class="$style.textarea"
          placeholder="每行一个星球或商品交易所
Hortus a
ANT"
          spellcheck="false" />
      </Active>
      <p v-if="formError" :class="$style.error">{{ formError }}</p>
      <p :class="$style.note"
        >逐段使用飞船蓝图试飞。每段会暂停，以便设置燃料用量和是否使用星门，初始值沿用上一航段。油箱余量从首段装载量起逐段扣减。此操作不会删除蓝图。</p
      >
      <template v-if="askReturn">
        <p :class="$style.question">此路线不循环。最后一站后是否返回起点？</p>
        <ActionBar>
          <PrunButton dark @click="onReturn(false)">否</PrunButton>
          <PrunButton primary @click="onReturn(true)">是，返回</PrunButton>
        </ActionBar>
      </template>
      <ActionBar v-else>
        <PrunButton primary :disabled="!canTest" @click="onTest">设置航行偏好</PrunButton>
      </ActionBar>
    </form>
  </div>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.form {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin: 5px 0 0 4px;
}

.select,
.textarea {
  width: 100%;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  background: transparent;
  border: none;
}

.textarea {
  min-height: 96px;
  resize: vertical;
}

.select:focus,
.textarea:focus {
  outline: none;
}

.note {
  margin: 4px 0 0 5px;
}

.question {
  margin: 4px 0 0 5px;
  color: #f7a600;
}

.error {
  margin: 4px 0 0 5px;
  color: var(--rp-color-red);
}
</style>
