<script setup lang="ts">
import SectionHeader from '@src/components/SectionHeader.vue';
import PrunLink from '@src/components/PrunLink.vue';
import { channelIdentifier } from '@src/infrastructure/prun-api/data/agent-channel';
</script>

<template>
  <div :class="$style.help">
    <SectionHeader>什么是 XIT AGT？</SectionHeader>
    <div :class="$style.description">
      <p
        >XIT AGT（同步代理）保存稍后执行的动作包，例如补给飞船着陆后的卸货操作。配合
        <PrunLink command="XIT DSP" inline>XIT DSP</PrunLink>（调度）和
        <PrunLink command="XIT ACT" inline>XIT ACT</PrunLink
        >，可运送补给、收取基地产品并前往下一站。</p
      >
      <p
        >当一艘飞船服务多个基地或需要切换设备时，此功能很实用。保存的动作包可在每台装有 Refined PrUn
        的设备上使用，无需在设备间复制卸货指令。</p
      >
    </div>
    <SectionHeader>首次设置</SectionHeader>
    <div :class="$style.description"
      >打开 <PrunLink command="COM" inline>COM</PrunLink>，点击“new
      group”，不添加其他成员，并将群组命名为“{{ channelIdentifier }}".
    </div>
    <SectionHeader>配合调度使用</SectionHeader>
    <div :class="$style.description">
      <ol :class="$style.steps">
        <li
          >在
          <PrunLink command="XIT DSP" inline>XIT DSP</PrunLink>
          中，为需要服务的每个基地分配飞船，并启用同步代理列中的 AGT。</li
        >
        <li>执行调度动作包直到完成。它会为每个选定站点保存一个“自动卸货”动作包。</li>
        <li
          >飞船着陆后，返回 XIT AGT 并点击“刷新”。打开对应站点的动作包，点击“执行”，再按 ACT
          提示卸下补给并装载基地产品。</li
        >
        <li
          >若路线还有后续站点，同步代理会在 SFC
          中填写下一目的地。检查并提交航行计划，着陆后重复操作。</li
        >
      </ol>
    </div>
  </div>
</template>

<style module>
.description {
  line-height: 13px;
  padding: 4px;
  background-color: #26353e;
  margin-bottom: 5px;
}

.help p {
  margin: 0;
}

.help p + p {
  margin-top: 4px;
}

.steps {
  margin: 0;
  padding-inline-start: 18px;
}

.steps li + li {
  margin-top: 4px;
}
</style>
