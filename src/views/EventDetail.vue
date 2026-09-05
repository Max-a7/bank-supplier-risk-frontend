<template>
  <div v-if="event">
    <el-card shadow="hover" class="mb-20">
      <h2>{{ event.title }}</h2>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="风险类别">{{ event.category }}</el-descriptions-item>
        <el-descriptions-item label="严重度">{{ event.severity }}</el-descriptions-item>
        <el-descriptions-item label="可信度">{{ event.credibility }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ event.source }}</el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ event.occurredAt }}</el-descriptions-item>
        <el-descriptions-item label="来源类型">{{ event.sourceType }}</el-descriptions-item>
      </el-descriptions>
      <div class="summary">
        <p><strong>事件摘要：</strong>{{ event.summary }}</p>
      </div>
    </el-card>

    <el-card shadow="hover" class="mb-20">
      <template #header>关联项目/系统</template>
      <el-table :data="impactObjects" stripe>
        <el-table-column prop="name" label="对象" min-width="150" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="importance" label="业务重要性" width="120" />
      </el-table>
    </el-card>

    <el-card shadow="hover" class="mb-20">
      <template #header>证据链 Evidence Chain</template>
      <el-timeline>
        <el-timeline-item
          v-for="(item, idx) in event.evidenceChain"
          :key="idx"
          :timestamp="item.time"
        >
          <p><strong>{{ item.node }}</strong></p>
          <p>{{ item.originalInfo }}</p>
          <p class="text-info">置信度：{{ item.confidence }}</p>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <div class="action-bar">
      <el-button type="primary" @click="goAgentTrace">查看Agent研判过程</el-button>
      <el-button @click="$router.back()">返回</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mockApi } from '@/api/mockData'

const route = useRoute()
const router = useRouter()
const event = ref(null)

const impactObjects = computed(() => {
  if (!event.value) return []
  return event.value.impactObjects.map((name) => ({
    name,
    type: name.includes('项目') ? '项目' : '系统',
    importance: '高'
  }))
})

const goAgentTrace = () => {
  router.push(`/agent-trace/${event.value.relatedAgentTraceId}`)
}

onMounted(async () => {
  event.value = await mockApi.getEventById(route.params.id)
})
</script>

<style scoped>
.mb-20 {
  margin-bottom: 20px;
}
.summary {
  margin-top: 15px;
  line-height: 1.8;
}
.action-bar {
  display: flex;
  gap: 12px;
}
</style>