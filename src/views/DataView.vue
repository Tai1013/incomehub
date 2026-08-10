<template>
  <div class="data-view-root">
    <div class="toolbar-wrap">
      <section class="favorite-toolbar" :class="{ 'is-sticky': editing }">
      <el-button v-if="!editing" type="primary" plain @click="chartFavoritesStore.enterEditMode()">設定我的最愛</el-button>
      <template v-else>
        <el-button type="primary" :loading="saving" @click="saveFavoriteSelection">加到首頁顯示</el-button>
        <el-button @click="chartFavoritesStore.cancelEditMode()">取消</el-button>
      </template>
      </section>
    </div>

    <section v-for="chart in CHART_DEFINITIONS" :id="chart.anchor" :key="chart.key" class="chart-anchor">
      <component :is="chart.component" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { CHART_DEFINITIONS } from '../configs/charts'
import { useChartFavoritesStore } from '../stores/chartFavorites'

const chartFavoritesStore = useChartFavoritesStore()
const { editing, loading } = storeToRefs(chartFavoritesStore)
const saving = computed(() => loading.value)

const saveFavoriteSelection = async () => {
  try {
    await chartFavoritesStore.saveDraftFavorites()
    ElMessage.success('已更新首頁顯示圖表')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '儲存我的最愛失敗')
  }
}
</script>

<style scoped lang="scss">
:deep(.el-card) {
  border-radius: 14px;
}

.data-view-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar-wrap {
  height: 32px; // 撐住 fixed 後的空缺
}

.favorite-toolbar {
  width: 100%;
  transition: background 0.25s, border-color 0.25s;

  &.is-sticky {
    position: fixed;
    top: var(--app-header-height);
    left: 50%;
    transform: translateX(-50%);
    padding: 10px;
    box-sizing: border-box;
    z-index: 10;
    background: rgba(255, 255, 255, 0.48);
    backdrop-filter: blur(var(--glass-blur)) saturate(170%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(170%);
  }
}

.chart-anchor {
  scroll-margin-top: calc(var(--app-header-height) + 12px);
}
</style>
