// src/api/risk.js
import mockData from '@/mock/data_cases_200.json'

// ================== 通用工具 ==================

/**
 * 兼容特殊连字符（U+2010~U+2015、U+2212 等），统一归一化为普通 '-'
 * 解决 mock 数据里 "S‑REC198"（特殊连字符）与 URL 里 "S-REC198" 不匹配的问题
 */
const normalizeId = (str) => String(str || '').replace(/[\u2010-\u2015\u2212]/g, '-')

/**
 * 根据事件严重度计算风险等级
 */
const calculateRiskLevel = (events) => {
  if (!events || events.length === 0) return 'LOW'
  const maxSeverity = Math.max(...events.map(e => e.event_severity || 0))
  const totalEvents = events.length
  if (maxSeverity >= 4 || totalEvents >= 5) return 'HIGH'
  if (maxSeverity >= 3 || totalEvents >= 3) return 'MEDIUM'
  return 'LOW'
}

/**
 * 根据事件数量计算风险趋势
 */
const calculateRiskTrend = (events) => {
  if (!events || events.length === 0) return 'STEADY'
  if (events.length >= 4) return 'RISING'
  if (events.length >= 2) return 'STEADY'
  return 'FALLING'
}

/**
 * 把英文风险等级翻译成中文
 */
const riskLevelToChinese = (level) => {
  const map = { 'HIGH': '高风险', 'MEDIUM': '中风险', 'LOW': '低风险' }
  return map[level] || '低风险'
}

// ================== 对外 API ==================

/**
 * 获取供应商列表（Dashboard、SupplierList 共用）
 * 实际后端接口：GET /api/dashboard/top-risk-suppliers
 */
export const getSupplierRiskList = async (params) => {
  console.log('【前端】请求供应商列表:', params)

  const list = mockData.map(item => {
    const supplierObj = item.supplier || {}
    const supplierId = supplierObj.supplier_id || '未知ID'
    const name = supplierObj.name || '未知供应商'

    const events = item.risk_events || []
    const riskLevel = calculateRiskLevel(events)
    const trendType = calculateRiskTrend(events)
    const riskScore = events.reduce((sum, e) => sum + (e.event_severity || 0), 0)
    const driveFactors = [...new Set(events.map(e => e.event_category))]

    return {
      supplier_id: supplierId,
      name: name,
      risk_level: riskLevel,
      risk_score: riskScore,
      risk_trend: { trend_type: trendType },
      risk_drive_factors: driveFactors
    }
  })

  // 按风险分降序排列
  return Promise.resolve(list.sort((a, b) => b.risk_score - a.risk_score))
}

/**
 * 获取供应商详情（Agent 完整输出）
 * 实际后端接口：GET /agent/report/{supplier_id}
 */
export const getAgentRiskOutput = async (supplierId) => {
  console.log('【前端】请求 Agent 研判输出:', supplierId)

  const targetId = normalizeId(supplierId)

  // 查找匹配的供应商（兼容特殊连字符）
  let target = mockData.find(item => normalizeId(item.supplier?.supplier_id) === targetId)

  // 兜底：找不到就返回第一条数据，避免页面空白
  if (!target) {
    console.warn(`【前端】未找到供应商 ${supplierId}，使用第一条数据作为兜底`)
    target = mockData[0]
  }

  const events = target.risk_events || []
  const riskLevel = calculateRiskLevel(events)
  const riskScore = events.reduce((sum, e) => sum + (e.event_severity || 0), 0)

  return Promise.resolve({
    supplier_id: target.supplier?.supplier_id,
    supplier_name: target.supplier?.name,
    current_week: 52,
    risk_level: riskLevel,

    // ⬇️ 关键：补上 risk_grade 字段，解决“未知”问题 ⬇️
    risk_grade: {
      grade_tier: riskLevel,
      grade_label: riskLevelToChinese(riskLevel),
      grade_range: '[2.0, +∞)',
      window_display: '近12周'
    },

    risk_score: riskScore,
    risk_trend: {
      trend_type: calculateRiskTrend(events),
      trend_desc: `共发生 ${events.length} 起风险事件`,
      trend_support_evidence_ids: events.map(e => e.evidence_id)
    },
    evidence_chain: {
      chain_id: `CH-${target.supplier?.supplier_id}`,
      supplier_id: target.supplier?.supplier_id,
      summary: `基于 ${events.length} 条风险事件综合研判`,
      evidence_items: events.map(e => ({
        evidence_id: e.evidence_id,
        event_category: e.event_category,
        event_subtype: e.event_subtype,
        event_severity: e.event_severity,
        event_week: e.event_week,
        source_type: e.source_type,
        confidence: 0.85,
        contribution: e.event_severity / 10
      }))
    },
    risk_drive_factors: [...new Set(events.map(e => e.event_category))],
    pred_upgrade_label: riskLevel === 'HIGH' ? 1 : 0,
    pred_desc: riskLevel === 'HIGH' ? '预测未来3周存在高风险升级可能' : '风险平稳',
    suggest_dispose: [
      {
        suggest_type: riskLevel === 'HIGH' ? 'rectify' : 'observe',
        suggest_content: riskLevel === 'HIGH' ? '下发整改任务' : '持续观察',
        suggest_priority: riskLevel === 'HIGH' ? 'HIGH' : 'LOW'
      }
    ],

    // ⬇️ 6 个 Agent 节点的状态（用于 AgentTrace.vue）⬇️
    llm_node_status: {
      dimension_mapping: 'SUCCESS',
      risk_identification: 'FALLBACK',
      association_analysis: 'SUCCESS',
      evidence: 'SUCCESS',
      decision: 'SUCCESS',
      consistency_check: 'SKIPPED'
    },

    timestamp: new Date().toISOString()
  })
}

/**
 * 获取处置建议列表
 */
export const getDisposalList = async () => {
  const list = await getSupplierRiskList()
  return Promise.resolve(
    list
      .filter(item => item.risk_level === 'HIGH')
      .map((item, index) => ({
        id: `DISP${String(index + 1).padStart(3, '0')}`,
        supplier_id: item.supplier_id,
        supplier_name: item.name,
        risk_score: item.risk_score,
        suggest_content: `要求供应商限期完成整改，重点处理：${item.risk_drive_factors?.join('、') || '综合风险'}`
      }))
  )
}