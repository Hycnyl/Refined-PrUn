<script setup lang="ts">
import PrunButton from '@src/components/PrunButton.vue';
import {
  finishShipPick,
  shipPickPending,
  shipPickPrompt,
} from '@src/features/XIT/ROUTE/route-ship-pick';

const ships = shipPickPending();
const prompt = shipPickPrompt();
</script>

<template>
  <div :class="$style.root">
    <template v-if="ships !== undefined && ships.length === 0">
      <p>没有飞船能装下此路线所需物资。</p>
      <PrunButton dark @click="finishShipPick(undefined)">取消</PrunButton>
    </template>
    <p v-else-if="ships === undefined">没有等待选择的飞船。</p>
    <template v-else>
      <p>{{ prompt }}</p>
      <div :class="$style.list">
        <PrunButton
          v-for="ship in ships"
          :key="ship.label"
          primary
          @click="finishShipPick(ship.label)">
          {{ ship.label }}
        </PrunButton>
      </div>
      <PrunButton dark @click="finishShipPick(undefined)">取消</PrunButton>
    </template>
  </div>
</template>

<style module>
.root {
  padding: 8px;
}

.list {
  display: flex;
  flex-direction: column;
  row-gap: 0.25rem;
  margin-bottom: 0.5rem;
}
</style>
