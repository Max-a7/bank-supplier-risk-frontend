<template>
  <div class="page-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="待处置" name="pending">
        <disposal-table :list="pendingList" />
      </el-tab-pane>
      <el-tab-pane label="整改中" name="rectifying">
        <disposal-table :list="rectifyingList" />
      </el-tab-pane>
      <el-tab-pane label="已复评" name="completed">
        <disposal-table :list="completedList" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DisposalTable from '@/components/DisposalTable.vue'

const activeTab = ref('pending')

const allDisposals = ref([
  {
    id: 'DISP001',
    supplierName: '某科技股份有限公司',
    riskTitle: '核心开发人员离职',
    suggestion: '要求供应商限期补充核心开发人员，启动人员替代方案',
    status: '待处置',
    deadline: '2025-07-10',
    reviewer: '张经理'
  },
  {
    id: 'DISP002',
    supplierName: '某云服务商',
    riskTitle: '安全漏洞披露',
    suggestion: '要求供应商完成漏洞修复并提供修复报告',
    status: '整改中',
    deadline: '2025-07-20',
    reviewer: '李经理'
  }
])

const pendingList = computed(() => allDisposals.value.filter((d) => d.status === '待处置'))
const rectifyingList = computed(() => allDisposals.value.filter((d) => d.status === '整改中'))
const completedList = computed(() => allDisposals.value.filter((d) => d.status === '已复评'))
</script>