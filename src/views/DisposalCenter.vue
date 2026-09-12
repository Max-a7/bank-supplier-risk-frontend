<!-- src/views/DisposalCenter.vue -->
<template>
  <div class="page-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="待处置" name="pending">
        <el-table :data="pendingList" stripe style="width: 100%">
          <el-table-column prop="supplierName" label="供应商" min-width="180" />
          <el-table-column prop="riskTitle" label="风险事件" min-width="160" />
          <el-table-column prop="suggestion" label="处置建议" min-width="240" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default>
              <el-tag type="danger">待处置</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deadline" label="整改期限" width="120" />
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
      </el-tab-pane>

      <el-tab-pane label="整改中" name="rectifying">
        <el-table :data="rectifyingList" stripe style="width: 100%">
          <el-table-column prop="supplierName" label="供应商" min-width="180" />
          <el-table-column prop="riskTitle" label="风险事件" min-width="160" />
          <el-table-column prop="suggestion" label="处置建议" min-width="240" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default>
              <el-tag type="warning">整改中</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deadline" label="整改期限" width="120" />
          <el-table-column prop="reviewer" label="复核人" width="100" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default>
              <div class="action-buttons">
                <el-button type="primary" size="small">查看</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="已复评" name="completed">
        <el-table :data="completedList" stripe style="width: 100%">
          <el-table-column prop="supplierName" label="供应商" min-width="180" />
          <el-table-column prop="riskTitle" label="风险事件" min-width="160" />
          <el-table-column prop="suggestion" label="处置建议" min-width="240" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default>
              <el-tag type="success">已复评</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deadline" label="整改期限" width="120" />
          <el-table-column prop="reviewer" label="复核人" width="100" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default>
              <div class="action-buttons">
                <el-button size="small">查看报告</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSupplierRiskList } from '@/api/risk.js'

const activeTab = ref('pending')

// 存储从 API 拿到的高风险供应商
const allDisposals = ref([])

// 从 API 动态生成待处置列表
const fetchDisposals = async () => {
  const list = await getSupplierRiskList()
  
  // 只筛选高风险供应商作为待处置任务，并按风险分降序
  allDisposals.value = list
    .filter(item => item.risk_level === 'HIGH')
    .sort((a, b) => b.risk_score - a.risk_score)
    .map((item, index) => ({
      id: `DISP${String(index + 1).padStart(3, '0')}`,
      supplierName: item.name,
      riskTitle: item.risk_drive_factors?.join('、') || '综合风险',
      suggestion: `要求供应商限期完成整改，重点处理：${item.risk_drive_factors?.join('、') || '综合风险'}`,
      status: '待处置',
      deadline: '2026-09-30',
      reviewer: '张经理'
    }))
}

const pendingList = computed(() => allDisposals.value.filter(d => d.status === '待处置'))
const rectifyingList = computed(() => allDisposals.value.filter(d => d.status === '整改中'))
const completedList = computed(() => allDisposals.value.filter(d => d.status === '已复评'))

onMounted(() => {
  fetchDisposals()
})
</script>

<style scoped>
.page-container {
  padding: 0;
}

/* 让操作列的两个按钮横向对齐 */
.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>