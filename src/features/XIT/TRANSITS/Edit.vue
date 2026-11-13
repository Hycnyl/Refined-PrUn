<script setup lang="ts">
import Active from '@src/components/forms/Active.vue';
import { shipOptions } from '@src/features/XIT/TRANSITS/ship-options';
import { stopLines } from '@src/features/XIT/TRANSITS/plan-route';

const { action } = defineProps<{
  action: UserData.ActionData;
  pkg: UserData.ActionPackageData;
}>();

const shipRegistration = ref(action.shipRegistration ?? '');
const routeStops = ref(action.routeStops ?? '');
const shipError = ref(false);
const stopsError = ref(false);
const options = computed(() => shipOptions());

watch(
  options,
  list => {
    if (list.some(x => x.value === shipRegistration.value)) {
      return;
    }
    shipRegistration.value = list[0]?.value ?? '';
  },
  { immediate: true },
);

function validate() {
  shipError.value = shipRegistration.value.trim().length === 0;
  stopsError.value = stopLines(routeStops.value).length < 2;
  return !shipError.value && !stopsError.value;
}

function save() {
  action.shipRegistration = shipRegistration.value.trim();
  action.routeStops = routeStops.value;
}

defineExpose({ validate, save });
</script>

<template>
  <Active label="飞船" :error="shipError">
    <select v-model="shipRegistration" :class="$style.select">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </Active>
  <Active label="站点" :error="stopsError">
    <textarea
      v-model="routeStops"
      :class="$style.textarea"
      placeholder="每行一个星球或交易所"
      spellcheck="false" />
  </Active>
</template>

<style module>
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
  min-height: 80px;
  resize: vertical;
}

.select:focus,
.textarea:focus {
  outline: none;
}
</style>
