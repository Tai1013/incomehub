<template>
  <el-card shadow="never">
    <template #header>
      <el-space>
        <span>當年每月收入</span>
        <el-tag type="info" size="small">{{ currentYearLabel }}</el-tag>
        <el-tag size="small">總計 {{ totalFormatted }}</el-tag>
      </el-space>
    </template>
    <div v-if="hasData">
      <Chart type="bar" :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="今年尚無收入資料" :image-size="80" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { Chart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import { incomeTypes } from '../../../types/income'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const store = useIncomeStore()

const currentYear = dayjs().format('YYYY')
const currentYearLabel = `${currentYear}年`

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

const yearEntries = computed(() =>
  store.dailyLists
    .filter(d => d.date.startsWith(currentYear))
    .flatMap(d => d.items)
)

const hasData = computed(() => yearEntries.value.length > 0)

const totalFormatted = computed(() => {
  const total = yearEntries.value.reduce((s, e) => s + e.amount, 0)
  return `$${total.toLocaleString()}`
})

const chartData = computed(() => {
  // Bar datasets per income type (stacked)
  const barDatasets = incomeTypes.map((type, idx) => {
    const monthlyTotals = MONTH_LABELS.map((_, monthIdx) => {
      const monthStr = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}`
      return yearEntries.value
        .filter(e => e.type === type && e.date.startsWith(monthStr))
        .reduce((s, e) => s + e.amount, 0)
    })
    return {
      type: 'bar' as const,
      label: type,
      data: monthlyTotals,
      backgroundColor: COLORS[idx % COLORS.length] + 'bb',
      borderColor: COLORS[idx % COLORS.length],
      borderWidth: 1,
      borderRadius: 3,
      stack: 'income',
    }
  }).filter(ds => ds.data.some(v => v > 0))

  return {
    labels: MONTH_LABELS,
    datasets: barDatasets,
  }
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
    x: { stacked: true },
    y: {
      stacked: true,
      ticks: {
        callback: (val: any) => {
          const n = Number(val)
          if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
          if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}K`
          return `${n}`
        },
      },
    },
  },
}
</script>
