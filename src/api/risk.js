// src/api/risk.js
import axios from 'axios'

// ================== Axios 实例 ==================
const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// ⭐ 请求拦截器：携带 X-User-Id
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

// 响应拦截器
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

// ================== ⭐ 新增：Dashboard Summary ==================
/**
 * 获取 Dashboard 概览数据
 * 后端接口：GET /backend/dashboard/summary
 * 返回：supplier_count_by_risk / pending_review_count / watchlist / monitor_task_count_by_status
 */
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
/**
 * 获取供应商列表（优化版：直接返回数据库里的字段，不再逐个请求报告）
 * 后端接口：GET /backend/suppliers
 */
export const getSupplierRiskList = async (params = {}) => {
  console.log('【API】请求供应商列表...')
  try {
    const data = await request.get('/backend/suppliers', { params })
    const records = data?.records || data || []
    console.log(`【API】拿到 ${records.length} 家供应商`)

    // ⭐ 简化：直接用数据库里的 current_risk_level 字段
    // 注意：数据库里的风险等级可能不是最新，后续需要后端做同步
    return records
      .map(item => ({
        supplier_id: item.supplier_id,
        name: item.supplier_name || item.supplier_id,
        importance: item.importance,
        risk_level: item.current_risk_level || 'GREEN',
        risk_score: item.risk_score || 0,
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
/**
 * 获取某家供应商的所有报告
 * 后端接口：GET /backend/suppliers/{id}/reports
 */
export const getSupplierReports = async (supplierId) => {
  const id = normalizeId(supplierId)
  try {
    const data = await request.get(`/backend/suppliers/${id}/reports`)
    return data?.records || data?.reports || data || []
  } catch (error) {
    console.warn(`【API】${id} 报告列表失败，尝试 /agent/report 兜底`)
    try {
      const report = await request.get(`/agent/report/${id}`, {
        params: { window_unit: 'week', window_size: 12, audience: 'LEADERSHIP' }
      })
      return report ? [report] : []
    } catch (e) {
      console.error(`【API】${id} 完全失败:`, e)
      return []
    }
  }
}

// ================== 报告详情 ==================
export const getReportDetail = async (reportId) => {
  try {
    const data = await request.get(`/backend/reports/${reportId}`)
    return data || {}
  } catch (error) {
    console.error(`【API】报告 ${reportId} 失败:`, error)
    return {}
  }
}

// ================== 可视化数据 ==================
export const getReportVisualization = async (reportId) => {
  try {
    const data = await request.get(`/backend/reports/${reportId}/visualization`)
    return data || {}
  } catch (error) {
    console.error(`【API】报告 ${reportId} 可视化失败:`, error)
    return {}
  }
}

// ================== 单供应商报告（给详情页用） ==================
/**
 * 获取单供应商的完整报告
 * 优先走新链路，兜底走算法接口
 */
export const getAgentRiskOutput = async (supplierId, params = {}) => {
  // 1. 先尝试走新链路：/backend/suppliers/{id}/reports
  try {
    const reports = await getSupplierReports(supplierId)
    if (reports && reports.length > 0) {
      const latestReport = reports[0]
      // 如果拿到的是精简报告，再调 /backend/reports/{id} 拿完整版
      if (latestReport.report_id && !latestReport.risk_grade) {
        const fullReport = await getReportDetail(latestReport.report_id)
        return fullReport
      }
      return latestReport
    }
  } catch (e) {
    console.warn('【API】新链路失败，降级到 /agent/report')
  }

  // 2. 兜底：走算法接口（用算法样例数据集，能拿到完整的 risk_grade）
  try {
    const data = await request.get(`/agent/report/${supplierId}`, {
      params: { window_unit: 'week', window_size: 12, audience: 'LEADERSHIP', ...params }
    })
    return data
  } catch (error) {
    console.error(`【API】${supplierId} 失败:`, error)
    return {}
  }
}

// ================== 处置建议列表 ==================
export const getDisposalList = async () => {
  const list = await getSupplierRiskList()
  return list
    .filter(item => item.risk_level === 'RED')
    .map((item, index) => ({
      id: `DISP${String(index + 1).padStart(3, '0')}`,
      supplier_id: item.supplier_id,
      supplier_name: item.name,
      risk_score: item.risk_score,
      suggest_content: `要求供应商限期完成整改，重点处理：${item.risk_drive_factors?.join('、') || '综合风险'}`
    }))
}