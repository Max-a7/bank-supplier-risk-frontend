<!-- src/components/RelationGraph.vue -->
<template>
  <div class="relation-graph-container">
    <div class="graph-header">
      <span class="graph-title">🔗 供应商-合同-项目-系统 关系图</span>
      <div class="legend">
        <span v-for="cat in legendCategories" :key="cat.name" class="legend-item">
          <span class="legend-dot" :style="{ background: cat.color }"></span>
          {{ cat.name }}
        </span>
      </div>
    </div>

    <!-- 无数据时显示空状态 -->
    <el-empty v-if="!graphData || !graphData.nodes || graphData.nodes.length === 0" description="暂无关系数据" />

    <!-- 有数据时渲染关系图 -->
    <BaseChart v-else :option="option" height="420px" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseChart from '@/components/charts/BaseChart.vue'

const props = defineProps({
  graphData: {
    type: Object,
    default: () => ({ nodes: [], edges: [], categories: [] })
  }
})

// 图例（固定 4 类，与后端 categories 顺序一致）
const legendCategories = [
  { name: '供应商', color: '#409EFF' },
  { name: '合同', color: '#67C23A' },
  { name: '项目', color: '#E6A23C' },
  { name: '系统', color: '#F56C6C' }
]

// 节点颜色映射（按 category 索引）
const categoryColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
const categoryNames = ['供应商', '合同', '项目', '系统']

// 节点大小：供应商最大，其他略小
const getSymbolSize = (type) => {
  const map = { 'SUPPLIER': 60, 'CONTRACT': 42, 'PROJECT': 42, 'SYSTEM': 38 }
  return map[type] || 38
}

// 真实数据 → ECharts option
const option = computed(() => {
  const nodes = props.graphData?.nodes || []
  const edges = props.graphData?.edges || []

  // 1. 转换节点
  const data = nodes.map(node => ({
    id: node.id,
    name: node.label || node.id,
    category: node.category ?? 0,
    symbolSize: getSymbolSize(node.type),
    itemStyle: { color: categoryColors[node.category] || '#409EFF' },
    attributes: node.attributes || {}
  }))

  // 2. 转换边
  const links = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    relationship: edge.relationship
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'node') {
          const catName = categoryNames[params.data.category] || '未知'
          let html = `<strong>${params.name}</strong><br/>类型: ${catName}`
          // 显示 attributes
          const attrs = params.data.attributes
          if (attrs && Object.keys(attrs).length > 0) {
            html += '<br/>'
            Object.entries(attrs).forEach(([k, v]) => {
              html += `${k}: ${v}<br/>`
            })
          }
          return html
        }
        return `${params.data.source} → ${params.data.target}`
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
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3 }
        },
        data,
        links,
        categories: legendCategories.map(c => ({
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
  }
})
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