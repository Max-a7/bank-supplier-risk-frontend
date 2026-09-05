import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '风险驾驶舱' }
      },
      {
        path: 'suppliers',
        name: 'SupplierList',
        component: () => import('@/views/SupplierList.vue'),
        meta: { title: '供应商风险列表' }
      },
      {
        path: 'suppliers/:id',
        name: 'SupplierDetail',
        component: () => import('@/views/SupplierDetail.vue'),
        meta: { title: '供应商360°画像' }
      },
      {
        path: 'events/:id',
        name: 'EventDetail',
        component: () => import('@/views/EventDetail.vue'),
        meta: { title: '风险事件详情' }
      },
      {
        path: 'agent-trace/:eventId?',
        name: 'AgentTrace',
        component: () => import('@/views/AgentTrace.vue'),
        meta: { title: 'Agent研判过程' }
      },
      {
        path: 'disposal',
        name: 'DisposalCenter',
        component: () => import('@/views/DisposalCenter.vue'),
        meta: { title: '风险处置中心' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router