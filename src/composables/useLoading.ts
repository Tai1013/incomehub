import { computed, ref } from 'vue'

const loadingCount = ref(0)

export const useLoading = () => {
  const load = () => {
    loadingCount.value += 1
  }

  const unLoad = () => {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  const isLoading = computed(() => loadingCount.value)

  return {
    isLoading,
    load,
    unLoad,
  }
}
