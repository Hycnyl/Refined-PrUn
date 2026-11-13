<script setup lang="ts">
import SectionHeader from '@src/components/SectionHeader.vue';
import PrunButton from '@src/components/PrunButton.vue';
import Commands from '@src/components/forms/Commands.vue';
import Active from '@src/components/forms/Active.vue';
import { uploadJson, downloadJson } from '@src/utils/json-file';
import { ddmmyyyy, hhmm } from '@src/utils/format';
import {
  BackupFile,
  mergeUserDataBackups,
  validateBackup,
} from '@src/infrastructure/storage/user-data-finmerge';

const backupA = shallowRef<BackupFile>();
const backupB = shallowRef<BackupFile>();

function uploadBackup(target: 'A' | 'B') {
  uploadJson(json => {
    if (!validateBackup(json)) {
      alert('备份文件无效。');
      return;
    }
    if (target === 'A') {
      backupA.value = json;
    } else {
      backupB.value = json;
    }
  });
}

const merge = computed(() => {
  if (!backupA.value || !backupB.value) {
    return undefined;
  }
  return mergeUserDataBackups(backupA.value, backupB.value);
});

function formatTimestamp(timestamp: number) {
  return timestamp === 0 ? '无数据' : `${ddmmyyyy(timestamp)} ${hhmm(timestamp)}`;
}

function download() {
  if (!merge.value) {
    return;
  }
  downloadJson(merge.value.result, `rp-user-data-finmerge-${Date.now()}.json`);
}
</script>

<template>
  <SectionHeader>合并财务备份</SectionHeader>
  <form>
    <Commands label="备份 A">
      <PrunButton primary @click="uploadBackup('A')">上传</PrunButton>
    </Commands>
    <Commands label="备份 B">
      <PrunButton primary @click="uploadBackup('B')">上传</PrunButton>
    </Commands>
  </form>
  <template v-if="merge">
    <SectionHeader>报告</SectionHeader>
    <form>
      <Active label="基础备份">{{ merge.report.base }}</Active>
      <Active label="基础备份最新日期">{{ formatTimestamp(merge.report.baseLatest) }}</Active>
      <Active label="另一备份最新日期">{{ formatTimestamp(merge.report.otherLatest) }}</Active>
      <Active label="新增天数 (v1)">
        {{
          merge.report.v1Mismatch
            ? `已跳过，元组长度不匹配（${merge.report.v1Mismatch[0]} 对比 ${merge.report.v1Mismatch[1]})`
            : merge.report.v1DaysAdded
        }}
      </Active>
      <Active label="新增天数 (v2)">
        {{
          merge.report.v2Mismatch
            ? `已跳过，元组长度不匹配（${merge.report.v2Mismatch[0]} 对比 ${merge.report.v2Mismatch[1]})`
            : merge.report.v2DaysAdded
        }}
      </Active>
    </form>
    <form>
      <Commands>
        <PrunButton primary @click="download">下载合并备份</PrunButton>
      </Commands>
    </form>
  </template>
</template>

<style scoped></style>
