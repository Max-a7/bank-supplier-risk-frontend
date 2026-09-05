<template>
  <div class="page-container">
    <el-row :gutter="16" class="filter-bar">
      <el-col :span="6">
        <el-input v-model="searchName" placeholder="按供应商名称搜索" clearable />
      </el-col>
      <el-col :span="4">
        <el-select v-model="filterLevel" placeholder="风险等级" clearable>
          <el-option label="高" value="高" />
          <el-option label="中" value="中" />
          <el-option label="低" value="低" />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" @click="resetFilters">重置</el-button>
      </el-col>
    </el-row>

    <el-table :data="filteredSuppliers" stripe @row-click="goDetail">
      <el-table-column prop="name" label="供应商名称" min-width="200" />
      <el-table-column prop="type" label="类型" width="140" />
      <el-table-column prop="level" label="重要程度" width="140" />
      <el-table-column prop="riskScore" label="综合风险分" width="130" sortable>
        <template #default="{ row }">
          <span :class="scoreClass(row.riskScore)">{{ row.riskScore }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="riskLevel" label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.riskLevel)">{{ row.riskLevel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="riskTrend" label="趋势" width="100">
        <template #default="{ row }">
          <el-icon v-if="row.riskTrend === '上升'" color="#f56c6c"><Top /></el-icon>
          <el-icon v-else-if="row.riskTrend === '下降'" color="#67c23a"><Bottom /></el-icon>
          <span v-else>平稳</span>
        </template>
      </el-table-column>
      <el-table-column prop="mainRiskSources" label="主要风险来源" min-width="200">
        <template #default="{ row }">
          <el-tag v-for="src in row.mainRiskSources" :key="src" size="small" class="mr-5">
            {{ src }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mockApi } from '@/api/mockData'

const router = useRouter()
const suppliers = ref([])
const searchName = ref('')
const filterLevel = ref('')

const filteredSuppliers = computed(() => {
  return suppliers.value.filter((s) => {
    const matchName = !searchName.value || s.name.includes(searchName.value)
    const matchLevel = !filterLevel.value || s.riskLevel === filterLevel.value
    return matchName && matchLevel
  })
})

const resetFilters = () => {
  searchName.value = ''
  filterLevel.value = ''
}

const goDetail = (row) => {
  router.push(`/suppliers/${row.id}`)
}

const levelTagType = (level) => {
  if (level === '高') return 'danger'
  if (level === '中') return 'warning'
  return 'success'
}

const scoreClass = (score) => {
  if (score >= 70) return 'text-danger'
  if (score >= 40) return 'text-warning'
  return 'text-success'
}

onMounted(async () => {
  suppliers.value = await mockApi.getSuppliers()
})
</script>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
}
.mr-5 {
  margin-right: 5px;
}
</style>