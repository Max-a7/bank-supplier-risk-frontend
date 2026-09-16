// src/api/risk.js
import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== undefined && res.code !== 0) {
      console.error(`[API Error] ${res.message}`)
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res.data
  },
  (error) => Promise.reject(error)
)

const normalizeId = (str) => String(str || '').replace(/[\u2010-\u2015\u2212]/g, '-')

/**
 * 获取供应商列表
 * 后端：GET /backend/suppliers
 * 返回后，对前 30 家调用 /agent/report/{id} 拿真实风险等级
 */
export const getSupplierRiskList = async (params = {}) => {
  console.log('【API】请求供应商列表...')
  try {
    const data = await request.get('/backend/suppliers', { params })
    const records = data?.records || []
    console.log(`【API】拿到 ${records.length} 家供应商`)

    // 前 30 家获取真实报告（避免 N+1 请求过慢）
    const previewList = records.slice(0, 30)

    const enriched = await Promise.all(
      previewList.map(async (item) => {
        try {
          const report = await getAgentRiskOutput(item.supplier_id)
          return {
            supplier_id: item.supplier_id,
            name: item.supplier_name || item.supplier_id,
            risk_level: report?.risk_grade?.grade_tier || 'GREEN',
            risk_score: report?.risk_grade?.score || 0,
            risk_trend: { trend_type: report?.risk_trend?.trend_type || 'STEADY' },
            risk_drive_factors: (report?.key_factors || []).map(f => f.dimension)
          }
        } catch (e) {
          return {
            supplier_id: item.supplier_id,
            name: item.supplier_name || item.supplier_id,
            risk_level: 'GREEN',
            risk_score: 0,
            risk_trend: { trend_type: 'STEADY' },
            risk_drive_factors: []
          }
        }
      })
    )

    return enriched.sort((a, b) => b.risk_score - a.risk_score)
  } catch (error) {
    console.error('【API】获取供应商列表失败:', error)
    return []
  }
}

/**
 * 获取单供应商报告
 * 后端：GET /agent/report/{supplier_id}
 */
export const getAgentRiskOutput = async (supplierId, params = {}) => {
  const id = normalizeId(supplierId)
  console.log('【API】请求报告:', id)
  try {
    const data = await request.get(`/agent/report/${id}`, {
      params: { window_unit: 'week', window_size: 12, audience: 'LEADERSHIP', ...params }
    })
    return data
  } catch (error) {
    console.error(`【API】${id} 失败:`, error)
    return {}
  }
}

/**
 * 处置建议列表
 */
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