<t<template>
  <div>
    <el-page-header content="Agent研判过程" @back="$router.back()" />
    <el-card v-if="trace" shadow="hover" class="mt-20">
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step
          v-for="step in trace.steps"
          :key="step.agent"
          :title="step.agent"
          :description="step.status"
        />
      </el-steps>

      <el-timeline class="mt-20">
        <el-timeline-item
          v-for="(step, idx) in trace.steps"
          :key="idx"
          :timestamp="step.time"
          :type="idx === trace.steps.length - 1 ? 'primary' : 'success'"
        >
          <p><strong>{{ step.agent }}</strong></p>
          <p>{{ step.result }}</p>
          <div class="evidence-list">
            <el-tag v-for="e in step.evidence" :key="e" size="small" class="mr-5">
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
import { mockApi } from '@/api/mockData'

const route = useRoute()
const trace = ref(null)

const activeStep = computed(() => {
  if (!trace.value) return 0
  return trace.value.steps.findIndex((s) => s.status !== '完成') === -1
    ? trace.value.steps.length
    : trace.value.steps.findIndex((s) => s.status !== '完成')
})

onMounted(async () => {
  const traceId = route.params.eventId || 'TRACE20250612'
  trace.value = await mockApi.getAgentTrace(traceId)
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
}
</style>