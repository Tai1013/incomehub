<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <span>收入日曆熱力圖</span>
        <div class="chart-header-tags">
          <el-tag type="info" size="small">{{ currentYear }}年</el-tag>
        </div>
      </div>
    </template>
    <div class="heatmap-scroll">
      <div class="heatmap">
        <div v-for="month in heatmapData" :key="month.label" class="hm-row">
          <span class="hm-month">{{ month.label }}</span>
          <div class="hm-days">
            <el-tooltip
              v-for="day in month.days"
              :key="day.date"
              :content="day.amount > 0 ? `${day.date}  $${day.amount.toLocaleString()}` : day.date"
              placement="top"
            >
              <span class="hm-cell" :style="{ background: day.color }" />
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
    <div class="hm-legend">
      <span class="hm-legend-label">少</span>
      <span
        v-for="(c, i) in legendColors"
        :key="i"
        class="hm-cell"
        :style="{ background: c }"
      />
      <span class="hm-legend-label">多</span>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useIncomeStore } from '../../../stores/income'

const store = useIncomeStore()
const currentYear = dayjs().format('YYYY')

const legendColors = [
  'rgba(245,158,11,0.15)',
  'rgba(245,158,11,0.35)',
  'rgba(245,158,11,0.55)',
  'rgba(245,158,11,0.75)',
  'rgba(245,158,11,1.00)',
]

const dailyMap = computed(() => {
  const map = new Map<string, number>()
  for (const d of store.dailyLists) {
    if (!d.date.startsWith(currentYear)) continue
    map.set(d.date, d.items.reduce((s, e) => s + e.amount, 0))
  }
  return map
})

const maxAmount = computed(() => {
  let max = 0
  for (const v of dailyMap.value.values()) { if (v > max) max = v }
  return max
})

const colorForAmount = (amount: number): string => {
  if (amount === 0 || maxAmount.value === 0) return '#e5e7eb'
  const ratio = Math.sqrt(amount / maxAmount.value)
  return `rgba(245,158,11,${(0.15 + ratio * 0.85).toFixed(2)})`
}

const heatmapData = computed(() =>
  Array.from({ length: 12 }, (_, monthIdx) => {
    const m = dayjs(`${currentYear}-${String(monthIdx + 1).padStart(2, '0')}-01`)
    return {
      label: `${monthIdx + 1}月`,
      days: Array.from({ length: m.daysInMonth() }, (_, dayIdx) => {
        const date = m.date(dayIdx + 1).format('YYYY-MM-DD')
        const amount = dailyMap.value.get(date) ?? 0
        return { date, amount, color: colorForAmount(amount) }
      }),
    }
  })
)
</script>

<style scoped lang="scss">
.heatmap-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.el-card__body) {
  overflow: hidden;
}
.heatmap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: max-content;
}
.hm-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.hm-month {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  width: 24px;
  flex-shrink: 0;
  text-align: right;
}
.hm-days {
  display: flex;
  gap: 2px;
  flex-wrap: nowrap;
}
.hm-cell {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
  cursor: default;
}
.hm-legend {
  display: flex;
  align-items: center;
  gap: 3px;
  justify-content: flex-end;
  margin-top: 8px;

  .hm-cell {
    flex: none;
    width: 10px;
  }
}
.hm-legend-label {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}
</style>
