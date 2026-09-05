<template>
  <el-table :data="list" stripe>
    <el-table-column prop="supplierName" label="供应商" min-width="180" />
    <el-table-column prop="riskTitle" label="风险事件" min-width="150" />
    <el-table-column prop="suggestion" label="处置建议" min-width="250" />
    <el-table-column prop="status" label="状态" width="100">
      <template #default="{ row }">
        <el-tag :type="statusTagType(row.status)">{{ row.status }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="deadline" label="整改期限" width="120" />
    <el-table-column prop="reviewer" label="复核人" width="100" />
    <el-table-column label="操作" width="120">
      <template #default>
        <el-button type="primary" size="small">确认</el-button>
        <el-button size="small">调整</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

const statusTagType = (status) => {
  if (status === '待处置') return 'danger'
  if (status === '整改中') return 'warning'
  return 'success'
}
</script>