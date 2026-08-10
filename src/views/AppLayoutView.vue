<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, HomeFilled, List, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import AppHeader from '../components/layout/AppHeader.vue'
import BottomNav from '../components/layout/BottomNav.vue'
import AddIncomeDialog from '../components/income/AddIncomeDialog.vue'
import { useIncomeStore } from '../stores/income'
import { useAuthStore } from '../stores/auth'
import { useChartFavoritesStore } from '../stores/chartFavorites'

const route = useRoute()
const router = useRouter()
const incomeStore = useIncomeStore()
const authStore = useAuthStore()
const chartFavoritesStore = useChartFavoritesStore()
const drawerVisible = ref(false)
const userName = computed(() => {
  const email = authStore.user?.email
  if (!email) return '未登入'
  return email.split('@')[0]
})

watch(
  [() => authStore.user?.id, () => authStore.roleStatus],
  async ([userId, roleStatus]) => {
    if (!userId) {
      incomeStore.resetEntries()
      chartFavoritesStore.resetFavorites()
      return
    }

    if (!chartFavoritesStore.initialized && roleStatus !== 'idle') {
      chartFavoritesStore.hydrateFavorites(authStore.favoriteChartKeys)
    }

    const tasks: Promise<unknown>[] = []

    if (!incomeStore.initialized) {
      tasks.push(incomeStore.fetchEntries())
    }

    if (tasks.length === 0) {
      return
    }

    try {
      await Promise.all(tasks)
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '讀取資料失敗')
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

      <BottomNav />
    </section>

    <el-drawer v-model="drawerVisible" direction="ltr" size="280px" :with-header="false">
      <section class="drawer-content">
        <h5 class="drawer-title">IncomeHub 導覽</h5>

        <section class="drawer-user-block">
          <p class="drawer-user-value">{{ userName }}</p>
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
  background: transparent;
}

.app-phone-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 430px;
  height: 100dvh;
  background:
    radial-gradient(circle at 84% 10%, rgba(147, 197, 253, 0.26) 0 16%, transparent 50%),
    radial-gradient(circle at 18% 86%, rgba(251, 191, 36, 0.18) 0 14%, transparent 45%),
    rgba(255, 255, 255, 0.42);
  border-left: 1px solid rgba(255, 255, 255, 0.5);
  border-right: 1px solid rgba(255, 255, 255, 0.5);
  font-family: var(--el-font-family);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.18);
}

.main-content {
  flex: 1;
  padding: 10px 10px 10px;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: rgba(255, 255, 255, 0.08);
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
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
}

.drawer-user-value {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 600;
  color: #7c2d12;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

@media (min-width: 768px) {
  .app-phone-shell {
    margin: 10px 0;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.62);
  }
}
</style>
