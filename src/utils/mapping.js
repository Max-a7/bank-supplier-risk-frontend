// src/utils/mapping.js

// 风险等级颜色映射
export const getRiskLevelColor = (level) => {
  const colorMap = {
    'LOW': '#67C23A',     // 绿色
    'MEDIUM': '#E6A23C',  // 黄色
    'HIGH': '#F56C6C'     // 红色
  };
  return colorMap[level] || '#909399';
};

// 风险等级中文映射
export const getRiskLevelText = (level) => {
  const map = { 'LOW': '低风险', 'MEDIUM': '中风险', 'HIGH': '高风险' };
  return map[level] || '未知';
};

// 风险趋势类型映射
export const getRiskTrendText = (type) => {
  const map = { 
    'RISING': '风险上升', 
    'STEADY': '风险平稳', 
    'FALLING': '风险回落', 
    'SUDDEN_JUMP': '突发跳变' 
  };
  return map[type] || '平稳';
};

// 处置建议类型映射
export const getDisposalTypeText = (type) => {
  const map = { 'rectify': '整改', 'observe': '持续观察', 'alert': '风险告警' };
  return map[type] || '建议';
};