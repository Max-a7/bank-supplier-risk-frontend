// src/utils/mapping.js

export const getRiskLevelColor = (level) => {
  const colorMap = { 'RED': 'danger', 'YELLOW': 'warning', 'GREEN': 'success' }
  return colorMap[level] || 'info'
}

export const getRiskLevelText = (level) => {
  const map = { 'RED': '高风险', 'YELLOW': '中风险', 'GREEN': '低风险' }
  return map[level] || '未知'
}

export const getRiskTrendText = (type) => {
  const map = { 
    'RISING': '风险上升', 
    'STEADY': '风险平稳', 
    'FALLING': '风险回落', 
    'SUDDEN_JUMP': '突发跳变' 
  }
  return map[type] || '平稳'
}

export const getDisposalTypeText = (type) => {
  const map = { 'rectify': '整改', 'observe': '持续观察', 'alert': '风险告警' }
  return map[type] || '建议'
}