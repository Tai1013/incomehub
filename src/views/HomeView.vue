<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { CHART_DEFINITIONS } from '../configs/charts'
import { useChartFavoritesStore } from '../stores/chartFavorites'

const authStore = useAuthStore()
const chartFavoritesStore = useChartFavoritesStore()
const { favoriteKeySet } = storeToRefs(chartFavoritesStore)

const userName = computed(() => {
  const email = authStore.user?.email
  if (!email) return '未登入'
  return email.split('@')[0]
})

const favoriteCharts = computed(() => CHART_DEFINITIONS.filter((chart) => favoriteKeySet.value.has(chart.key)))
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <section class="welcome-card">
      <p class="welcome-brand">incomehub</p>
      <h1 class="welcome-title">歡迎回來，{{ userName }}</h1>
    </section>

    <template v-if="favoriteCharts.length">
      <component
        v-for="chart in favoriteCharts"
        :key="chart.key"
        :is="chart.component"
      />
    </template>

    <el-empty v-else description="尚未加入最愛圖表" class="favorite-empty" />
  </div>
</template>

<style scoped lang="scss">
:deep(.el-card) {
  border-radius: 14px;
}

.welcome-card {
  background: rgba(255, 255, 255, 0.56);
  backdrop-filter: blur(18px) saturate(170%);
  -webkit-backdrop-filter: blur(18px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.58);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.62);
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
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-empty {
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 16px;
}
</style>
