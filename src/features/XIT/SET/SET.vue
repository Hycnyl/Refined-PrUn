<script setup lang="ts">
import { useXitParameters } from '@src/hooks/use-xit-parameters';
import { useXitCommand } from '@src/hooks/use-xit-command';
import Tabs, { Tab } from '@src/components/Tabs.vue';
import GAME from '@src/features/XIT/SET/GAME.vue';
import NOBUY from '@src/features/XIT/NOBUY/NOBUY.vue';
import FEAT from '@src/features/XIT/SET/FEAT.vue';
import FIN from '@src/features/XIT/SET/FIN.vue';
import BFR from '@src/features/XIT/SET/BFR.vue';
import SFC from '@src/features/XIT/SET/SFC.vue';
import ROUTE from '@src/features/XIT/SET/ROUTE.vue';

const tabs: Tab[] = [
  {
    id: 'GAME',
    label: '基础设置',
    component: GAME,
  },
  {
    id: 'ACT',
    label: '动作',
    component: NOBUY,
  },
  {
    id: 'FEAT',
    label: '功能',
    component: FEAT,
  },
  {
    id: 'FIN',
    label: '财务报告',
    component: FIN,
  },
  {
    id: 'BFR',
    label: '窗口缓存',
    component: BFR,
  },
  {
    id: 'SFC',
    label: '飞行控制',
    component: SFC,
  },
  {
    id: 'ROUTE',
    label: '路线',
    component: ROUTE,
  },
];

const parameters = useXitParameters();
const command = useXitCommand();
// XIT NOBUY stays as a shortcut onto this tab. The stored no-buy settings are unchanged.
const parameter = command.toUpperCase() === 'NOBUY' ? 'ACT' : parameters[0];

const activeTab = shallowRef(tabs.find(x => x.id === parameter?.toUpperCase()) ?? tabs[0]);
</script>

<template>
  <Tabs v-model="activeTab" :tabs="tabs" />
</template>
