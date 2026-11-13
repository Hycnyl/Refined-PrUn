<script setup lang="ts">
import Active from '@src/components/forms/Active.vue';
import TextInput from '@src/components/forms/TextInput.vue';

const { action } = defineProps<{
  action: UserData.ActionData;
  pkg: UserData.ActionPackageData;
}>();

const planet = ref(action.planet ?? '');
const planetError = ref(false);

function validate() {
  planetError.value = planet.value.trim().length === 0;
  return !planetError.value;
}

function save() {
  action.planet = planet.value.trim();
}

defineExpose({ validate, save });
</script>

<template>
  <Active label="星球" :error="planetError">
    <TextInput v-model="planet" placeholder="星球编号或名称" />
  </Active>
</template>
