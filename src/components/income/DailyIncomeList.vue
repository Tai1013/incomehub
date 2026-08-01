<template>
  <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
    <el-tag round effect="light" size="small" type="info">記錄天數 {{ dailyLists.length }}</el-tag>
  </div>

  <el-empty v-if="dailyLists.length === 0" description="目前沒有收入紀錄" />

  <el-space v-else direction="vertical" :size="10" fill style="width: 100%;">
    <el-card
      v-for="yearGroup in yearGroups"
      :key="yearGroup.year"
      shadow="never"
      style="width: 100%; border-radius: 18px;"
      :body-style="{ padding: isYearCollapsed(yearGroup.year) ? '10px 12px' : '10px 12px 12px' }"
    >
      <header
        style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;"
        role="button"
        tabindex="0"
        :aria-expanded="!isYearCollapsed(yearGroup.year)"
        @click="toggleYear(yearGroup.year)"
        @keydown.enter.prevent="toggleYear(yearGroup.year)"
        @keydown.space.prevent="toggleYear(yearGroup.year)"
      >
        <el-space :size="8" alignment="center">
          <strong>{{ yearGroup.year }}年</strong>
          <el-tag round effect="light" size="small" type="info">{{ yearGroup.rowCount }} 筆</el-tag>
        </el-space>

        <el-space :size="8" alignment="center">
          <strong style="color: var(--el-color-primary-dark-2);">{{ formatCurrency(yearGroup.total) }}</strong>
          <el-icon aria-hidden="true">
            <component :is="isYearCollapsed(yearGroup.year) ? ArrowDown : ArrowUp" />
          </el-icon>
        </el-space>
      </header>

      <el-space v-if="!isYearCollapsed(yearGroup.year)" direction="vertical" :size="8" fill style="margin-top: 8px; width: 100%;">
        <el-card
          v-for="day in yearGroup.days"
          :key="day.date"
          shadow="never"
          style="width: 100%; border-radius: 14px;"
          :body-style="{ padding: '8px 10px' }"
        >
          <header style="display: flex; align-items: center; justify-content: space-between; min-height: 24px;">
            <el-tag type="info" effect="plain" round>{{ day.shortDate }}</el-tag>
            <strong>{{ formatCurrency(day.total) }}</strong>
          </header>

          <div style="margin-top: 8px; width: 100%;">
            <template v-for="(item, index) in day.items" :key="item.id">
              <div style="display: flex; align-items: center; justify-content: space-between; min-height: 34px; width: 100%;">
                <el-tag size="small" type="success" effect="light">{{ item.type }}</el-tag>
                <el-space :size="10" alignment="center">
                  <strong>{{ formatCurrency(item.amount) }}</strong>
                  <el-button
                    circle
                    plain
                    :icon="EditPen"
                    aria-label="編輯金額"
                    @click="editItem(item)"
                  />
                  <el-button
                    circle
                    plain
                    type="danger"
                    :icon="Delete"
                    aria-label="刪除細項"
                    @click="deleteItem(day.date, item.id)"
                  />
                </el-space>
              </div>
              <el-divider v-if="index < day.items.length - 1" style="margin: 6px 0; width: 100%;" />
            </template>
          </div>
        </el-card>
      </el-space>
    </el-card>
  </el-space>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowUp, Delete, EditPen } from '@element-plus/icons-vue'
import { useIncomeEntries } from '../../composables/useIncomeEntries'
import { useIncomeStore } from '../../stores/income'
import type { IncomeEntry } from '../../types/income'

const { dailyLists, removeEntry } = useIncomeEntries()
const incomeStore = useIncomeStore()
const collapsedYears = ref<Record<string, boolean>>({})

const yearGroups = computed(() => {
  const grouped = new Map<
    string,
    {
      year: string
      total: number
      rowCount: number
      days: Array<{ date: string; shortDate: string; total: number; items: IncomeEntry[] }>
    }
  >()

  for (const dayGroup of dailyLists.value) {
    const year = dayGroup.date.slice(0, 4)
    const dayTotal = dayGroup.items.reduce((sum, item) => sum + item.amount, 0)

    const existing = grouped.get(year)
    if (!existing) {
      grouped.set(year, {
        year,
        total: dayTotal,
        rowCount: dayGroup.items.length,
        days: [
          {
            date: dayGroup.date,
            shortDate: dayjs(dayGroup.date).format('MM-DD'),
            total: dayTotal,
            items: dayGroup.items,
          },
        ],
      })
      continue
    }

    existing.total += dayTotal
    existing.rowCount += dayGroup.items.length
    existing.days.push({
      date: dayGroup.date,
      shortDate: dayjs(dayGroup.date).format('MM-DD'),
      total: dayTotal,
      items: dayGroup.items,
    })
  }

  return Array.from(grouped.values()).sort((a, b) => b.year.localeCompare(a.year))
})

const deleteItem = (date: string, id: string) => {
  removeEntry(date, id)
  ElMessage.success('已刪除該筆收入')
}

const editItem = (entry: IncomeEntry) => {
  incomeStore.openEditDialog(entry)
}

const toggleYear = (year: string) => {
  collapsedYears.value[year] = !collapsedYears.value[year]
}

const isYearCollapsed = (year: string) => Boolean(collapsedYears.value[year])

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(value)
</script>
