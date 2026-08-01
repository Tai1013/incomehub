import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { IncomeEntry, IncomeType } from '../types/income'

const STORAGE_KEY = 'income-hub-entries'

export interface IncomeDayList {
  date: string
  items: IncomeEntry[]
}

export const useIncomeStore = defineStore('income', () => {
  const dailyLists = ref<IncomeDayList[]>(loadDailyLists())
  const dialogVisible = ref(false)
  const editingEntry = ref<IncomeEntry | null>(null)

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

  function addEntry(payload: { date: string; type: IncomeType; amount: number }) {
    const newEntry: IncomeEntry = {
      id: crypto.randomUUID(),
      date: payload.date,
      type: payload.type,
      amount: payload.amount,
    }

    const target = dailyLists.value.find((group) => group.date === payload.date)

    if (target) {
      target.items.unshift(newEntry)
    } else {
      dailyLists.value.unshift({
        date: payload.date,
        items: [newEntry],
      })
      dailyLists.value.sort((a, b) => b.date.localeCompare(a.date))
    }

    persistDailyLists(dailyLists.value)
  }

  function removeEntry(date: string, id: string) {
    const target = dailyLists.value.find((group) => group.date === date)
    if (!target) {
      return
    }

    target.items = target.items.filter((item) => item.id !== id)

    if (target.items.length === 0) {
      dailyLists.value = dailyLists.value.filter((group) => group.date !== date)
    }

    persistDailyLists(dailyLists.value)
  }

  function updateEntry(
    currentDate: string,
    id: string,
    payload: { date: string; type: IncomeType; amount: number },
  ) {
    const target = dailyLists.value.find((group) => group.date === currentDate)
    if (!target) {
      return false
    }

    const entryIndex = target.items.findIndex((item) => item.id === id)
    if (entryIndex === -1) {
      return false
    }

    const currentEntry = target.items[entryIndex]
    const nextEntry: IncomeEntry = {
      ...currentEntry,
      date: payload.date,
      type: payload.type,
      amount: payload.amount,
    }

    target.items.splice(entryIndex, 1)

    if (target.items.length === 0) {
      dailyLists.value = dailyLists.value.filter((group) => group.date !== currentDate)
    }

    const nextTarget = dailyLists.value.find((group) => group.date === payload.date)
    if (nextTarget) {
      nextTarget.items.unshift(nextEntry)
    } else {
      dailyLists.value.unshift({
        date: payload.date,
        items: [nextEntry],
      })
    }

    dailyLists.value.sort((a, b) => b.date.localeCompare(a.date))
    persistDailyLists(dailyLists.value)
    return true
  }

  return {
    dailyLists,
    dialogVisible,
    editingEntry,
    openAddDialog,
    openEditDialog,
    closeDialog,
    addEntry,
    removeEntry,
    updateEntry,
  }
})

function loadDailyLists(): IncomeDayList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    // Backward compatibility: migrate old flat entry list to grouped day list.
    if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'id' in parsed[0]) {
      const oldEntries = parsed as IncomeEntry[]
      const grouped = new Map<string, IncomeEntry[]>()

      for (const entry of oldEntries) {
        const bucket = grouped.get(entry.date) ?? []
        bucket.push(entry)
        grouped.set(entry.date, bucket)
      }

      return Array.from(grouped.entries())
        .map(([date, items]) => ({ date, items }))
        .sort((a, b) => b.date.localeCompare(a.date))
    }

    return (parsed as IncomeDayList[]).sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    return []
  }
}

function persistDailyLists(next: IncomeDayList[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}