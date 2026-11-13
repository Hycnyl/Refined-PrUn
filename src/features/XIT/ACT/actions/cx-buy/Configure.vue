<script setup lang="ts">
import Active from '@src/components/forms/Active.vue';
import SelectInput from '@src/components/forms/SelectInput.vue';
import RadioItem from '@src/components/forms/RadioItem.vue';
import { Config } from '@src/features/XIT/ACT/actions/cx-buy/config';
import { userData } from '@src/store/user-data';

const { data, config } = defineProps<{ data: UserData.ActionData; config: Config }>();

const exchanges = ['AI1', 'CI1', 'IC1', 'NC1', 'CI2', 'NC2'];

config.skip ??= false;
config.exchange ??= exchanges[0];
</script>

<template>
  <form>
    <Active v-if="data.skippable" label="跳过交易所购买" tooltip="是否跳过购买材料，仅执行转移">
      <RadioItem v-model="config.skip">跳过交易所购买</RadioItem>
    </Active>
    <Active v-if="!config.skip" label="交易所">
      <SelectInput v-model="config.exchange" :options="exchanges" />
    </Active>
    <Active
      v-if="!config.skip"
      label="价格预览"
      tooltip="购买前从交易所类别列表加载缺失价格，并显示按费用排序的预览；点击“执行下一步”暂停 2 秒，点击“跳过”继续采购">
      <RadioItem v-model="userData.settings.cxPricesPreview">预览价格</RadioItem>
    </Active>
  </form>
</template>
