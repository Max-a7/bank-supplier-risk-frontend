<!-- src/views/SupplierDetail.vue -->
<template>
  <div class="supplier-detail">
    <!-- 5.3 时间轴演示控制（放在顶部） -->
    <div class="demo-control">
      <el-button 
        type="primary" 
        @click="playRiskEvolution"
        :disabled="playing"
      >
        {{ playing ? '播放中...' : '▶ 播放风险演变' }}
      </el-button>
      <el-slider 
        v-model="timeIndex" 
        :min="0" 
        :max="history.length - 1" 
        :format-tooltip="formatTooltip"
        style="flex: 1; margin: 0 20px;"
      />
      <span class="current-date">
        📅 {{ history[timeIndex]?.date || '' }}
      </span>
      <el-tag :type="getRiskTagType(history[timeIndex]?.riskLevel)" size="large">
        {{ history[timeIndex]?.riskLevel || '无数据' }}
      </el-tag>
      <span class="event-desc">{{ history[timeIndex]?.event || '' }}</span>
    </div>

    <!-- 供应商基本信息 -->
    <el-card class="supplier-info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span><strong>供应商基本信息</strong></span>
          <el-tag type="primary" size="large">{{ supplierInfo?.status || '合作中' }}</el-tag>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>供应商名称：</label>
            <span>{{ supplierInfo?.name || 'XX科技有限公司' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>统一社会信用代码：</label>
            <span>{{ supplierInfo?.code || '91440101MA5XXXXXX' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>联系人：</label>
            <span>{{ supplierInfo?.contact || '张经理' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>联系电话：</label>
            <span>{{ supplierInfo?.phone || '138****1234' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>合作状态：</label>
            <el-tag :type="supplierInfo?.status === '合作中' ? 'success' : 'danger'">
              {{ supplierInfo?.status || '合作中' }}
            </el-tag>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>风险等级：</label>
            <el-tag :type="getRiskTagType(currentRiskLevel)">
              {{ currentRiskLevel || '低' }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 5.1 雷达图 -->
    <el-card class="radar-card" shadow="hover">
      <template #header>
        <span><strong>风险雷达图</strong></span>
        <span style="font-size: 12px; color: #909399; margin-left: 12px;">
          （当前风险等级：{{ currentRiskLevel }}）
        </span>
      </template>
      <BaseChart :option="radarOption" height="350px" />
    </el-card>

    <!-- 5.2 关系图 - 放在关联项目卡片旁边 -->
    <div class="project-section">
      <!-- 两列布局：左侧项目卡片，右侧关系图 -->
      <div class="project-cards-wrapper">
        <!-- 左侧：关联项目卡片 -->
        <el-card class="project-cards" shadow="hover">
          <template #header>
            <span><strong>关联项目（{{ supplierProjects.length }}个）</strong></span>
          </template>
          <div class="project-list">
            <div 
              v-for="project in supplierProjects" 
              :key="project.id" 
              class="project-item"
            >
              <div class="project-info">
                <span class="project-name">{{ project.name }}</span>
                <el-tag :type="getProjectStatusType(project.status)" size="small">
                  {{ project.status }}
                </el-tag>
              </div>
              <div class="project-meta">
                <span>合同金额：{{ project.amount || '--' }}</span>
                <span>开始日期：{{ project.startDate || '--' }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 右侧：关系图组件 -->
        <div class="relation-graph-wrapper">
          <RelationGraph :supplier-id="supplierId" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
// 根据文件结构，组件在 src/components/ 下
import RelationGraph from '@/components/RelationGraph.vue'
// BaseChart 在 src/charts/ 下
import BaseChart from '@/charts/BaseChart.vue'

const route = useRoute()
const supplierId = ref(route.params.id || 'S001')

// ========== 5.3 时间轴相关 ==========
const timeIndex = ref(0)
const playing = ref(false)
let intervalId = null

// 模拟历史数据（实际应该从API获取）
const history = ref([
  { date: '2024-01-15', riskLevel: '低', event: '✅ 合同签署正常，项目启动' },
  { date: '2024-03-20', riskLevel: '低', event: '✅ 首期款支付完成，进度正常' },
  { date: '2024-06-10', riskLevel: '中', event: '⚠️ 交付延期预警，需关注' },
  { date: '2024-08-25', riskLevel: '中', event: '⚠️ 质量抽检不合格，整改中' },
  { date: '2024-10-30', riskLevel: '高', event: '🚨 核心系统故障，紧急处理' },
  { date: '2024-12-05', riskLevel: '高', event: '🚨 合同违约风险，法律介入' }
])

// 当前风险等级
const currentRiskLevel = computed(() => {
  return history.value[timeIndex.value]?.riskLevel || '低'
})

// 格式化时间轴提示
const formatTooltip = (val) => {
  return history.value[val]?.date || ''
}

// 获取风险等级对应的标签类型
const getRiskTagType = (level) => {
  const map = {
    '低': 'success',
    '中': 'warning',
    '高': 'danger'
  }
  return map[level] || 'info'
}

// 获取项目状态对应的标签类型
const getProjectStatusType = (status) => {
  const map = {
    '进行中': 'warning',
    '已完成': 'success',
    '已暂停': 'danger',
    '待启动': 'info'
  }
  return map[status] || 'info'
}

// 播放风险演变
const playRiskEvolution = () => {
  if (playing.value) {
    ElMessage.warning('正在播放中，请稍候...')
    return
  }
  
  timeIndex.value = 0
  playing.value = true
  
  // 清除之前的定时器
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  
  intervalId = setInterval(() => {
    if (timeIndex.value < history.value.length - 1) {
      timeIndex.value++
    } else {
      clearInterval(intervalId)
      intervalId = null
      playing.value = false
      ElMessage.success('风险演变演示完成！')
    }
  }, 1500) // 每1.5秒切换一次
}

// ========== 5.1 雷达图数据 ==========
const getRadarDataByTime = (index) => {
  const level = history.value[index]?.riskLevel || '低'
  switch(level) {
    case '低': return [25, 20, 18, 30, 28]
    case '中': return [55, 48, 52, 42, 50]
    case '高': return [82, 68, 88, 58, 75]
    default: return [25, 20, 18, 30, 28]
  }
}

const radarOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  radar: {
    indicator: [
      { name: '交付能力', max: 100 },
      { name: '质量管控', max: 100 },
      { name: '风险控制', max: 100 },
      { name: '合规性', max: 100 },
      { name: '合作稳定性', max: 100 }
    ],
    shape: 'polygon',
    splitNumber: 4,
    axisName: {
      color: '#333',
      fontSize: 13
    },
    splitArea: {
      areaStyle: {
        color: ['rgba(64, 158, 255, 0.02)', 'rgba(64, 158, 255, 0.06)']
      }
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(64, 158, 255, 0.2)'
      }
    }
  },
  series: [{
    type: 'radar',
    data: [{
      value: getRadarDataByTime(timeIndex.value),
      name: '风险评分',
      areaStyle: {
        color: 'rgba(64, 158, 255, 0.3)'
      },
      lineStyle: {
        color: '#409EFF',
        width: 2
      },
      itemStyle: {
        color: '#409EFF'
      }
    }],
    symbol: 'circle',
    symbolSize: 6
  }]
}))

// ========== 供应商数据 ==========
// 供应商基本信息
const supplierInfo = ref({
  name: 'XX科技有限公司',
  code: '91440101MA5XXXXXX',
  contact: '张经理',
  phone: '138****1234',
  status: '合作中'
})

// 供应商项目数据
const supplierProjects = ref([
  { 
    id: 1, 
    name: '网银重构项目', 
    status: '进行中',
    amount: '¥1,200,000',
    startDate: '2024-01-15'
  },
  { 
    id: 2, 
    name: '核心支付系统升级', 
    status: '已完成',
    amount: '¥2,800,000',
    startDate: '2023-06-01'
  },
  { 
    id: 3, 
    name: '手机银行开发', 
    status: '进行中',
    amount: '¥950,000',
    startDate: '2024-03-20'
  },
  { 
    id: 4, 
    name: '数据中台建设项目', 
    status: '待启动',
    amount: '¥3,500,000',
    startDate: '2025-01-01'
  }
])

// ========== 生命周期 ==========
// 组件卸载时清除定时器
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
})
</script>

<style scoped>
.supplier-detail {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f0f2f5;
  min-height: 100vh;
}

/* ========== 5.3 时间轴控制样式 ========== */
.demo-control {
  display: flex;
  align-items: center;
  background: #ffffff;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
  gap: 12px;
}

.current-date {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  font-weight: 500;
}

.event-desc {
  font-size: 13px;
  color: #909399;
  flex: 1;
  min-width: 150px;
}

/* ========== 卡片通用样式 ========== */
.supplier-info-card,
.radar-card,
.project-cards {
  margin-bottom: 20px;
  background: #ffffff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ========== 供应商信息 ========== */
.info-item {
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.8;
}

.info-item label {
  color: #909399;
  font-weight: 500;
  margin-right: 4px;
}

.info-item span {
  color: #303133;
}

/* ========== 5.2 关系图布局 ========== */
.project-section {
  margin-top: 0;
}

.project-cards-wrapper {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 20px;
  align-items: start;
}

.project-cards {
  margin-bottom: 0;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.project-item {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  transition: all 0.3s;
  border-left: 3px solid #409EFF;
}

.project-item:hover {
  background: #e8edf5;
  transform: translateX(4px);
}

.project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.project-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.project-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}

.project-meta span {
  background: #ffffff;
  padding: 2px 10px;
  border-radius: 4px;
}

.relation-graph-wrapper {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ========== 滚动条美化 ========== */
.project-list::-webkit-scrollbar {
  width: 4px;
}

.project-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.project-list::-webkit-scrollbar-track {
  background: #f5f7fa;
}

/* ========== 响应式调整 ========== */
@media (max-width: 1200px) {
  .project-cards-wrapper {
    grid-template-columns: 1fr;
  }
  
  .project-list {
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .demo-control {
    flex-direction: column;
    align-items: stretch;
  }
  
  .demo-control .el-button {
    width: 100%;
  }
  
  .event-desc {
    text-align: center;
  }
  
  .supplier-detail {
    padding: 12px;
  }
}
</style>