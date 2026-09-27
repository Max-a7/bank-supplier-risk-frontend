// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { mockLogin } from '@/api/risk.js'

const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)

// ⭐ 默认账号 demo_admin（展示全部 202 家）
// 答辩时可在 Console 执行 window.switchAccount('demo_manager') 切换权限
mockLogin('demo_admin').then(() => {
  console.log('【Main】Mock 登录完成，X-User-Id =', localStorage.getItem('X-User-Id'))
  app.mount('#app')
})

// ⭐ 全局切换账号函数（答辩演示用）
window.switchAccount = async (username) => {
  console.log(`【切换账号】${username}`)
  localStorage.clear()
  await mockLogin(username)
  location.reload()
}

// ⭐ 打印使用说明
console.log('%c【账号切换说明】', 'color: #409EFF; font-size: 14px; font-weight: bold;')
console.log('%c  切换为普通客户经理：window.switchAccount("demo_manager")', 'color: #909399;')
console.log('%c  切换为管理员：window.switchAccount("demo_admin")', 'color: #909399;')
console.log('%c  切换为高层：window.switchAccount("demo_leadership")', 'color: #909399;')