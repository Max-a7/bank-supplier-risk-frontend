<!-- src/views/AgentTrace.vue -->
<!-- src/views/AgentTrace.vue -->
<template>
  <div>
    <el-page-header content="Agent研判过程" @back="$router.back()" />

    <el-card v-if="trace" shadow="hover" class="mt-20">
      <!-- 顶部：步骤条（展示 6 个 Agent 流转） -->
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step
          v-for="step in trace.steps"
          :key="step.agent_name"
          :title="step.agent_name"
          :description="getStatusLabel(step.llm_status)"
        />
      </el-steps>

      <!-- 中部：时间线（详细推理日志） -->
      <el-timeline class="mt-20">
        <el-timeline-item
          v-for="(step, idx) in trace.steps"
          :key="idx"
          :timestamp="`T + ${step.execution_order * 0.5}s`"
          :type="getTimelineType(step.llm_status)"
        >
          <p><strong>{{ step.agent_name }}</strong></p>
          <p>{{ step.summary }}</p>

          <!-- 证据链 -->
          <div class="evidence-list" v-if="step.evidence_ids && step.evidence_ids.length">
            <el-tag
              v-for="e in step.evidence_ids"
              :key="e"
              size="small"
              class="mr-5"
              type="info"
            >
              {{ e }}
            </el-tag>
          </div>

          <!-- 折叠详情（output 结构） -->
          <el-collapse v-if="step.output" class="mt-10">
            <el-collapse-item title="查看详细输出" name="1">
              <pre class="output-json">{{ JSON.stringify(step.output, null, 2) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <el-empty v-else description="正在加载 Agent 研判数据..." />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAgentRiskOutput, getAgentTrace, getSupplierReports } from '@/api/risk.js'

const route = useRoute()
const trace = ref(null)

// 当前进行到第几步
const activeStep = computed(() => {
  if (!trace.value) return 0
  const pendingIndex = trace.value.steps?.findIndex((s) => s.llm_status !== 'SUCCESS')
  return pendingIndex === -1 ? (trace.value.steps?.length || 0) : pendingIndex
})

// 状态 → 时间线颜色
const getTimelineType = (status) => {
  const map = {
    'SUCCESS': 'success',
    'FALLBACK': 'warning',
    'DISABLED': 'info',
    'UNKNOWN': 'info',
    'SKIPPED': 'info'
  }
  return map[status] || 'primary'
}

// 状态 → 中文
const getStatusLabel = (status) => {
  const map = {
    'SUCCESS': '执行成功',
    'FALLBACK': '已回退模板',
    'DISABLED': '节点已关闭',
    'UNKNOWN': '未启用',
    'SKIPPED': '已跳过'
  }
  return map[status] || status
}

onMounted(async () => {
  const supplierId = route.params.eventId || 'DEMO-IMPORTANT'
  console.log('【AgentTrace】开始加载:', supplierId)

  // 1. 先拿供应商的 report_id
  const reports = await getSupplierReports(supplierId)
  const reportId = reports?.[0]?.report_id

  if (!reportId) {
    console.warn('【AgentTrace】无 report_id')
    return
  }

  // 2. 调 agent-trace 接口
  const data = await getAgentTrace(reportId)
  console.log('【AgentTrace】拿到数据:', data)
  trace.value = data
})
</script>

<style scoped>
.mt-20 {
  margin-top: 20px;
}
.mt-10 {
  margin-top: 10px;
}
.mr-5 {
  margin-right: 5px;
}
.evidence-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.output-json {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}
</style>