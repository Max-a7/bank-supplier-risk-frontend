<!-- src/views/SupplierDetail.vue -->
<template>
  <div class="supplier-detail">
    <!-- 时间轴演示控制 -->
    <div class="demo-control">
      <el-button type="primary" @click="playRiskEvolution" :disabled="playing">
        {{ playing ? '播放中...' : '▶ 播放风险演变' }}
      </el-button>
      <el-slider
        v-model="timeIndex"
        :min="0"
        :max="history.length > 0 ? history.length - 1 : 0"
        :format-tooltip="formatTooltip"
        style="flex: 1; margin: 0 20px;"
      />
      <span class="current-date">📅 {{ history[timeIndex]?.date || '暂无数据' }}</span>
      <el-tag :type="getRiskTagType(history[timeIndex]?.riskLevel)" size="large">
        {{ history[timeIndex]?.riskLevel || '无数据' }}
      </el-tag>
      <span class="event-desc">{{ history[timeIndex]?.event || '暂无事件' }}</span>
    </div>

    <!-- 供应商基本信息 -->
    <el-card class="supplier-info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span><strong>供应商基本信息</strong></span>
          <el-tag type="primary" size="large">{{ supplierInfo.status }}</el-tag>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>供应商名称：</label>
            <span>{{ supplierInfo.name }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>供应商ID：</label>
            <span>{{ supplierInfo.code }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>联系人：</label>
            <span>{{ supplierInfo.contact }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>联系电话：</label>
            <span>{{ supplierInfo.phone }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>合作状态：</label>
            <el-tag type="success">{{ supplierInfo.status }}</el-tag>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>风险等级：</label>
            <el-tag :type="getRiskTagType(currentRiskLevel)">
              {{ currentRiskLevel }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 六维度雷达图 -->
    <el-card class="radar-card" shadow="hover">
      <template #header>
        <span><strong>六维度风险雷达图</strong></span>
        <span style="font-size: 12px; color: #909399; margin-left: 12px;">
          （当前风险等级：{{ currentRiskLevel }}）
        </span>
      </template>
      <BaseChart :option="radarOption" height="350px" />
    </el-card>

    <!-- 关系图 -->
    <div class="project-section">
      <div class="project-cards-wrapper">
        <el-card class="project-cards" shadow="hover">
          <template #header>
            <span><strong>关联项目（{{ supplierProjects.length }}个）</strong></span>
          </template>
          <div class="project-list">
            <div v-for="project in supplierProjects" :key="project.id" class="project-item">
              <div class="project-info">
                <span class="project-name">{{ project.name }}</span>
                <el-tag :type="getProjectStatusType(project.status)" size="small">
                  {{ project.status }}
                </el-tag>
              </div>
              <div class="project-meta">
                <span>合同金额：{{ project.amount }}</span>
                <span>开始日期：{{ project.startDate }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <div class="relation-graph-wrapper">
          <RelationGraph :supplier-id="supplierId" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import RelationGraph from '@/components/RelationGraph.vue'
import BaseChart from '@/components/charts/BaseChart.vue'
import { getAgentRiskOutput } from '@/api/risk.js'

const route = useRoute()
const supplierId = ref(route.params.id || 'S-REC198')

// ================= 核心数据 =================
const report = ref({})
const supplierName = ref('加载中...')  // 独立的供应商名称状态

// ⭐ 判断字符串是否像 ID（兼容普通连字符 - 和特殊连字符 ‑）
const isLikeId = (str) => /^S[-‑]/.test(String(str || ''))

// 时序数据：从 evidence_summary 动态生成
const history = computed(() => {
  const items = report.value?.evidence_summary || []
  if (items.length === 0) return []
  return items
    .sort((a, b) => (a.event_week || 0) - (b.event_week || 0))
    .map(item => ({
      date: `第 ${item.event_week} 周`,
      riskLevel: item.event_severity >= 4 ? '高' : item.event_severity >= 3 ? '中' : '低',
      event: `[${item.event_category}] ${item.event_subtype}（严重度：${item.event_severity}）`
    }))
})

// 供应商基本信息
const supplierInfo = computed(() => ({
  name: supplierName.value,
  code: report.value?.supplier_id || report.value?.supplier_profile?.supplier_id || '--',
  contact: '张经理',
  phone: '138****1234',
  status: '合作中'
}))

// 当前风险等级
const currentRiskLevel = computed(() => {
  const level = report.value?.risk_grade?.risk_level
  const map = { 'RED': '高', 'YELLOW': '中', 'GREEN': '低' }
  return map[level] || '低'
})

// ================= 时间轴 =================
const timeIndex = ref(0)
const playing = ref(false)
let intervalId = null

const formatTooltip = (val) => history.value[val]?.date || ''

const getRiskTagType = (level) => {
  const map = { '低': 'success', '中': 'warning', '高': 'danger' }
  return map[level] || 'info'
}

const getProjectStatusType = (status) => {
  const map = { '进行中': 'warning', '已完成': 'success', '已暂停': 'danger', '待启动': 'info' }
  return map[status] || 'info'
}

const playRiskEvolution = () => {
  if (playing.value) return
  if (history.value.length === 0) {
    ElMessage.warning('暂无风险事件可播放')
    return
  }
  timeIndex.value = 0
  playing.value = true
  if (intervalId) clearInterval(intervalId)

  intervalId = setInterval(() => {
    if (timeIndex.value < history.value.length - 1) {
      timeIndex.value++
    } else {
      clearInterval(intervalId)
      intervalId = null
      playing.value = false
      ElMessage.success('风险演变演示完成！')
    }
  }, 1500)
}

// ================= 雷达图 =================
const radarOption = computed(() => {
  const dimensions = ['公司背景', '司法', '失信', '经营风险', '经营状况', '知识产权']
  const breakdown = report.value?.dimension_breakdown || []

  const radarData = dimensions.map(dim => {
    const item = breakdown.find(b => b.dimension === dim)
    return item?.score || 0
  })

  return {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: dimensions.map(dim => ({ name: dim, max: 3 })),
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#333', fontSize: 12 },
      splitArea: {
        areaStyle: { color: ['rgba(64, 158, 255, 0.02)', 'rgba(64, 158, 255, 0.06)'] }
      },
      axisLine: { lineStyle: { color: 'rgba(64, 158, 255, 0.2)' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData,
        name: '风险评分',
        areaStyle: { color: 'rgba(64, 158, 255, 0.3)' },
        lineStyle: { color: '#409EFF', width: 2 },
        itemStyle: { color: '#409EFF' }
      }],
      symbol: 'circle',
      symbolSize: 6
    }]
  }
})

// ================= 关联项目（静态） =================
const supplierProjects = ref([
  { id: 1, name: '网银重构项目', status: '进行中', amount: '¥1,200,000', startDate: '2024-01-15' },
  { id: 2, name: '核心支付系统升级', status: '已完成', amount: '¥2,800,000', startDate: '2023-06-01' },
  { id: 3, name: '手机银行开发', status: '进行中', amount: '¥950,000', startDate: '2024-03-20' },
  { id: 4, name: '数据中台建设项目', status: '待启动', amount: '¥3,500,000', startDate: '2025-01-01' }
])

// ================= 生命周期 =================
const fetchDetail = async () => {
  console.log('【前端】开始 fetchDetail:', supplierId.value)

  // 1. 先拿报告
  const data = await getAgentRiskOutput(supplierId.value)
  report.value = data || {}
  timeIndex.value = 0

  // 2. 先尝试用 report 里的名字
  let name = data?.supplier_name
  console.log('【前端】report.supplier_name =', name)

  // 3. 如果名字缺失或以 S- / S‑ 开头，就主动去数据库接口拿
  if (!name || isLikeId(name)) {
    try {
      console.log('【前端】尝试从数据库获取名称:', supplierId.value)
      const res = await axios.get(`/api/backend/suppliers/${supplierId.value}`)
      console.log('【前端】/backend/suppliers 返回:', res.data)

      const dbSupplier = res.data?.data || res.data
      if (dbSupplier?.supplier_name && !isLikeId(dbSupplier.supplier_name)) {
        name = dbSupplier.supplier_name
        console.log('【前端】兜底获取名称成功:', name)
      }
    } catch (e) {
      console.error('【前端】兜底获取名称失败:', e)
    }
  }

  // 4. 最终覆盖
  supplierName.value = name || supplierId.value
  console.log('【前端】最终展示名称:', supplierName.value)
}

onMounted(() => {
  fetchDetail()
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    supplierId.value = newId
    supplierName.value = '加载中...'
    fetchDetail()
  }
})

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