<script setup lang="ts">
import PrunLink from '@src/components/PrunLink.vue';
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>我想...</th>
        <th>命令</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>修改 Refined PrUn 设置。</td>
        <td>
          <PrunLink command="XIT SET" />
        </td>
      </tr>
      <tr>
        <td>切换功能集（基础版/完整版）。</td>
        <td>
          <PrunLink command="XIT SET FEAT" />
        </td>
      </tr>
      <tr>
        <td>禁用某些 Refined PrUn 功能。</td>
        <td>
          <PrunLink command="XIT SET FEAT" />
        </td>
      </tr>
      <tr>
        <td>查看可用的 XIT 命令。</td>
        <td>
          <PrunLink command="XIT CMDS" />
        </td>
      </tr>
      <tr>
        <td>导入 PMMG 设置。</td>
        <td>
          <PrunLink command="XIT SET PMMG" />
        </td>
      </tr>
      <tr>
        <td>获取一张随机的柯基 GIF。</td>
        <td>
          <PrunLink command="XIT GIF CORGI" />
        </td>
      </tr>
    </tbody>
  </table>
</template>
