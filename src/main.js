/// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { mockLogin } from '@/api/risk.js'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)

// ⭐ 先 Mock 登录，拿到 X-User-Id，再挂载应用
mockLogin('demo_leadership').then(() => {
  console.log('【Main】Mock 登录完成，X-User-Id =', localStorage.getItem('X-User-Id'))
  app.mount('#app')
})