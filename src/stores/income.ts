import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createIncomeEntry, deleteIncomeEntry, listIncomeEntries, updateIncomeEntry } from '../services/incomeApi'
import type { IncomeEntry, IncomeType } from '../types/income'
import { useLoading } from '../composables/useLoading'

export interface IncomeDayList {
  date: string
  items: IncomeEntry[]
}

export const useIncomeStore = defineStore('income', () => {
  const { load, unLoad } = useLoading()
  const dailyLists = ref<IncomeDayList[]>([])
  const dialogVisible = ref(false)
  const editingEntry = ref<IncomeEntry | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const errorMessage = ref('')

  const fetchEntries = async () => {
    loading.value = true
    load()
    errorMessage.value = ''

    try {
      const entries = await listIncomeEntries()
      dailyLists.value = groupEntriesByDate(entries)
      initialized.value = true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '讀取收入資料失敗'
      throw error
    } finally {
      loading.value = false
      unLoad()
    }
  }

  const resetEntries = () => {
    dailyLists.value = []
    initialized.value = false
    errorMessage.value = ''
  }

  function openAddDialog() {
    editingEntry.value = null
    dialogVisible.value = true
  }

  function openEditDialog(entry: IncomeEntry) {
    editingEntry.value = { ...entry }
    dialogVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
    editingEntry.value = null
  }

  const addEntry = async (payload: { date: string; type: IncomeType; amount: number; description?: string }) => {
    load()
    try {
      const newEntry = await createIncomeEntry(payload)
      dailyLists.value = groupEntriesByDate([newEntry, ...flattenDailyLists(dailyLists.value)])
      return newEntry
    } finally {
      unLoad()
    }
  }

  const removeEntry = async (date: string, id: string) => {
    const target = dailyLists.value.find((group) => group.date === date)
    if (!target || !target.items.some((item) => item.id === id)) {
      return false
    }

    load()
    try {
      await deleteIncomeEntry(id)

      const nextEntries = flattenDailyLists(dailyLists.value).filter((item) => item.id !== id)
      dailyLists.value = groupEntriesByDate(nextEntries)
      return true
    } finally {
      unLoad()
    }
  }

  const updateEntry = async (
    currentDate: string,
    id: string,
    payload: { date: string; type: IncomeType; amount: number; description?: string },
  ) => {
    const target = dailyLists.value.find((group) => group.date === currentDate)
    if (!target) {
      return false
    }

    const entryIndex = target.items.findIndex((item) => item.id === id)
    if (entryIndex === -1) {
      return false
    }

    load()
    try {
      const nextEntry = await updateIncomeEntry(id, payload)
      const nextEntries = flattenDailyLists(dailyLists.value).map((item) => (item.id === id ? nextEntry : item))
      dailyLists.value = groupEntriesByDate(nextEntries)
      return true
    } finally {
      unLoad()
    }
  }

  return {
    dailyLists,
    dialogVisible,
    editingEntry,
    loading,
    initialized,
    errorMessage,
    openAddDialog,
    openEditDialog,
    closeDialog,
    fetchEntries,
    resetEntries,
    addEntry,
    removeEntry,
    updateEntry,
  }
})

function flattenDailyLists(groups: IncomeDayList[]) {
  return groups.flatMap((group) => group.items)
}

function groupEntriesByDate(entries: IncomeEntry[]) {
  const grouped = new Map<string, IncomeEntry[]>()

  for (const entry of entries) {
    const bucket = grouped.get(entry.date) ?? []
    bucket.push(entry)
    grouped.set(entry.date, bucket)
  }

  return Array.from(grouped.entries())
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date))
}