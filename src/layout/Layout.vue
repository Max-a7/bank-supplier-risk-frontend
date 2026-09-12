<template>
  <el-container class="layout-container">
    <!-- 左侧菜单 -->
    <el-aside width="220px" class="layout-aside">
      <div class="logo">
        <span>银行供应商风险监测</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#001529"
        text-color="#c0c4cc"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon><span>风险驾驶舱</span>
        </el-menu-item>
        <el-menu-item index="/suppliers">
          <el-icon><OfficeBuilding /></el-icon><span>供应商风险列表</span>
        </el-menu-item>
        <el-menu-item index="/agent-trace">
          <el-icon><Connection /></el-icon><span>Agent研判</span>
        </el-menu-item>
        <el-menu-item index="/disposal">
          <el-icon><CircleCheck /></el-icon><span>风险处置中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧主体 -->
    <el-container>
      <el-header class="layout-header">
        <div class="header-title">{{ $route.meta.title || '银行供应商动态风险监测系统' }}</div>
        <div class="header-user">管理员</div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #001529;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 15px;
  background: #002140;
}

/* ========== 菜单项强制对齐核心样式 ========== */
:deep(.el-menu-item) {
  display: flex !important;
  align-items: center !important;
  height: 56px !important;
  padding-left: 20px !important; /* 统一左侧内边距，让所有图标起点对齐 */
}

/* 图标固定宽度、不压缩、水平居中 */
:deep(.el-menu-item .el-icon) {
  flex-shrink: 0 !important; /* 防止图标被挤压 */
  width: 24px !important;
  margin-right: 12px !important;
  text-align: center;
  font-size: 18px;
}

/* 文字自适应内容，不加 flex:1，避免被空白字符放大 */
:deep(.el-menu-item span) {
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* ========================================= */

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>