import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { listFavoriteCharts, setFavoriteCharts } from '../services/incomeApi'
import { useLoading } from '../composables/useLoading'
import type { FavoriteChartKey } from '../types/chart'

export const useChartFavoritesStore = defineStore('chart-favorites', () => {
  const { load, unLoad } = useLoading()
  const favoriteKeys = ref<FavoriteChartKey[]>([])
  const draftFavoriteKeys = ref<FavoriteChartKey[]>([])
  const editing = ref(false)
  const initialized = ref(false)
  const loading = ref(false)
  const errorMessage = ref('')

  const favoriteKeySet = computed(() => new Set(favoriteKeys.value))
  const draftFavoriteKeySet = computed(() => new Set(draftFavoriteKeys.value))

  const fetchFavorites = async () => {
    loading.value = true
    load()
    errorMessage.value = ''

    try {
      favoriteKeys.value = await listFavoriteCharts()
      initialized.value = true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '讀取收藏圖表失敗'
      throw error
    } finally {
      loading.value = false
      unLoad()
    }
  }

  const hydrateFavorites = (keys: FavoriteChartKey[]) => {
    favoriteKeys.value = [...keys]
    draftFavoriteKeys.value = [...keys]
    initialized.value = true
    errorMessage.value = ''
  }

  const enterEditMode = () => {
    draftFavoriteKeys.value = [...favoriteKeys.value]
    editing.value = true
  }

  const cancelEditMode = () => {
    draftFavoriteKeys.value = [...favoriteKeys.value]
    editing.value = false
  }

  const isDraftFavorite = (chartKey: FavoriteChartKey) => draftFavoriteKeySet.value.has(chartKey)

  const toggleDraftFavorite = (chartKey: FavoriteChartKey) => {
    if (draftFavoriteKeySet.value.has(chartKey)) {
      draftFavoriteKeys.value = draftFavoriteKeys.value.filter((item) => item !== chartKey)
      return
    }

    draftFavoriteKeys.value = [chartKey, ...draftFavoriteKeys.value.filter((item) => item !== chartKey)]
  }

  const resetFavorites = () => {
    favoriteKeys.value = []
    draftFavoriteKeys.value = []
    editing.value = false
    initialized.value = false
    errorMessage.value = ''
  }

  const saveFavorites = async (keys: FavoriteChartKey[]) => {
    load()
    loading.value = true
    try {
      await setFavoriteCharts(keys)
      favoriteKeys.value = [...keys]
      draftFavoriteKeys.value = [...keys]
      editing.value = false
      initialized.value = true
      errorMessage.value = ''
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '儲存收藏圖表失敗'
      throw error
    } finally {
      loading.value = false
      unLoad()
    }
  }

  const saveDraftFavorites = async () => {
    await saveFavorites(draftFavoriteKeys.value)
  }

  return {
    favoriteKeys,
    draftFavoriteKeys,
    favoriteKeySet,
    draftFavoriteKeySet,
    editing,
    initialized,
    loading,
    errorMessage,
    fetchFavorites,
    hydrateFavorites,
    enterEditMode,
    cancelEditMode,
    isDraftFavorite,
    toggleDraftFavorite,
    resetFavorites,
    saveFavorites,
    saveDraftFavorites,
  }
})
