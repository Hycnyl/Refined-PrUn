<script setup lang="ts">
import ActionBar from '@src/components/ActionBar.vue';
import PrunButton from '@src/components/PrunButton.vue';
import SectionHeader from '@src/components/SectionHeader.vue';
import TextInput from '@src/components/forms/TextInput.vue';
import Tooltip from '@src/components/Tooltip.vue';
import { initialUserData, userData } from '@src/store/user-data';

const maxShortcuts = 4;

const shortcuts = computed(() => userData.settings.sfcShortcuts);
const canAdd = computed(() => shortcuts.value.length < maxShortcuts);
const canRemove = computed(() => shortcuts.value.length > 0);

function add() {
  shortcuts.value.push({ label: '', destination: '' });
}

function remove() {
  shortcuts.value.pop();
}

function reset() {
  userData.settings.sfcShortcuts = structuredClone(initialUserData.settings.sfcShortcuts);
}
</script>

<template>
  <SectionHeader
    >SFC 快捷键<Tooltip
      position="bottom"
      :class="$style.tooltip"
      tooltip="SFC 目的地字段旁的快捷按钮；标签为按钮文字，目的地可为交易所空间站（ANT）或星球（OT-580b 或 Montem）；最多四个，点击“移除”删除最后一个" />
  </SectionHeader>
  <ActionBar>
    <PrunButton primary :disabled="!canAdd" @click="add">新增</PrunButton>
    <PrunButton primary :disabled="!canRemove" @click="remove">移除</PrunButton>
    <PrunButton primary @click="reset">重置</PrunButton>
  </ActionBar>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>标签</th>
        <th>目的地</th>
      </tr>
    </thead>
    <tbody v-if="shortcuts.length === 0">
      <tr>
        <td colspan="3">暂无快捷键。</td>
      </tr>
    </tbody>
    <tbody v-else>
      <tr v-for="(shortcut, i) in shortcuts" :key="i">
        <td>{{ i + 1 }}</td>
        <td :class="[$style.inputCell, $style.labelCell]">
          <div :class="[C.forms.input, $style.inline]">
            <TextInput v-model="shortcut.label" />
          </div>
        </td>
        <td :class="$style.inputCell">
          <div :class="[C.forms.input, $style.inline]">
            <TextInput v-model="shortcut.destination" />
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style module>
.inline {
  display: inline-block;
}

.inputCell * {
  width: 100%;
}

.labelCell input {
  text-transform: uppercase;
}

.tooltip {
  float: revert;
  font-size: 12px;
  margin-top: -4px;
}
</style>
