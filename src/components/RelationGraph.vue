<!-- src/components/RelationGraph.vue -->
<template>
  <div class="relation-graph-container">
    <div class="graph-header">
      <span class="graph-title">🔗 供应商-合同-项目-系统 关系图</span>
      <div class="legend">
        <span v-for="cat in categories" :key="cat.name" class="legend-item">
          <span class="legend-dot" :style="{ background: cat.color }"></span>
          {{ cat.name }}
        </span>
      </div>
    </div>
    <!-- 注意：BaseChart 在 src/charts/ 下 -->
    <BaseChart :option="option" height="420px" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
// BaseChart 在 charts 目录下
import BaseChart from '@/components/charts/BaseChart.vue'

const props = defineProps({
  supplierId: {
    type: String,
    required: true
  }
})

const categories = [
  { name: '供应商', color: '#409EFF' },
  { name: '合同', color: '#67C23A' },
  { name: '项目', color: '#E6A23C' },
  { name: '系统', color: '#F56C6C' }
]

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      if (params.dataType === 'node') {
        const categoryName = categories[params.data.category]?.name || '未知'
        return `<strong>${params.name}</strong><br/>类型: ${categoryName}`
      }
      return `<strong>${params.data.source}</strong> → <strong>${params.data.target}</strong>`
    }
  },
  series: [
    {
      type: 'graph',
      layout: 'force',
      roam: true,
      draggable: true,
      label: {
        show: true,
        position: 'bottom',
        fontSize: 12,
        color: '#333',
        fontWeight: 500
      },
      edgeLabel: {
        show: false
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 3
        }
      },
      data: [
        { name: 'XX科技', category: 0, symbolSize: 55, itemStyle: { color: '#409EFF' } },
        { name: '合同C001', category: 1, symbolSize: 38, itemStyle: { color: '#67C23A' } },
        { name: '合同C003', category: 1, symbolSize: 38, itemStyle: { color: '#67C23A' } },
        { name: '合同C005', category: 1, symbolSize: 38, itemStyle: { color: '#67C23A' } },
        { name: '网银重构项目', category: 2, symbolSize: 42, itemStyle: { color: '#E6A23C' } },
        { name: '核心支付系统', category: 3, symbolSize: 42, itemStyle: { color: '#F56C6C' } },
        { name: '手机银行', category: 3, symbolSize: 35, itemStyle: { color: '#F56C6C' } },
        { name: '项目PRJ01', category: 2, symbolSize: 38, itemStyle: { color: '#E6A23C' } },
        { name: '数据中台', category: 3, symbolSize: 35, itemStyle: { color: '#F56C6C' } }
      ],
      links: [
        { source: 'XX科技', target: '合同C001' },
        { source: 'XX科技', target: '合同C003' },
        { source: 'XX科技', target: '合同C005' },
        { source: '合同C001', target: '网银重构项目' },
        { source: '合同C001', target: '核心支付系统' },
        { source: '合同C003', target: '手机银行' },
        { source: '合同C003', target: '项目PRJ01' },
        { source: '合同C005', target: '数据中台' },
        { source: '核心支付系统', target: '项目PRJ01' }
      ],
      categories: categories.map(c => ({ 
        name: c.name,
        itemStyle: { color: c.color }
      })),
      force: {
        repulsion: 350,
        edgeLength: [100, 180],
        layoutAnimation: true,
        gravity: 0.1
      },
      lineStyle: {
        color: '#ccc',
        width: 2,
        curveness: 0.2
      },
      edgeSymbol: ['none', 'arrow'],
      edgeSymbolSize: [0, 8]
    }
  ]
}))
</script>

<style scoped>
.relation-graph-container {
  padding: 16px 20px 20px 20px;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}

.graph-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
</style>