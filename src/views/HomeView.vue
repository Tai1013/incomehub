<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import YearBarChart from '../components/income/charts/YearBarChart.vue'
import YearPieChart from '../components/income/charts/YearPieChart.vue'
import TypeTrendChart from '../components/income/charts/TypeTrendChart.vue'

const authStore = useAuthStore()

const userName = computed(() => {
  const email = authStore.user?.email
  if (!email) return '未登入'
  return email.split('@')[0]
})
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <section class="welcome-card">
      <p class="welcome-brand">incomehub</p>
      <h1 class="welcome-title">歡迎回來，{{ userName }}</h1>
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

.welcome-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 16px 18px;
}

.welcome-brand {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f59e0b;
}

.welcome-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #1c1917;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
