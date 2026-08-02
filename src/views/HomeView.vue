<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import YearBarChart from '../components/income/charts/YearBarChart.vue'
import YearPieChart from '../components/income/charts/YearPieChart.vue'
import TypeTrendChart from '../components/income/charts/TypeTrendChart.vue'

const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => {
  const email = authStore.user?.email
  if (!email) return '未登入'
  return email.split('@')[0]
})

const goTo = (path: '/list' | '/data') => {
  router.push(path)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <section class="panel brand-panel">
      <p class="eyebrow">incomehub</p>
      <h1 style="margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">歡迎回來 {{ userName }}</h1>
    </section>
    <section class="panel">
      <h2>快速前往</h2>
      <el-space>
        <el-button type="primary" @click="goTo('/list')">收入列表</el-button>
        <el-button type="success" @click="goTo('/data')">數據分析</el-button>
      </el-space>
    </section>

    <YearBarChart />
    <TypeTrendChart />
    <YearPieChart />
  </div>
</template>

<style scoped lang="scss">
:deep(.el-card) {
  border-radius: 14px;
}
</style>
