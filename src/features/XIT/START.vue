<script setup lang="ts">
import PrunLink from '@src/components/PrunLink.vue';
</script>

<template>
  <div :class="$style.container">
    <h1 :class="$style.title">感谢使用 Refined PrUn！</h1>
    <p> 你可以查看所有 XIT 命令列表，通过输入 <PrunLink inline command="XIT CMDS" /> </p>
    <p> 你可以修改设置，通过输入 <PrunLink inline command="XIT SET" /> </p>
    <p> 如需额外帮助，请查看 <PrunLink inline command="XIT HELP" /> </p>
    <p> 你可以随时修改功能集，通过输入 <PrunLink inline command="XIT SET FEAT" /> </p>
  </div>
</template>

<style module>
.container {
  font-size: 12px;
  padding-left: 4px;
}

.title {
  font-weight: bold;
  display: block;
  font-size: 16px;
}
</style>
