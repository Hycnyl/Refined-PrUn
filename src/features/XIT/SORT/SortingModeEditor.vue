<script setup lang="ts">
import SectionHeader from '@src/components/SectionHeader.vue';
import Active from '@src/components/forms/Active.vue';
import TextInput from '@src/components/forms/TextInput.vue';
import Commands from '@src/components/forms/Commands.vue';
import PrunButton from '@src/components/PrunButton.vue';
import RadioItem from '@src/components/forms/RadioItem.vue';
import { storagesStore } from '@src/infrastructure/prun-api/data/storage';
import { objectId } from '@src/utils/object-id';

const { onSave, sorting, storeId } = defineProps<{
  onSave: (sorting: UserData.SortingMode) => void;
  sorting?: UserData.SortingMode;
  storeId: string;
}>();

const storage = computed(() => storagesStore.getById(storeId));

const label = ref(sorting?.label ?? '');
const categories = ref(
  sorting?.categories.map(x => ({ name: x.name, materials: x.materials.join(', ') })) ?? [
    createCategory(),
  ],
);
const burn = ref(sorting?.burn ?? false);
const zero = ref(sorting?.zero ?? false);

const canRemoveCategory = computed(() => categories.value.length > 1);

function addCategory() {
  categories.value.push(createCategory());
}

function removeCategory() {
  if (canRemoveCategory.value) {
    categories.value.pop();
  }
}

function createCategory() {
  return { name: '', materials: '' };
}

const emit = defineEmits<{ (e: 'close'): void }>();

function onSaveClick() {
  if (!label.value) {
    return;
  }
  onSave({
    label: label.value,
    categories: categories.value.map(x => ({
      name: x.name,
      materials: x.materials.replaceAll(' ', '').split(','),
    })),
    burn: burn.value,
    zero: zero.value,
  });
  emit('close');
}
</script>

<template>
  <div :class="C.DraftConditionEditor.form">
    <SectionHeader>排序模式</SectionHeader>
    <form>
      <Active label="标签" tooltip="显示在库存上方的标签（ABC、CAT 等）">
        <TextInput v-model="label" style="width: 80%" />
      </Active>
      <Active label="类别 1 名称" tooltip="第一个材料类别的名称">
        <TextInput v-model="categories[0].name" style="width: 80%" />
      </Active>
      <Active label="类别 1 材料" tooltip="第一个类别的材料列表，以逗号分隔材料代码，例如 RAT、DW">
        <TextInput v-model="categories[0].materials" style="width: 80%" />
      </Active>
      <template v-for="(category, i) in categories.slice(1)" :key="objectId(category)">
        <Active :label="`类别 ${i + 2} 名称`">
          <TextInput v-model="category.name" style="width: 80%" />
        </Active>
        <Active :label="`类别 ${i + 2} 材料`">
          <TextInput v-model="category.materials" style="width: 80%" />
        </Active>
      </template>
      <Active
        v-if="storage?.type === 'STORE'"
        label="消耗排序"
        tooltip="将消耗排序作为次要排序方式，消耗类别显示在上方自定义类别之后">
        <RadioItem v-model="burn">添加消耗</RadioItem>
      </Active>
      <Active label="显示零值" tooltip="显示数量为零的物品图标">
        <RadioItem v-model="zero">显示零值</RadioItem>
      </Active>
      <Commands>
        <PrunButton primary @click="addCategory">添加类别</PrunButton>
        <PrunButton
          :primary="canRemoveCategory"
          :disabled="!canRemoveCategory"
          @click="removeCategory"
          >移除类别</PrunButton
        >
        <PrunButton primary @click="onSaveClick">保存</PrunButton>
      </Commands>
    </form>
  </div>
</template>
