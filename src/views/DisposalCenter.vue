<!-- src/views/DisposalCenter.vue -->
<template>
  <div class="disposal-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="待处置" name="pending">
        <el-table :data="pendingList" stripe style="width: 100%" v-loading="loading">
          <el-table-column prop="supplier_name" label="供应商" min-width="200" />
          <el-table-column label="风险等级" width="120">
            <template #default>
              <el-tag type="danger">高风险</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="risk_score" label="风险分" width="100" sortable />
          <el-table-column prop="suggest_content" label="处置建议" min-width="300" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default>
              <el-tag type="warning">待处置</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deadline" label="整改期限" width="130" />
          <el-table-column prop="reviewer" label="复核人" width="100" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default>
              <div class="action-buttons">
                <el-button type="primary" size="small">确认</el-button>
                <el-button size="small">调整</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && pendingList.length === 0" description="暂无待处置任务" />
      </el-tab-pane>

      <el-tab-pane label="整改中" name="rectifying">
        <el-empty description="暂无整改中任务" />
      </el-tab-pane>

      <el-tab-pane label="已复评" name="completed">
        <el-empty description="暂无已复评任务" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDisposalList } from '@/api/risk.js'

const activeTab = ref('pending')
const pendingList = ref([])
const loading = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const list = await getDisposalList()
    console.log('【处置中心】获取到', list.length, '条待处置任务')
    pendingList.value = list
  } catch (e) {
    console.error('【处置中心】获取失败:', e)
    pendingList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.disposal-container {
  padding: 0;
}
.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>