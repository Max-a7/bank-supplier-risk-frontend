<!-- src/views/SupplierList.vue -->
<template>
  <div>
    <!-- 搜索栏 -->
    <el-card shadow="hover" class="mb-20">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-input 
            v-model="searchKeyword" 
            placeholder="按供应商名称搜索" 
            clearable 
            prefix-icon="Search"
          />
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterLevel" placeholder="风险等级" clearable style="width: 100%;">
            <el-option label="高风险" value="HIGH" />
            <el-option label="中风险" value="MEDIUM" />
            <el-option label="低风险" value="LOW" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="resetFilter">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 列表表格 -->
    <el-card shadow="hover">
      <el-table :data="filteredSuppliers" stripe style="width: 100%">
        <el-table-column prop="name" label="供应商名称" min-width="180" />
        <el-table-column prop="supplier_id" label="供应商ID" width="150" />
        <el-table-column prop="risk_level" label="风险等级" width="120">
          <template #default="{ row }">
            <el-tag :type="getRiskLevelColor(row.risk_level)">
              {{ getRiskLevelText(row.risk_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="risk_score" label="综合风险分" width="120" sortable />
        <el-table-column prop="risk_trend.trend_type" label="趋势" width="120">
          <template #default="{ row }">
            {{ getRiskTrendText(row.risk_trend?.trend_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="risk_drive_factors" label="主要风险来源" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="src in row.risk_drive_factors" :key="src" size="small" class="mr-5">
              {{ src }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="$router.push(`/suppliers/${row.supplier_id}`)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSupplierRiskList } from '@/api/risk.js'
import { getRiskLevelColor, getRiskLevelText, getRiskTrendText } from '@/utils/mapping.js'

const suppliers = ref([])
const searchKeyword = ref('')
const filterLevel = ref('')

// 根据搜索关键词和风险等级过滤
const filteredSuppliers = computed(() => {
  return suppliers.value.filter(item => {
    const matchKeyword = !searchKeyword.value || item.name?.includes(searchKeyword.value)
    const matchLevel = !filterLevel.value || item.risk_level === filterLevel.value
    return matchKeyword && matchLevel
  })
})

const resetFilter = () => {
  searchKeyword.value = ''
  filterLevel.value = ''
}

const fetchList = async () => {
  console.log('【前端】开始获取供应商列表...')
  const list = await getSupplierRiskList()
  suppliers.value = list
  console.log('【前端】获取到数据条数:', list.length)
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.mb-20 { margin-bottom: 20px; }
.mr-5 { margin-right: 5px; }
</style>