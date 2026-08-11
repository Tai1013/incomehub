<template>
  <el-empty v-if="dailyLists.length === 0" description="目前沒有收入紀錄" />

  <div v-else style="display: grid; gap: 10px; width: 100%;">
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
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <strong>{{ yearGroup.year }}年</strong>
          <el-tag round effect="light" size="small" type="info">{{ yearGroup.rowCount }} 筆</el-tag>
        </div>

        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <strong :style="{ color: getYearHeaderAmountColor(yearGroup) }">{{ formatCurrency(getYearHeaderAmount(yearGroup)) }}</strong>
          <el-icon aria-hidden="true">
            <component :is="isYearCollapsed(yearGroup.year) ? ArrowDown : ArrowUp" />
          </el-icon>
        </div>
      </header>

      <div v-if="!isYearCollapsed(yearGroup.year)" style="display: grid; gap: 8px; margin-top: 8px; width: 100%;">
        <section
          v-for="monthGroup in yearGroup.months"
          :key="`${yearGroup.year}-${monthGroup.month}`"
          style="width: 100%; padding: 8px 2px 2px;"
        >
          <header style="display: flex; align-items: center; justify-content: space-between; min-height: 24px; margin-bottom: 8px;">
            <el-tag type="info" effect="light" round class="date-chip">{{ monthGroup.monthLabel }}</el-tag>
            <strong :style="{ color: getProgressColor(monthGroup.total, monthlyTargetValue) }">{{ formatCurrency(monthGroup.total) }}</strong>
          </header>

          <div style="display: grid; gap: 8px; width: 100%;">
            <el-card
              v-for="day in monthGroup.days"
              :key="day.date"
              shadow="never"
              class="daily-recessed-card"
              style="width: 100%; border-radius: 12px;"
              :body-style="{ padding: '8px 10px' }"
            >
              <header style="display: flex; align-items: center; justify-content: space-between; min-height: 24px;">
                <el-tag type="info" effect="light" round class="date-chip">{{ day.shortDate }}</el-tag>
                <!-- <strong>{{ formatCurrency(day.total) }}</strong> -->
              </header>

              <div style="margin-top: 8px; width: 100%;">
                <template v-for="item in day.items" :key="item.id">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 34px; width: 100%;">
                    <div style="display: grid; gap: 6px; min-width: 0; flex: 1;">
                      <el-tag size="small" type="success" effect="light" style="width: fit-content;">{{ item.type }}</el-tag>
                    </div>
                    <div style="display: inline-flex; align-items: center; gap: 10px;">
                      <strong>{{ formatCurrency(item.amount) }}</strong>
                      <div v-if="editMode">
                        <el-button
                          circle
                          plain
                          type="info"
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
                      </div>
                    </div>
                  </div>
                  <span
                    v-if="item.description"
                    style="display: block; font-size: 12px; line-height: 1.45; color: var(--el-text-color-secondary); word-break: break-word; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 4px 8px; margin-top: 4px;"
                  >
                    {{ item.description }}
                  </span>
                </template>
              </div>
            </el-card>
          </div>
        </section>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowUp, Delete, EditPen } from '@element-plus/icons-vue'
import { openConfirm } from '../../services/messageBox'
import { useIncomeEntries } from '../../composables/useIncomeEntries'
import { useAuthStore } from '../../stores/auth'
import { useIncomeStore } from '../../stores/income'
import type { IncomeEntry } from '../../types/income'

defineProps<{
  editMode?: boolean
}>()

const { dailyLists, removeEntry } = useIncomeEntries()
const authStore = useAuthStore()
const incomeStore = useIncomeStore()
const expandedYears = ref<Record<string, boolean>>({})
const currentYear = dayjs().format('YYYY')
const currentMonth = dayjs().format('MM')

const yearlyTargetValue = computed(() =>
  authStore.yearlyTarget && authStore.yearlyTarget > 0 ? authStore.yearlyTarget : null
)

const monthlyTargetValue = computed(() =>
  authStore.monthlyTarget && authStore.monthlyTarget > 0 ? authStore.monthlyTarget : null
)

type YearDayGroup = {
  date: string
  month: string
  shortDate: string
  total: number
  items: IncomeEntry[]
}

type MonthGroup = {
  month: string
  monthLabel: string
  total: number
  rowCount: number
  days: YearDayGroup[]
}

const yearGroups = computed(() => {
  const grouped = new Map<
    string,
    {
      year: string
      total: number
      monthTotal: number
      rowCount: number
        days: YearDayGroup[]
    }
  >()

  for (const dayGroup of dailyLists.value) {
    const year = dayjs(dayGroup.date).format('YYYY')
    const month = dayjs(dayGroup.date).format('MM')
    const dayTotal = dayGroup.items.reduce((sum, item) => sum + item.amount, 0)
    const monthContribution = month === currentMonth ? dayTotal : 0

    const existing = grouped.get(year)
    if (!existing) {
      grouped.set(year, {
        year,
        total: dayTotal,
        monthTotal: monthContribution,
        rowCount: dayGroup.items.length,
        days: [
          {
            date: dayGroup.date,
            month,
            shortDate: dayjs(dayGroup.date).format('MM-DD'),
            total: dayTotal,
            items: dayGroup.items,
          },
        ],
      })
      continue
    }

    existing.total += dayTotal
    existing.monthTotal += monthContribution
    existing.rowCount += dayGroup.items.length
    existing.days.push({
      date: dayGroup.date,
      month,
      shortDate: dayjs(dayGroup.date).format('MM-DD'),
      total: dayTotal,
      items: dayGroup.items,
    })
  }

  return Array.from(grouped.values())
    .map((yearGroup) => {
      const monthsMap = new Map<string, MonthGroup>()

      for (const day of yearGroup.days) {
        const existingMonth = monthsMap.get(day.month)
        if (!existingMonth) {
          monthsMap.set(day.month, {
            month: day.month,
            monthLabel: `${day.month}月`,
            total: day.total,
            rowCount: day.items.length,
            days: [day],
          })
          continue
        }

        existingMonth.total += day.total
        existingMonth.rowCount += day.items.length
        existingMonth.days.push(day)
      }

      const months = Array.from(monthsMap.values())
        .sort((a, b) => b.month.localeCompare(a.month))
        .map((monthGroup) => ({
          ...monthGroup,
          days: monthGroup.days.sort((a, b) => b.date.localeCompare(a.date)),
        }))

      return {
        year: yearGroup.year,
        total: yearGroup.total,
        monthTotal: yearGroup.monthTotal,
        rowCount: yearGroup.rowCount,
        months,
      }
    })
    .sort((a, b) => b.year.localeCompare(a.year))
})

const deleteItem = async (date: string, id: string) => {
  try {
    await openConfirm('確定要刪除這筆收入嗎？', '刪除確認', {
      confirmButtonText: '刪除',
    })
  } catch {
    return
  }

  try {
    const removed = await removeEntry(date, id)

    if (!removed) {
      ElMessage.warning('找不到要刪除的收入資料')
      return
    }

    ElMessage.success('已刪除該筆收入')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '刪除失敗，請稍後再試')
  }
}

const editItem = (entry: IncomeEntry) => {
  incomeStore.openEditDialog(entry)
}

const toggleYear = (year: string) => {
  expandedYears.value[year] = !expandedYears.value[year]
}

const isYearCollapsed = (year: string) => !expandedYears.value[year]

const getProgressColor = (total: number, target: number | null) => {
  if (!target) {
    return 'var(--el-text-color-primary)'
  }

  const progress = total / target
  if (progress >= 1) {
    return 'var(--el-color-success)'
  }

  if (progress >= 0.8) {
    return 'var(--el-color-warning)'
  }

  return 'var(--el-text-color-primary)'
}

const getYearHeaderAmount = (yearGroup: { year: string; total: number; monthTotal: number }) => {
  if (yearlyTargetValue.value) {
    return yearGroup.total
  }

  if (monthlyTargetValue.value && yearGroup.year === currentYear) {
    return yearGroup.monthTotal
  }

  return yearGroup.total
}

const getYearHeaderAmountColor = (yearGroup: { year: string; total: number; monthTotal: number }) => {
  if (yearlyTargetValue.value) {
    return getProgressColor(yearGroup.total, yearlyTargetValue.value)
  }

  if (monthlyTargetValue.value && yearGroup.year === currentYear) {
    return getProgressColor(yearGroup.monthTotal, monthlyTargetValue.value)
  }

  return getProgressColor(yearGroup.total, null)
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(value)
</script>

<style scoped lang="scss">
:deep(.daily-recessed-card.el-card) {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.44) 0%, rgba(255, 255, 255, 0.28) 100%);
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 2px 8px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.66);
  backdrop-filter: blur(10px) saturate(150%);
  -webkit-backdrop-filter: blur(10px) saturate(150%);
}

:deep(.date-chip.el-tag) {
  min-width: 56px;
  justify-content: center;
  border-color: rgba(255, 255, 255, 0.72);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.32) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.64), 0 1px 2px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(8px) saturate(150%);
  -webkit-backdrop-filter: blur(8px) saturate(150%);
}
</style>
