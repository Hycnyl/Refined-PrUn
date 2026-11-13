<script setup lang="ts">
import PrunButton from '@src/components/PrunButton.vue';
import Active from '@src/components/forms/Active.vue';
import TextInput from '@src/components/forms/TextInput.vue';
import Commands from '@src/components/forms/Commands.vue';
import { userData } from '@src/store/user-data';
import { createId } from '@src/store/create-id';
import { useTile } from '@src/hooks/use-tile';

const tile = useTile();
const name = ref('');
const showSuccess = ref(false);

onMounted(() => {
  name.value = `FLDR ${userData.tabs.folders.length + 1}`;
});

function onCreate() {
  const trimmed = name.value.trim();
  if (!trimmed) {
    return;
  }
  const id = createId();
  userData.tabs.folders.push({ id, name: trimmed.toUpperCase(), screenIds: [] });
  userData.tabs.order.push(id);
  name.value = `FLDR ${userData.tabs.folders.length + 1}`;
  showSuccess.value = true;
}

function dismissSuccess() {
  showSuccess.value = false;
}
</script>

<template>
  <form @submit.prevent="onCreate">
    <Active label="文件夹名称">
      <TextInput v-model="name" :focus-on-mount="true" />
    </Active>
    <Commands>
      <PrunButton primary type="submit">创建</PrunButton>
    </Commands>
  </form>
  <Teleport :to="tile.frame">
    <div
      v-if="showSuccess"
      :class="[C.ActionFeedback.overlay, C.ActionFeedback.success]"
      @click="dismissSuccess">
      <div :class="[C.ActionFeedback.message, C.fonts.fontRegular, C.type.typeLarger]"
        >操作成功！<span :class="[C.ActionFeedback.text, C.fonts.fontRegular, C.type.typeRegular]"
          >（点击关闭）</span
        >
      </div>
    </div>
  </Teleport>
</template>
