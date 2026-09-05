<template>
  <div>
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">供应商总数</div>
          <div class="stat-value">128</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">高风险数量</div>
          <!-- 后期动态绑定：countHighRisk -->
          <div class="stat-value text-danger">7</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">本月新增风险</div>
          <div class="stat-value text-warning">23</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">待处置风险</div>
          <div class="stat-value text-danger">5</div>
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
// 引入 API 和 映射函数
import { getSupplierRiskList } from '@/api/risk.js' 
import { getRiskLevelColor, getRiskLevelText, getRiskTrendText } from '@/utils/mapping.js'
import BaseChart from '@/components/charts/BaseChart.vue'

const suppliers = ref([])
const trendOption = ref({})
const categoryOption = ref({})

const topSuppliers = computed(() =>
  [...suppliers.value].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5)
)

// 加载数据的函数（空实现，只留接口）
const fetchDashboardData = async () => {
  // 目前这里不跑数据，等 Mock 数据交付后解开注释即可
  // const res = await getSupplierRiskList()
  // suppliers.value = res.data
  
  // 现在可以通过这里的逻辑来编写静态图表，测试 BaseChart 是否正常工作
  trendOption.value = {
    xAxis: { type: 'category', data: ['4月', '5月', '6月'] },
    yAxis: { type: 'value', max: 100 },
    series: [
      {
        type: 'line',
        data: [32, 45, 58],
        smooth: true,
        areaStyle: {},
        itemStyle: { color: '#409EFF' }
      }
    ]
  }
  categoryOption.value = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 8, name: '人员风险' },
          { value: 5, name: '履约风险' },
          { value: 4, name: '项目风险' },
          { value: 3, name: '舆情风险' },
          { value: 2, name: '合规风险' }
        ]
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