<script setup lang="ts">
import SectionHeader from '@src/components/SectionHeader.vue';
import Active from '@src/components/forms/Active.vue';
import NumberInput from '@src/components/forms/NumberInput.vue';
import { userData } from '@src/store/user-data';
</script>

<template>
  <SectionHeader>路线补给</SectionHeader>
  <form>
    <Active
      label="补给目标"
      tooltip="XIT ROUTEBURN 的“补货”按钮在各交易所起点购买多少天内即将出发的路线物资">
      <NumberInput v-model="userData.settings.routeSupply.days" float />
    </Active>
    <Active label="红色警告" tooltip="XIT ROUTEBURN 起点倒计时不高于此天数时显示为红色">
      <NumberInput v-model="userData.settings.routeSupply.red" float />
    </Active>
    <Active label="黄色警告" tooltip="XIT ROUTEBURN 起点倒计时不高于此天数时显示为黄色">
      <NumberInput v-model="userData.settings.routeSupply.yellow" float />
    </Active>
  </form>
</template>
