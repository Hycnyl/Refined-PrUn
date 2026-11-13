<script setup lang="ts">
import Active from '@src/components/forms/Active.vue';
import Commands from '@src/components/forms/Commands.vue';
import SelectInput from '@src/components/forms/SelectInput.vue';
import PrunButton from '@src/components/PrunButton.vue';
import SectionHeader from '@src/components/SectionHeader.vue';
import { popiBuildings } from '@src/features/XIT/GOVBURN/buildings';
import {
  buildImportPlan,
  parseGovBurnImport,
  type GovBurnImportPlan,
  type GovBurnImportRow,
} from '@src/features/XIT/GOVBURN/govburn-import';
import { planetsStore } from '@src/infrastructure/prun-api/data/planets';
import { userData } from '@src/store/user-data';
import { uploadJson } from '@src/utils/json-file';

const emit = defineEmits<{ (e: 'done'): void }>();

type ImportType = 'TEXT' | 'FILE';

const typeOptions: { label: string; value: ImportType }[] = [
  { label: '粘贴 JSON', value: 'TEXT' },
  { label: '上传 JSON', value: 'FILE' },
];

const type = ref('TEXT' as ImportType);
const text = ref('');
const error = ref(false);
const errorMessage = ref('');
const plan = ref<GovBurnImportPlan | undefined>(undefined);
const naturalId = ref('');
const planetLabel = ref('');

function planetName(id: string) {
  return userData.govburn.planets[id]?.name ?? planetsStore.find(id)?.name ?? id;
}

function formatCountMaterials(count: number, materials: string[]) {
  if (count === -1) {
    return '--';
  }
  if (materials.length === 0) {
    return String(count);
  }
  return `${count} (${materials.join(', ')})`;
}

function rowNote(row: GovBurnImportRow) {
  const notes: string[] = [];
  if (row.omitted) {
    notes.push('未在导入数据中');
  }
  if (row.clamped) {
    notes.push(`已限制为 ${row.count} 次维护`);
  }
  if (row.unknownMaterials.length > 0) {
    notes.push(`不是维护材料：${row.unknownMaterials.join(', ')}`);
  }
  return notes.join('; ');
}

function applyJson(json: unknown) {
  const input = parseGovBurnImport(json);
  if (input === undefined) {
    error.value = true;
    errorMessage.value = 'JSON 无效。';
    return;
  }
  const planet = planetsStore.find(input.planet);
  if (planet === undefined) {
    error.value = true;
    errorMessage.value = '未找到星球。';
    return;
  }
  error.value = false;
  errorMessage.value = '';
  naturalId.value = planet.naturalId;
  planetLabel.value = planetName(planet.naturalId);
  plan.value = buildImportPlan(
    input,
    userData.govburn.planets[planet.naturalId],
    userData.govburn.config.planets[planet.naturalId],
    userData.govburn.config.slots[planet.naturalId],
  );
}

function onPreviewClick() {
  if (text.value.length === 0) {
    error.value = true;
    errorMessage.value = 'Invalid JSON.';
    return;
  }
  try {
    applyJson(JSON.parse(text.value));
  } catch {
    error.value = true;
    errorMessage.value = 'Invalid JSON.';
  }
}

function onUploadClick() {
  uploadJson(applyJson);
}

function onBack() {
  plan.value = undefined;
  error.value = false;
  errorMessage.value = '';
}

function onConfirm() {
  const currentPlan = plan.value;
  const id = naturalId.value;
  if (currentPlan === undefined || id === '') {
    return;
  }
  userData.govburn.config.planets[id] ??= Object.fromEntries(
    popiBuildings.map(x => [x.ticker, -1]),
  );
  const planetConfig = userData.govburn.config.planets[id];
  const slots = (userData.govburn.config.slots[id] ??= {});
  for (const row of currentPlan.rows) {
    planetConfig[row.ticker] = row.count;
    if (row.materials.length === 0) {
      delete slots[row.ticker];
    } else {
      slots[row.ticker] = row.materials;
    }
  }
  emit('done');
}
</script>

<template>
  <div v-if="plan === undefined">
    <SectionHeader>导入星球维护计划</SectionHeader>
    <form @submit.prevent>
      <Active label="类型">
        <SelectInput v-model="type" :options="typeOptions" />
      </Active>
      <Active v-if="type === 'TEXT'" label="JSON" :error="error">
        <textarea
          v-model="text"
          :class="$style.textarea"
          placeholder='{"planet":"Phobos","buildings":[{"building":"SST","materials":["DW","OFF"]}]}'
          spellcheck="false" />
      </Active>
      <Commands>
        <PrunButton v-if="type === 'FILE'" primary @click="onUploadClick">上传</PrunButton>
        <PrunButton v-if="type === 'TEXT'" primary @click="onPreviewClick">预览</PrunButton>
        <PrunButton @click="emit('done')">取消</PrunButton>
      </Commands>
    </form>
    <p v-if="error" :class="$style.error">{{ errorMessage }}</p>
  </div>

  <div v-else>
    <SectionHeader>{{ planetLabel }}</SectionHeader>
    <p v-if="plan.hasConflicts" :class="$style.error">将覆盖高亮行的现有设置。</p>
    <p v-if="!plan.hasData" :class="$style.note"
      >尚未收集此星球的数据，无法验证材料。请运行 XIT GOVBURNDATA。</p
    >
    <p v-if="plan.ignored.length > 0" :class="$style.note"
      >已忽略（非 POPI 建筑）：{{ plan.ignored.join(', ') }}.
    </p>
    <table>
      <thead>
        <tr>
          <th>建筑</th>
          <th>当前</th>
          <th>新增</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in plan.rows" :key="row.ticker" :class="{ [$style.conflict]: row.conflict }">
          <td>{{ row.ticker }}</td>
          <td>{{ formatCountMaterials(row.currentCount, row.currentMaterials) }}</td>
          <td>{{ formatCountMaterials(row.count, row.materials) }}</td>
          <td>{{ rowNote(row) }}</td>
        </tr>
      </tbody>
    </table>
    <form @submit.prevent>
      <Commands>
        <PrunButton primary @click="onConfirm">确认</PrunButton>
        <PrunButton @click="onBack">返回</PrunButton>
      </Commands>
    </form>
  </div>
</template>

<style module>
.textarea {
  width: 100%;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background: transparent;
  border: none;
}

.textarea:focus {
  outline: none;
}

.error {
  margin: 0.25rem 0;
  color: rgb(217, 83, 79);
}

.note {
  margin: 0.25rem 0;
}

.conflict {
  color: rgb(217, 83, 79);
}
</style>
