<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, HomeFilled, List, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import AddIncomeDialog from '../components/income/AddIncomeDialog.vue'
import { useIncomeStore } from '../stores/income'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const incomeStore = useIncomeStore()
const authStore = useAuthStore()
const drawerVisible = ref(false)
const userEmail = computed(() => authStore.user?.email ?? '未登入')

watch(
  () => authStore.user?.id,
  async (userId) => {
    if (!userId) {
      incomeStore.resetEntries()
      return
    }

    if (incomeStore.initialized) {
      return
    }

    try {
      await incomeStore.fetchEntries()
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '讀取收入資料失敗')
    }
  },
  { immediate: true },
)

const openAddIncomeDialog = () => {
  incomeStore.openAddDialog()
}

const openDrawer = () => {
  drawerVisible.value = true
}

const handleLogout = async () => {
  try {
    await authStore.signOut()
    drawerVisible.value = false
    ElMessage.success('已登出')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登出失敗，請稍後再試')
  }
}

const handleMenuSelect = (index: string) => {
  drawerVisible.value = false
  if (index !== route.path) {
    router.push(index)
  }
}
</script>

<template>
  <main class="page-root">
    <section class="app-phone-shell">
      <AppHeader @add-income="openAddIncomeDialog" @open-menu="openDrawer" />

      <section class="main-content">
        <RouterView />
      </section>
    </section>

    <el-drawer v-model="drawerVisible" direction="ltr" size="280px" :with-header="false">
      <section class="drawer-content">
        <h5 class="drawer-title">IncomeHub 導覽</h5>

        <section class="drawer-user-block">
          <p class="drawer-user-value">{{ userEmail }}</p>
        </section>

        <el-menu :default-active="route.path" @select="handleMenuSelect">
          <el-menu-item index="/home">
            <el-icon><HomeFilled /></el-icon>
            <span>首頁</span>
          </el-menu-item>
          <el-menu-item index="/list">
            <el-icon><List /></el-icon>
            <span>列表頁</span>
          </el-menu-item>
          <el-menu-item index="/data">
            <el-icon><DataAnalysis /></el-icon>
            <span>數據頁</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>個人設定</span>
          </el-menu-item>
          <el-divider class="drawer-menu-divider" />
          <el-menu-item index="/logout" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>登出</span>
          </el-menu-item>
        </el-menu>
      </section>
    </el-drawer>

    <AddIncomeDialog />
  </main>
</template>

<style scoped lang="scss">
.page-root {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 0;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.app-phone-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 430px;
  height: 100dvh;
  background: var(--el-bg-color);
  font-family: var(--el-font-family);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.main-content {
  flex: 1;
  padding: 10px 10px 18px;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.drawer-content {
  width: 100%;
}

.drawer-title {
  margin: 0 0 8px;
  padding: 16px 20px 0;
  font-size: 1rem;
  font-weight: 600;
}

.drawer-user-block {
  margin: 0 20px 16px;
  padding: 14px 14px 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff7ed 0%, #fffbf5 100%);
  border: 1px solid var(--el-border-color);
}

.drawer-user-value {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 600;
  color: #9a3412;
  word-break: break-all;
}

.drawer-menu-divider {
  margin: 6px 0;
}

:deep(.el-menu-item-group__title) {
  padding-top: 0;
}

:deep(.el-menu) {
  border-right: 0;
}

:deep(.el-drawer__body) {
  padding: 0;
}
</style>
