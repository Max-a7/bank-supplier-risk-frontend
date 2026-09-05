// src/api/risk.js

/**
 * 获取供应商风险列表 (Dashboard 页面用)
 * @param {Object} params 查询参数
 */
export const getSupplierRiskList = async (params) => {
  // TODO: 等待后端梁雨珊交付接口，或等待赵文雅交付Mock数据
  // return axios.get('/api/suppliers', { params });
  
  console.log('【前端架空】请求获取供应商列表:', params);
  return Promise.resolve([]); // 返回空数组占位
};

/**
 * 获取供应商详情及Agent研判输出
 * @param {string} supplierId 供应商ID
 */
export const getSupplierDetail = async (supplierId) => {
  console.log('【前端架空】请求供应商详情:', supplierId);
  return Promise.resolve({});
};

/**
 * 获取Agent完整输出结构体（包含风险等级、证据链、处置建议等）
 * @param {string} supplierId 供应商ID
 */
export const getAgentRiskOutput = async (supplierId) => {
  return Promise.resolve({});
};

/**
 * 获取处置建议列表
 */
export const getDisposalList = async () => {
  return Promise.resolve([]);
};