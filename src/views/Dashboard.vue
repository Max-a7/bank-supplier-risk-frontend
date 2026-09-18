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
          <div class="stat-title">待审核数量</div>
          <div class="stat-value text-warning">{{ pendingDisposalCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">中风险数量</div>
          <div class="stat-value">{{ mediumRiskCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>重点监测名单风险分</template>
          <BaseChart :option="trendOption" height="300px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>风险等级分布</template>
          <BaseChart :option="categoryOption" height="300px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Top 风险供应商表格 -->
    <el-card shadow="hover" class="mt-20">
      <template #header>重点监测名单（Top 5）</template>
      <el-table :data="topSuppliers" stripe>
        <el-table-column prop="supplier_id" label="供应商ID" width="140" />
        <el-table-column prop="supplier_name" label="供应商名称" min-width="180" />
        <el-table-column prop="importance" label="重要性" width="100" />
        <el-table-column prop="current_risk_level" label="风险等级" width="120">
          <template #default="{ row }">
            <el-tag :type="getRiskLevelColor(row.current_risk_level)">
              {{ getRiskLevelText(row.current_risk_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="risk_score" label="风险分" width="100" sortable />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="$router.push(`/suppliers/${row.supplier_id}`)">
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
import { getDashboardSummary } from '@/api/risk.js'
import { getRiskLevelColor, getRiskLevelText } from '@/utils/mapping.js'
import BaseChart from '@/components/charts/BaseChart.vue'

// ================== 响应式数据 ==================
const summary = ref({})
const totalSuppliers = ref(0)
const highRiskCount = ref(0)
const mediumRiskCount = ref(0)
const pendingDisposalCount = ref(0)
const topSuppliers = ref([])
const trendOption = ref({})
const categoryOption = ref({})

// ================== 加载数据 ==================
const fetchDashboardData = async () => {
  const data = await getDashboardSummary()
  summary.value = data

  const byRisk = data?.supplier_count_by_risk || {}
  const totalCount = (byRisk.RED || 0) + (byRisk.YELLOW || 0) + (byRisk.GREEN || 0)

  totalSuppliers.value = totalCount
  highRiskCount.value = byRisk.RED || 0
  mediumRiskCount.value = byRisk.YELLOW || 0
  pendingDisposalCount.value = data?.pending_review_count || 0

  // 折线图：重点监测名单的风险分
  const watchlist = data?.watchlist || []
  trendOption.value = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: watchlist.map(i => i.supplier_name || i.supplier_id),
      axisLabel: { rotate: 30, fontSize: 11 }
    },
    yAxis: { type: 'value', name: '风险分' },
    series: [{
      type: 'line',
      data: watchlist.map(i => i.risk_score || 0),
      smooth: true,
      areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
      itemStyle: { color: '#409EFF' }
    }]
  }

  // 饼图：风险等级分布
  categoryOption.value = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: byRisk.RED || 0, name: '高风险', itemStyle: { color: '#F56C6C' } },
        { value: byRisk.YELLOW || 0, name: '中风险', itemStyle: { color: '#E6A23C' } },
        { value: byRisk.GREEN || 0, name: '低风险', itemStyle: { color: '#67C23A' } }
      ]
    }]
  }

  // Top 供应商
  topSuppliers.value = watchlist.slice(0, 5)
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
</style>