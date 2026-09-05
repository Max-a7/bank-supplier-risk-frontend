// src/api/mockData.js
import { suppliers } from '@/mock/suppliers'
import { riskEvents } from '@/mock/riskEvents'
import { riskHistoryMap } from '@/mock/riskHistory'
import { agentTraceMap } from '@/mock/agentTrace'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockApi = {
  async getSuppliers() {
    await delay()
    return suppliers
  },
  async getSupplierById(id) {
    await delay()
    return suppliers.find((s) => s.id === id) || null
  },
  async getRiskHistory(supplierId) {
    await delay()
    return riskHistoryMap[supplierId] || []
  },
  async getEventsBySupplier(supplierId) {
    await delay()
    return riskEvents.filter((e) => e.supplierId === supplierId)
  },
  async getEventById(eventId) {
    await delay()
    return riskEvents.find((e) => e.id === eventId) || null
  },
  async getAllEvents() {
    await delay()
    return riskEvents
  },
  async getAgentTrace(traceId) {
    await delay()
    return agentTraceMap[traceId] || null
  }
}