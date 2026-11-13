<script setup lang="ts">
import { localizeLabel } from '@src/infrastructure/i18n/labels';
import PrunButton from '@src/components/PrunButton.vue';
import ActionBar from '@src/components/ActionBar.vue';
import Active from '@src/components/forms/Active.vue';
import NumberInput from '@src/components/forms/NumberInput.vue';
import SelectInput from '@src/components/forms/SelectInput.vue';
import TextInput from '@src/components/forms/TextInput.vue';
import SectionHeader from '@src/components/SectionHeader.vue';
import {
  dataCatalog,
  DataQuery,
  DataQueryFilter,
  DataQueryResult,
  DataSourceSummary,
  parseFilterValue,
} from '@src/infrastructure/data-catalog';
import { isRequestTransportAvailable } from '@src/infrastructure/prun-api/data/request-hooks';
import { agentQueryConnection } from '@src/infrastructure/data-catalog/agent-query';
import { useXitParameters } from '@src/hooks/use-xit-parameters';
import { downloadJson } from '@src/utils/json-file';
import { parseDataExplorerParameters } from '@src/features/XIT/DATA/parameters';

interface FilterInput {
  id: number;
  path: string;
  operator: DataQueryFilter['operator'];
  value: string;
}

const maxPreviewCharacters = 750_000;
const maxPreviewRows = 100;

const operatorOptions: Array<{ label: string; value: DataQueryFilter['operator'] }> = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'neq' },
  { label: '包含', value: 'contains' },
  { label: '开头为', value: 'startsWith' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'gte' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'lte' },
  { label: '存在', value: 'exists' },
];

const directionOptions = [
  { label: '升序', value: 'asc' },
  { label: '降序', value: 'desc' },
];

const parameters = useXitParameters();
const parsedParameters = parseDataExplorerParameters(parameters);
const sources = computed(() => dataCatalog.list());
const requestedSourceId = parsedParameters.sourceId?.trim().toLowerCase();
const defaultSourceId = sources.value.some(x => x.id === 'balances')
  ? 'balances'
  : (sources.value[0]?.id ?? '');
const hasRequestedSource = sources.value.some(x => x.id === requestedSourceId);
const selectedSourceId = ref(hasRequestedSource ? requestedSourceId! : defaultSourceId);
const parameterMessage = ref(
  requestedSourceId && !hasRequestedSource
    ? `未知数据源“${parsedParameters.sourceId}”，显示默认数据源。`
    : '',
);
const search = ref('');
const filters = ref<FilterInput[]>([]);
const sortPath = ref('');
const sortDirection = ref<'asc' | 'desc'>('asc');
const limit = ref<number | undefined>(250);
const siteId = ref('');
const loadMessage = ref('');
const agentEndpoint = ref(parsedParameters.endpoint ?? 'ws://127.0.0.1:47800');
const agentToken = ref('');
const agentStatus = agentQueryConnection.status;
const agentError = agentQueryConnection.lastError;
let nextFilterId = 1;

const source = computed(
  () => sources.value.find(x => x.id === selectedSourceId.value) ?? sources.value[0],
);

const sourceOptions = computed(() =>
  sources.value.map(x => ({
    label: x.label,
    value: x.id,
  })),
);

const provenanceLabel = computed(() => {
  switch (source.value?.provenance) {
    case 'prun-live':
      return 'PrUn 实时数据';
    case 'prun-live-with-defaults':
      return 'PrUn 实时数据 + 内置默认值';
    case 'fio-reference-with-prun-overrides':
      return 'FIO 参考数据 + PrUn 更新值';
    default:
      return '';
  }
});

const completenessLabel = computed(() => localizeLabel(source.value?.completeness ?? ''));
const requestAvailable = computed(() => isRequestTransportAvailable());
const canLoad = computed(
  () =>
    requestAvailable.value &&
    source.value?.load !== undefined &&
    (source.value.load.parameter !== 'siteId' || siteId.value.trim() !== ''),
);

const queryState = computed<{ result?: DataQueryResult; error?: string }>(() => {
  try {
    return { result: dataCatalog.query(buildQuery()) };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
});

const result = computed(() => queryState.value.result);
const queryError = computed(() => queryState.value.error);
const preview = computed(() => buildPreview(result.value));
const prettyResult = computed(() => preview.value.text ?? queryError.value);
const agentStatusLabel = computed(() => localizeLabel(agentStatus.value));

watch(selectedSourceId, () => {
  parameterMessage.value = '';
  loadMessage.value = '';
});

function addFilter() {
  filters.value.push({
    id: nextFilterId++,
    path: '',
    operator: 'eq',
    value: '',
  });
}

function removeFilter(id: number) {
  filters.value = filters.value.filter(x => x.id !== id);
}

function resetQuery() {
  search.value = '';
  filters.value = [];
  sortPath.value = '';
  sortDirection.value = 'asc';
  limit.value = 250;
}

function buildQuery(): DataQuery {
  const appliedFilters = filters.value
    .filter(x => x.path.trim() !== '')
    .map<DataQueryFilter>(x => ({
      path: x.path.trim(),
      operator: x.operator,
      ...(x.operator === 'exists' && x.value.trim() === ''
        ? {}
        : { value: parseFilterValue(x.value) }),
    }));

  return {
    sourceId: source.value?.id ?? selectedSourceId.value,
    ...(search.value ? { search: search.value } : {}),
    ...(appliedFilters.length > 0 ? { filters: appliedFilters } : {}),
    ...(sortPath.value.trim()
      ? { sort: { path: sortPath.value.trim(), direction: sortDirection.value } }
      : {}),
    ...(limit.value !== undefined ? { limit: limit.value } : {}),
  };
}

function exportResult() {
  try {
    const exported = dataCatalog.export(buildQuery());
    downloadJson(exported, `rprun-data-${exported.source.id}-${Date.now()}.json`, { pretty: true });
  } catch (error) {
    loadMessage.value = getErrorMessage(error);
  }
}

function loadSource() {
  loadMessage.value = '';
  if (!requestAvailable.value) {
    loadMessage.value = 'PrUn 请求通道不可用。';
    return;
  }
  try {
    dataCatalog.load(source.value!.id, siteId.value);
    loadMessage.value = '已请求从 PrUn 加载。';
  } catch (error) {
    loadMessage.value = getErrorMessage(error);
  }
}

function generateAgentToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  agentToken.value = btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

async function copyAgentToken() {
  if (agentToken.value) {
    await navigator.clipboard.writeText(agentToken.value);
  }
}

function connectAgent() {
  agentQueryConnection.connect(agentEndpoint.value, agentToken.value);
}

function disconnectAgent() {
  agentQueryConnection.disconnect();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function sourceNeedsSiteId(source?: DataSourceSummary) {
  return source?.load?.parameter === 'siteId';
}

function buildPreview(result?: DataQueryResult): {
  text?: string;
  shownRows: number;
  truncated: boolean;
} {
  if (!result) {
    return { shownRows: 0, truncated: false };
  }

  let shownRows = Math.min(result.rows.length, maxPreviewRows);
  while (shownRows > 0) {
    const text = JSON.stringify({ ...result, rows: result.rows.slice(0, shownRows) }, null, 2);
    if (text.length <= maxPreviewCharacters) {
      return { text, shownRows, truncated: shownRows < result.rows.length };
    }
    shownRows = Math.floor(shownRows / 2);
  }

  return {
    text: JSON.stringify({ ...result, rows: [] }, null, 2),
    shownRows: 0,
    truncated: result.rows.length > 0,
  };
}
</script>

<template>
  <div :class="$style.root">
    <div :class="$style.controls">
      <div :class="$style.settingsGrid">
        <section :class="$style.settingsPanel">
          <SectionHeader>数据集</SectionHeader>
          <form>
            <Active label="来源">
              <SelectInput
                v-model="selectedSourceId"
                :class="$style.sourceSelect"
                :options="sourceOptions" />
            </Active>
          </form>

          <div v-if="source" :class="$style.sourceInfo">
            <div :class="$style.sourceDescription">{{ source.description }}</div>
            <div v-if="parameterMessage" :class="$style.error">
              {{ parameterMessage }}
            </div>
            <div :class="$style.badges">
              <span :class="$style.badge">{{ provenanceLabel }}</span>
              <span :class="[$style.badge, $style[source.completeness]]">
                {{ completenessLabel.toUpperCase() }}
              </span>
            </div>
            <div v-if="source.warning" :class="$style.warning">{{ source.warning }}</div>
          </div>
        </section>

        <section :class="$style.settingsPanel">
          <SectionHeader>查询</SectionHeader>
          <form>
            <Active label="文本搜索">
              <TextInput v-model="search" />
            </Active>
            <Active label="排序字段路径">
              <div :class="$style.inlineInputs">
                <TextInput v-model="sortPath" />
                <SelectInput v-model="sortDirection" :options="directionOptions" />
              </div>
            </Active>
            <Active label="结果数量上限" :error="limit !== undefined && limit <= 0">
              <NumberInput v-model="limit" />
            </Active>
          </form>
        </section>
      </div>

      <ActionBar :class="$style.actionBar">
        <PrunButton primary @click="addFilter">添加筛选</PrunButton>
        <PrunButton neutral @click="resetQuery">重置查询</PrunButton>
        <PrunButton primary :disabled="!result" @click="exportResult">下载 JSON</PrunButton>
      </ActionBar>

      <template v-if="filters.length > 0">
        <SectionHeader>筛选</SectionHeader>
        <div :class="$style.filters">
          <div v-for="filter in filters" :key="filter.id" :class="$style.filterRow">
            <span :class="$style.filterLabel">筛选 {{ filter.id }}</span>
            <input
              v-model="filter.path"
              :class="$style.pathInput"
              placeholder="property.path"
              type="text" />
            <select v-model="filter.operator" :class="$style.operatorSelect">
              <option v-for="option in operatorOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-model="filter.value"
              :class="$style.valueInput"
              :placeholder="
                filter.operator === 'exists' ? 'true/false; blank = true' : 'JSON 或文本'
              "
              type="text" />
            <PrunButton danger @click="removeFilter(filter.id)">移除</PrunButton>
          </div>
        </div>
      </template>

      <template v-if="source?.load">
        <SectionHeader>主动加载</SectionHeader>
        <div :class="$style.loadControls">
          <input
            v-if="sourceNeedsSiteId(source)"
            v-model="siteId"
            :class="$style.siteInput"
            placeholder="必填的基地 ID"
            type="text" />
          <PrunButton primary :disabled="!canLoad" @click="loadSource">从 PrUn 加载</PrunButton>
          <span v-if="!requestAvailable" :class="$style.error">PrUn 请求通道不可用。</span>
          <span v-else-if="sourceNeedsSiteId(source) && !siteId.trim()" :class="$style.hint"
            >请先输入基地 ID。</span
          >
          <span v-if="loadMessage" :class="$style.hint">{{ loadMessage }}</span>
        </div>
      </template>

      <details v-if="parsedParameters.connectionEnabled" :class="$style.agentPanel">
        <summary :class="$style.agentSummary">
          <span>代理查询连接</span>
          <span :class="[$style.badge, $style.agentStatus, $style[agentStatus]]">
            {{ agentStatusLabel }}
          </span>
        </summary>
        <div :class="$style.agentExplanation"
          >需手动启用，仅允许经过认证的只读本机连接。令牌仅保存在内存中。代理请求无法加载数据或执行
          PrUn 操作。</div
        >
        <form>
          <Active label="本机连接地址">
            <TextInput v-model="agentEndpoint" />
          </Active>
          <Active label="会话令牌" tooltip="使用本机代理服务中配置的共享令牌，至少 32 个字符">
            <div :class="$style.agentToken">
              <input
                v-model="agentToken"
                autocomplete="off"
                data-1p-ignore="true"
                data-lpignore="true"
                placeholder="至少 32 个字符的令牌"
                type="password" />
              <PrunButton primary inline @click="generateAgentToken">生成</PrunButton>
              <PrunButton primary inline :disabled="!agentToken" @click="copyAgentToken">
                复制
              </PrunButton>
            </div>
          </Active>
        </form>
        <div :class="$style.commands">
          <PrunButton
            v-if="agentStatus === 'disconnected' || agentStatus === 'error'"
            primary
            inline
            :disabled="!agentEndpoint.trim() || agentToken.length < 32"
            @click="connectAgent"
            >连接</PrunButton
          >
          <PrunButton v-else danger inline @click="disconnectAgent">断开连接</PrunButton>
          <span v-if="agentError" :class="$style.error">{{ agentError }}</span>
        </div>
      </details>
    </div>

    <div :class="$style.resultHeader">
      <SectionHeader>结果</SectionHeader>
      <span v-if="result">
        {{ result.matchedRows }} 条匹配 / {{ result.totalRows }} 条总计 · 显示
        {{ result.rows.length }}
      </span>
      <span v-else :class="$style.error">{{ queryError }}</span>
    </div>
    <div v-if="result && preview.truncated" :class="$style.previewNotice"
      >为保证性能，预览仅显示 {{ preview.shownRows }} 行。下载包含查询结果的全部
      {{ result.rows.length }} 行。</div
    >
    <pre :class="$style.preview">{{ prettyResult }}</pre>
  </div>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  gap: 7px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 6px;
  color: rgb(204, 204, 204);
}

.controls {
  flex: 0 0 auto;
  max-height: 48%;
  min-height: 0;
  border: 1px solid rgb(51, 51, 51);
  background: rgb(31, 31, 31);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgb(51, 51, 51) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(51, 51, 51);
    border-radius: 5px;
  }
}

.settingsGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  padding: 6px;
}

.settingsPanel {
  min-width: 0;
  border: 1px solid rgb(51, 51, 51);
  background: rgb(28, 28, 28);
}

.sourceSelect {
  width: 100%;
}

.sourceSelect > div,
.sourceSelect select {
  width: 100%;
}

.sourceInfo {
  padding: 7px 10px 9px;
}

.sourceDescription {
  margin-bottom: 6px;
  color: rgb(179, 179, 179);
  line-height: 1.35;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  padding: 1px 5px;
  border: 1px solid rgb(87, 87, 87);
  color: rgb(185, 185, 185);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.not-loaded {
  color: rgb(160, 160, 160);
}

.partial {
  color: rgb(240, 173, 78);
}

.complete {
  color: rgb(92, 184, 92);
}

.warning {
  margin-top: 8px;
  padding: 6px 8px;
  border-left: 3px solid rgb(240, 173, 78);
  background: rgba(240, 173, 78, 0.08);
  color: rgb(240, 173, 78);
  font-size: 11px;
  line-height: 1.35;
}

.inlineInputs {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  width: 100%;
}

.inlineInputs > :first-child {
  flex: 1;
}

.inlineInputs input {
  width: 100%;
}

.filters {
  padding: 6px 8px 1px;
}

.filterRow {
  display: grid;
  grid-template-columns: 62px minmax(120px, 1.1fr) minmax(130px, 0.8fr) minmax(130px, 1fr) auto;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgb(51, 51, 51);
}

.filterLabel {
  color: rgb(153, 153, 153);
  font-size: 10px;
}

.pathInput,
.operatorSelect,
.valueInput,
.siteInput {
  box-sizing: border-box;
  min-width: 0;
  height: 25px;
  border: 1px solid rgb(51, 51, 51);
  background: rgb(21, 21, 21);
  color: rgb(204, 204, 204);
  font: 12px monospace;
}

.pathInput,
.valueInput,
.siteInput {
  padding: 3px 6px;
}

.pathInput:focus,
.operatorSelect:focus,
.valueInput:focus,
.siteInput:focus {
  border-color: rgb(240, 173, 78);
  outline: none;
}

.commands,
.loadControls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px 9px;
}

.actionBar {
  margin: 0 6px 7px;
}

.agentExplanation {
  padding: 8px 10px 5px;
  color: rgb(153, 153, 153);
  font-size: 11px;
  line-height: 1.35;
}

.agentToken {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  width: 100%;
}

.agentToken input {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  height: 25px;
  border: 1px solid rgb(51, 51, 51);
  background: rgb(21, 21, 21);
  color: rgb(204, 204, 204);
  padding: 3px 6px;
  font: 12px monospace;
}

.agentToken input:focus {
  border-color: rgb(240, 173, 78);
  outline: none;
}

.agentStatus {
  min-width: 82px;
  text-align: center;
}

.agentPanel {
  border-top: 1px solid rgb(51, 51, 51);
}

.agentSummary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: rgb(35, 55, 64);
  color: rgb(204, 204, 204);
  cursor: pointer;
  font-weight: bold;
  list-style-position: inside;
  user-select: none;
}

.agentSummary::marker {
  color: rgb(153, 153, 153);
}

.connected {
  border-color: rgb(92, 184, 92);
  color: rgb(92, 184, 92);
}

.connecting,
.authenticating {
  border-color: rgb(240, 173, 78);
  color: rgb(240, 173, 78);
}

.siteInput {
  width: 260px;
}

.hint {
  color: rgb(153, 153, 153);
  font-size: 11px;
}

.error {
  color: rgb(217, 83, 79);
}

.resultHeader {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid rgb(51, 51, 51);
  background: rgb(31, 31, 31);
  font-size: 11px;
}

.resultHeader > :first-child {
  flex: 1;
}

.preview {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 9px;
  border: 1px solid rgb(51, 51, 51);
  overflow: auto;
  background: rgb(13, 13, 13);
  color: rgb(204, 204, 204);
  font: 12px/1.4 monospace;
  white-space: pre;
  tab-size: 2;
  scrollbar-width: thin;
  scrollbar-color: rgb(51, 51, 51) transparent;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(51, 51, 51);
    border-radius: 5px;
  }
}

.previewNotice {
  flex: 0 0 auto;
  padding: 5px 10px;
  border-left: 3px solid rgb(240, 173, 78);
  background: rgba(240, 173, 78, 0.08);
  color: rgb(240, 173, 78);
  font-size: 11px;
}

@media (max-width: 760px) {
  .controls {
    max-height: 58%;
  }

  .settingsGrid {
    grid-template-columns: 1fr;
  }

  .filterRow {
    grid-template-columns: 62px minmax(100px, 1fr) minmax(110px, 1fr) auto;
    grid-template-areas:
      'label path operator remove'
      '. value value remove';
  }

  .filterLabel {
    grid-area: label;
  }

  .pathInput {
    grid-area: path;
  }

  .operatorSelect {
    grid-area: operator;
  }

  .valueInput {
    grid-area: value;
  }

  .filterRow > :last-child {
    grid-area: remove;
  }
}
</style>
