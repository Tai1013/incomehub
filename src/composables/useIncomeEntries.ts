import { storeToRefs } from 'pinia'
import { useIncomeStore } from '../stores/income'

export function useIncomeEntries() {
  const incomeStore = useIncomeStore()
  const { dailyLists } = storeToRefs(incomeStore)

  return {
    dailyLists,
    addEntry: incomeStore.addEntry,
    removeEntry: incomeStore.removeEntry,
    updateEntry: incomeStore.updateEntry,
  }
}
