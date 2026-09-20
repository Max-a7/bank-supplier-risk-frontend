// src/api/risk.js
import axios from 'axios'

// ================== Axios 实例 ==================
const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('X-User-Id')
    if (userId) {
      config.headers['X-User-Id'] = userId
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== undefined && res.code !== 0) {
      console.error(`[API Error] ${res.message} (trace: ${res.trace_id})`)
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res.data
  },
  (error) => Promise.reject(error)
)

// ⭐ ID 归一化：把特殊连字符 U+2011 等转成普通 -
const normalizeId = (str) => String(str || '').replace(/[\u2010-\u2015\u2212]/g, '-')

// ================== Mock 登录 ==================
export const mockLogin = async (username = 'demo_leadership') => {
  try {
    const res = await request.post('/backend/mock/login', { username })
    const xUserId = res?.request_headers?.['X-User-Id'] || res?.profile?.user?.user_id
    if (xUserId) {
      localStorage.setItem('X-User-Id', xUserId)
      console.log('【API】Mock 登录成功，X-User-Id =', xUserId)
    }
    return res
  } catch (e) {
    console.warn('【API】Mock 登录失败，使用默认 X-User-Id')
    localStorage.setItem('X-User-Id', 'demo-leadership')
    return null
  }
}

// ================== Dashboard Summary ==================
export const getDashboardSummary = async () => {
  try {
    const data = await request.get('/backend/dashboard/summary')
    console.log('【API】Dashboard Summary:', data)
    return data || {}
  } catch (error) {
    console.error('【API】Dashboard Summary 失败:', error)
    return {}
  }
}

// ================== 供应商列表 ==================
export const getSupplierRiskList = async (params = {}) => {
  console.log('【API】请求供应商列表...')
  try {
    const data = await request.get('/backend/suppliers', { params })
    const records = data?.records || data || []
    console.log(`【API】拿到 ${records.length} 家供应商`)

    return records
      .map(item => ({
        supplier_id: item.supplier_id,
        name: item.supplier_name || item.supplier_id,
        importance: item.importance,
        risk_level: item.current_risk_level || 'GREEN',
        risk_score: item.current_risk_score || item.risk_score || 0,
        risk_trend: { trend_type: item.trend_type || 'STEADY' },
        risk_drive_factors: item.key_factors || []
      }))
      .sort((a, b) => b.risk_score - a.risk_score)
  } catch (error) {
    console.error('【API】获取供应商列表失败:', error)
    return []
  }
}

// ================== 供应商报告列表 ==================
export const getSupplierReports = async (supplierId) => {
  const id = normalizeId(supplierId)
  try {
    const data = await request.get(`/backend/suppliers/${id}/reports`)
    return data?.records || data?.reports || data || []
  } catch (error) {
    console.warn(`【API】${id} 报告列表失败:`, error)
    return []
  }
}

// ================== 报告详情 ==================
export const getReportDetail = async (reportId) => {
  try {
    const data = await request.get(`/backend/reports/${reportId}`)
    return data?.report || data || {}
  } catch (error) {
    console.error(`【API】报告 ${reportId} 失败:`, error)
    return {}
  }
}

// ================== 可视化数据 ==================
export const getReportVisualization = async (reportId) => {
  try {
    const data = await request.get(`/backend/reports/${reportId}/visualization`)
    return data?.report || data || {}
  } catch (error) {
    console.error(`【API】报告 ${reportId} 可视化失败:`, error)
    return {}
  }
}

// ================== 单供应商完整报告（给详情页用） ==================
export const getAgentRiskOutput = async (supplierId, params = {}) => {
  const id = normalizeId(supplierId)
  console.log(`【API】开始获取 ${id} 的完整报告`)

  let reports = []
  try {
    const listData = await request.get(`/backend/suppliers/${id}/reports`)
    reports = listData?.records || listData?.reports || listData || []
    console.log(`【API】${id} 报告列表:`, reports)
  } catch (e) {
    console.warn(`【API】${id} 报告列表失败，降级到 /agent/report`)
    return await fallbackToAgentReport(id, params)
  }

  if (!reports || reports.length === 0) {
    console.warn(`【API】${id} 无报告，降级到 /agent/report`)
    return await fallbackToAgentReport(id, params)
  }

  const latest = reports[0]
  const reportId = latest.report_id

  let fullReport = {}
  if (reportId) {
    try {
      fullReport = await getReportDetail(reportId)
      console.log(`【API】${id} 完整报告:`, fullReport)
    } catch (e) {
      console.warn(`【API】${id} 完整报告失败`, e)
    }
  }

  const hasVisualization = fullReport?.dimension_breakdown && fullReport.dimension_breakdown.length > 0
  const hasEvidence = fullReport?.evidence_summary && fullReport.evidence_summary.length > 0

  let agentReport = fullReport
  if (!hasVisualization || !hasEvidence) {
    try {
      const fallback = await request.get(`/agent/report/${id}`, {
        params: { window_unit: 'week', window_size: 12, audience: 'LEADERSHIP', ...params }
      })
      agentReport = {
        ...fallback,
        ...fullReport,
        dimension_breakdown: fullReport?.dimension_breakdown?.length ? fullReport.dimension_breakdown : (fallback?.dimension_breakdown || []),
        evidence_summary: fullReport?.evidence_summary?.length ? fullReport.evidence_summary : (fallback?.evidence_summary || []),
        risk_trend: fullReport?.risk_trend || fallback?.risk_trend || { trend_type: 'STEADY', trend_desc: '' }
      }
    } catch (e) {
      console.warn(`【API】${id} /agent/report 兜底失败:`, e)
    }
  }

  if (!agentReport.risk_grade) {
    agentReport.risk_grade = {
      risk_level: latest.risk_level || 'GREEN',
      score: latest.risk_score || 0,
      grade_label: latest.risk_level === 'RED' ? '高风险' : latest.risk_level === 'YELLOW' ? '中风险' : '低风险'
    }
  }
  if (!agentReport.supplier_id) agentReport.supplier_id = id
  if (!agentReport.supplier_name) {
    agentReport.supplier_name = latest.supplier_name || fullReport?.supplier_name || id
  }

  console.log(`【API】${id} 最终报告:`, agentReport)
  return agentReport
}

// ================== /agent/report 兜底 ==================
async function fallbackToAgentReport(id, params = {}) {
  try {
    const data = await request.get(`/agent/report/${id}`, {
      params: { window_unit: 'week', window_size: 12, audience: 'LEADERSHIP', ...params }
    })
    return data || {}
  } catch (error) {
    console.error(`【API】${id} /agent/report 兜底失败:`, error)
    return {}
  }
}

// ================== ⭐ 处置建议列表 ==================
/**
 * 获取处置建议列表（只返回 RED 供应商）
 * 
 * ⭐ 关键修复：用 normalizeId 统一 ID（兼容特殊连字符 U+2011）
 */
export const getDisposalList = async () => {
  console.log('【API】请求处置列表...')

  // 1. 先拿 dashboard summary
  const summary = await getDashboardSummary()
  const byRisk = summary?.supplier_count_by_risk || {}
  const watchlist = summary?.watchlist || []

  if (!byRisk.RED || byRisk.RED === 0) {
    console.warn('【API】没有 RED 供应商，处置列表为空')
    return []
  }

  // 2. ⭐ 用 normalizeId 构建查询表
  const latestRiskMap = {}
  watchlist.forEach(item => {
    const key = normalizeId(item.supplier_id)
    latestRiskMap[key] = {
      risk_level: item.current_risk_level,
      risk_score: item.current_risk_score
    }
  })
  console.log('【API】最新风险映射:', latestRiskMap)

  // 3. 拿完整供应商列表
  let records = []
  try {
    const data = await request.get('/backend/suppliers')
    records = data?.records || data || []
  } catch (e) {
    console.error('【API】获取供应商列表失败:', e)
    return []
  }

  // 4. ⭐ 合并：用 normalizeId 查找最新风险值
  const enriched = records.map(item => {
    const key = normalizeId(item.supplier_id)
    const latest = latestRiskMap[key]
    return {
      supplier_id: item.supplier_id,
      supplier_name: item.supplier_name || item.supplier_id,
      importance: item.importance,
      current_risk_level: latest?.risk_level || item.current_risk_level || 'GREEN',
      current_risk_score: latest?.risk_score ?? item.current_risk_score ?? 0,
      key_factors: item.key_factors || []
    }
  })

  // 5. 筛选 RED
  const redList = enriched
    .filter(item => item.current_risk_level === 'RED')
    .sort((a, b) => b.current_risk_score - a.current_risk_score)

  console.log(`【API】找到 ${redList.length} 家 RED 供应商`)

  return redList.map((item, index) => ({
    id: `DISP${String(index + 1).padStart(3, '0')}`,
    supplier_id: item.supplier_id,
    supplier_name: item.supplier_name,
    risk_score: item.current_risk_score,
    suggest_content: `要求供应商限期完成整改，重点核查风险来源。`,
    status: '待处置',
    deadline: '2026-10-31',
    reviewer: '张经理'
  }))
}