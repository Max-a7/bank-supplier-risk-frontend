<!-- src/charts/BaseChart.vue -->
<template>
  <div ref="chartRef" :style="{ height: height, width: '100%' }"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: {
    type: Object,
    required: true
  },
  height: {
    type: String,
    default: '300px'
  }
})

const chartRef = ref(null)
let chartInstance = null
let resizeObserver = null

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(props.option)
    
    // 使用 ResizeObserver 代替 window resize
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (chartInstance) {
          chartInstance.resize()
        }
      })
      resizeObserver.observe(chartRef.value)
    } else {
      window.addEventListener('resize', resizeChart)
    }
  }
}

// 更新图表
const updateChart = () => {
  if (chartInstance) {
    chartInstance.setOption(props.option)
  }
}

// 自适应
const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 窗口尺寸变化时自适应
const handleWindowResize = () => {
  resizeChart()
}

onMounted(() => {
  // 延迟初始化确保DOM渲染完成
  nextTick(() => {
    initChart()
  })
})

// 监听 option 变化
watch(() => props.option, () => {
  updateChart()
}, { deep: true })

// 监听高度变化
watch(() => props.height, () => {
  nextTick(() => {
    resizeChart()
  })
})

onUnmounted(() => {
  // 清理 ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  
  window.removeEventListener('resize', handleWindowResize)
  
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>