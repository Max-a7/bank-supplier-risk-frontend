<template>
  <div>
    <!-- 统计卡片 -->
<el-row :gutter="20">
  <el-col :span="6">
    <el-card shadow="hover" class="stat-card">
      <div class="stat-title">供应商总数</div>
      <div class="stat-value">{{ totalSuppliers }}</div>
    </el-card>
  </el-col>
  <el-col :span="6">
    <el-card shadow="hover" class="stat-card">
      <div class="stat-title">高风险数量</div>
      <div class="stat-value text-danger">{{ highRiskCount }}</div>
    </el-card>
  </el-col>
  <el-col :span="6">
    <el-card shadow="hover" class="stat-card">
      <div class="stat-title">风险上升数量</div>
      <div class="stat-value text-warning">{{ recentRiskCount }}</div>
    </el-card>
  </el-col>
  <el-col :span="6">
    <el-card shadow="hover" class="stat-card">
      <div class="stat-title">待处置风险</div>
      <div class="stat-value text-danger">{{ pendingDisposalCount }}</div>
    </el-card>
  </el-col>
</el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>整体风险趋势</template>
          <!-- 暂不传 Option 数据，BaseChart 内部会处理空数据 -->
          <BaseChart :option="trendOption" height="300px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>风险类别分布</template>
          <BaseChart :option="categoryOption" height="300px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Top风险供应商表格 -->
    <el-card shadow="hover" class="mt-20">
      <template #header>Top 风险供应商</template>
      <el-table :data="topSuppliers" stripe>
        <el-table-column prop="supplier_id" label="供应商ID" width="100" />
        <el-table-column prop="name" label="供应商名称" min-width="180" />
        <el-table-column prop="risk_level" label="风险等级" width="120">
          <template #default="{ row }">
            <!-- 使用 mapping 文件映射颜色和文字 -->
            <el-tag :type="getRiskLevelColor(row.risk_level)">{{ getRiskLevelText(row.risk_level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="risk_score" label="风险分" width="100" sortable />
        <el-table-column prop="risk_trend.trend_type" label="趋势" width="120">
          <template #default="{ row }">
             {{ getRiskTrendText(row.risk_trend?.trend_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="main_risk_sources" label="主要风险来源" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="src in row.risk_drive_factors" :key="src" size="small" class="mr-5">
              {{ src }}
            </el-tag>
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
import BaseChart from '@/components/charts/BaseChart.vue'

const suppliers = ref([])
const trendOption = ref({})
const categoryOption = ref({})

// 动态计算统计卡片
const totalSuppliers = computed(() => suppliers.value.length)
const highRiskCount = computed(() => suppliers.value.filter(s => s.risk_level === 'HIGH').length)
const recentRiskCount = computed(() => suppliers.value.filter(s => s.risk_trend?.trend_type === 'RISING').length)
const pendingDisposalCount = computed(() => suppliers.value.length) // 暂时无法区分，先统一算

// Top 风险供应商（按风险分降序）
const topSuppliers = computed(() =>
  [...suppliers.value].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5)
)

const fetchDashboardData = async () => {
  // 1. 获取列表数据
  const list = await getSupplierRiskList()
  suppliers.value = list

  // 2. 动态生成趋势折线图（以供应商名称为 X 轴，风险分为 Y 轴）
  trendOption.value = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: list.map(i => i.name) },
    yAxis: { type: 'value', name: '风险分' },
    series: [
      {
        type: 'line',
        data: list.map(i => i.risk_score),
        smooth: true,
        areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
        itemStyle: { color: '#409EFF' }
      }
    ]
  }

  // 3. 动态生成风险类别分布饼图（统计 risk_drive_factors 里的因素）
  const factorCount = {}
  list.forEach(item => {
    if (item.risk_drive_factors) {
      item.risk_drive_factors.forEach(f => {
        factorCount[f] = (factorCount[f] || 0) + 1
      })
    }
  })
  const pieData = Object.keys(factorCount).map(key => ({ value: factorCount[key], name: key }))

  categoryOption.value = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: pieData.length > 0 ? pieData : [{ value: 1, name: '暂无数据' }]
      }
    ]
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 8px;
}
.mt-20 {
  margin-top: 20px;
}
.mr-5 {
  margin-right: 5px;
}
</style>