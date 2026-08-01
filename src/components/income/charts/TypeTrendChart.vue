<template>
  <el-card shadow="never">
    <template #header>
      <el-space>
        <span>各分類月趨勢</span>
        <el-tag type="info" size="small">{{ currentYear }}年</el-tag>
      </el-space>
    </template>
    <div v-if="hasData">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="今年尚無收入資料" :image-size="80" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, Tooltip, Legend,
} from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import { incomeTypes } from '../../../types/income'
import { useChartFormat } from '../../../composables/useChartFormat'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

const store = useIncomeStore()
const { formatShort } = useChartFormat()

const currentYear = dayjs().format('YYYY')
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

const yearEntries = computed(() =>
  store.dailyLists
    .filter(d => d.date.startsWith(currentYear))
    .flatMap(d => d.items)
)

const hasData = computed(() => yearEntries.value.length > 0)

const chartData = computed(() => {
  const datasets = incomeTypes.map((type, idx) => {
    const data = MONTH_LABELS.map((_, monthIdx) => {
      const monthStr = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}`
      return yearEntries.value
        .filter(e => e.type === type && e.date.startsWith(monthStr))
        .reduce((s, e) => s + e.amount, 0)
    })
    return {
      label: type,
      data,
      borderColor: COLORS[idx % COLORS.length],
      backgroundColor: COLORS[idx % COLORS.length] + '33',
      borderWidth: 2,
      pointBackgroundColor: COLORS[idx % COLORS.length],
      pointRadius: 3,
      tension: 0.3,
      hidden: !data.some(v => v > 0),
    }
  })

  return { labels: MONTH_LABELS, datasets }
})

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (val: any) => formatShort(Number(val)) },
    },
  },
}
</script>
