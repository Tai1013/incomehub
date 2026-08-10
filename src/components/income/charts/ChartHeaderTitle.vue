<template>
  <span class="chart-title">
    <el-icon
      v-if="editing"
      class="chart-title-star-btn"
      role="button"
      tabindex="0"
      :aria-label="isDraftFavorite(chartKey) ? `取消 ${title} 收藏` : `收藏 ${title}`"
      :aria-pressed="isDraftFavorite(chartKey)"
      @click="toggleDraftFavorite(chartKey)"
      @keydown.enter="toggleDraftFavorite(chartKey)"
      @keydown.space.prevent="toggleDraftFavorite(chartKey)"
    >
      <StarFilled v-if="isDraftFavorite(chartKey)" />
      <Star v-else />
    </el-icon>
    <span>{{ title }}</span>
  </span>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Star, StarFilled } from '@element-plus/icons-vue'
import type { FavoriteChartKey } from '../../../types/chart'
import { useChartFavoritesStore } from '../../../stores/chartFavorites'

defineProps<{
  chartKey: FavoriteChartKey
  title: string
}>()

const chartFavoritesStore = useChartFavoritesStore()
const { editing } = storeToRefs(chartFavoritesStore)
const { isDraftFavorite, toggleDraftFavorite } = chartFavoritesStore
</script>

<style scoped lang="scss">
.chart-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chart-title-star-btn {
  color: #f59e0b;
  font-size: 16px;
  line-height: 1;
  width: 1em;
  height: 1em;
  cursor: pointer;
  outline: none;
}

.chart-title-star-btn:hover {
  color: #d97706;
}

.chart-title-star-btn:active {
  color: #b45309;
}

.chart-title-star-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35);
  border-radius: 4px;
}
</style>
