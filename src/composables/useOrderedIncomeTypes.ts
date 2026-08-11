import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useIncomeStore } from '../stores/income'
import type { IncomeType } from '../types/income'

export const useOrderedIncomeTypes = () => {
  const incomeStore = useIncomeStore()
  const authStore = useAuthStore()
  const { incomeTypeConfigs } = storeToRefs(authStore)

  return computed<IncomeType[]>(() => {
    const currentTypes = Array.from(
      new Set(incomeStore.dailyLists.flatMap((day) => day.items.map((item) => item.type))),
    ) as IncomeType[]

    if (currentTypes.length === 0) {
      return []
    }

    const currentTypeSet = new Set(currentTypes)
    const managedTypes = incomeTypeConfigs.value.map((config) => config.label as IncomeType)

    const matchedManagedTypes = managedTypes.filter((type) => currentTypeSet.has(type))
    const managedTypeSet = new Set(matchedManagedTypes)
    const remainingTypes = currentTypes.filter((type) => !managedTypeSet.has(type))

    return [...matchedManagedTypes, ...remainingTypes]
  })
}
