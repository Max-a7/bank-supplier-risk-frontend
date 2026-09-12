<!-- src/views/AgentTrace.vue -->
<template>
  <div>
    <el-page-header content="Agent研判过程" @back="$router.back()" />
    
    <el-card v-if="trace" shadow="hover" class="mt-20">
      <!-- 顶部：步骤条（展示 6 个 Agent 流转） -->
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step
          v-for="step in trace.steps"
          :key="step.agent"
          :title="step.agent"
          :description="step.statusLabel"
        />
      </el-steps>

      <!-- 中部：时间线（详细推理日志） -->
      <el-timeline class="mt-20">
        <el-timeline-item
          v-for="(step, idx) in trace.steps"
          :key="idx"
          :timestamp="step.time"
          :type="getTimelineType(step.status)"
        >
          <p><strong>{{ step.agent }}</strong></p>
          <p>{{ step.result }}</p>
          <div class="evidence-list" v-if="step.evidence && step.evidence.length">
            <el-tag 
              v-for="e in step.evidence" 
              :key="e" 
              size="small" 
              class="mr-5"
              type="info"
            >
              {{ e }}
            </el-tag>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
    
    <el-empty v-else description="未找到研判过程" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAgentRiskOutput } from '@/api/risk.js'

const route = useRoute()
const trace = ref(null)

// 计算当前进行到第几步
const activeStep = computed(() => {
  if (!trace.value) return 0
  const pendingIndex = trace.value.steps.findIndex((s) => s.status !== 'SUCCESS')
  return pendingIndex === -1 ? trace.value.steps.length : pendingIndex
})

// 根据状态返回步骤条颜色
const getTimelineType = (status) => {
  const map = {
    'SUCCESS': 'success',
    'FALLBACK': 'warning',
    'DISABLED': 'info',
    'SKIPPED': 'info'
  }
  return map[status] || 'primary'
}

// 状态文字映射
const getStatusLabel = (status) => {
  const map = {
    'SUCCESS': '执行成功',
    'FALLBACK': '已回退模板',
    'DISABLED': '节点已关闭',
    'SKIPPED': '已跳过'
  }
  return map[status] || '未知'
}

// 模拟生成 6 个 Agent 节点的研判过程（等后端 API 完善后，替换为真实接口返回）
const buildTraceFromReport = (report) => {
  const nodeStatus = report?.llm_node_status || {}
  
  return {
    steps: [
      {
        agent: '维度归类 Agent',
        status: nodeStatus.dimension_mapping || 'SUCCESS',
        statusLabel: getStatusLabel(nodeStatus.dimension_mapping || 'SUCCESS'),
        time: 'T + 0.5s',
        result: '已将原始风险事件归类至六维度（公司背景/司法/失信/经营/经营状况/知识产权）',
        evidence: ['六维度映射表']
      },
      {
        agent: '风险识别 Agent',
        status: nodeStatus.risk_identification || 'FALLBACK',
        statusLabel: getStatusLabel(nodeStatus.risk_identification || 'FALLBACK'),
        time: 'T + 1.2s',
       result: `已识别当前风险等级：${report?.risk_grade?.grade_label || report?.risk_level || '未知'}，命中规则 R-001, R-005`,
        evidence: ['规则引擎分级结果']
      },
      {
        agent: '关联分析 Agent',
        status: nodeStatus.association_analysis || 'SUCCESS',
        statusLabel: getStatusLabel(nodeStatus.association_analysis || 'SUCCESS'),
        time: 'T + 2.0s',
        result: `趋势研判：${report?.risk_trend?.trend_desc || '风险平稳'}`,
        evidence: ['趋势分析结果']
      },
      {
        agent: '证据 Agent',
        status: nodeStatus.evidence || 'SUCCESS',
        statusLabel: getStatusLabel(nodeStatus.evidence || 'SUCCESS'),
        time: 'T + 2.5s',
        result: `已关联 ${report?.evidence_chain?.evidence_items?.length || 0} 条证据，并完成时间与归属校验`,
        evidence: (report?.evidence_chain?.evidence_items || []).map(e => e.evidence_id)
      },
      {
        agent: '决策建议 Agent',
        status: nodeStatus.decision || 'SUCCESS',
        statusLabel: getStatusLabel(nodeStatus.decision || 'SUCCESS'),
        time: 'T + 3.0s',
        result: '已生成候选处置建议，等待人工复核',
        evidence: ['处置建议列表']
      },
      {
        agent: '一致性校验 Agent',
        status: nodeStatus.consistency_check || 'SKIPPED',
        statusLabel: getStatusLabel(nodeStatus.consistency_check || 'SKIPPED'),
        time: 'T + 3.2s',
        result: '交叉复核各智能体结论，未发现冲突',
        evidence: ['一致性校验记录']
      }
    ]
  }
}

onMounted(async () => {
  const supplierId = route.params.eventId || 'S-REC198'
  const report = await getAgentRiskOutput(supplierId)
  trace.value = buildTraceFromReport(report)
})
</script>

<style scoped>
.mt-20 {
  margin-top: 20px;
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
</style>