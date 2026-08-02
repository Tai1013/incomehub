<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <span>近兩年每月總和</span>
        <div class="chart-header-tags">
          <el-tag type="info" size="small">{{ yearRange }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="近兩年尚無收入資料" :image-size="80" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { useIncomeStore } from '../../../stores/income'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler)

const store = useIncomeStore()

const thisYear = dayjs().format('YYYY')
const lastYear = dayjs().subtract(1, 'year').format('YYYY')
const yearRange = `${lastYear} – ${thisYear}`

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

const monthlyTotal = (year: string, monthIdx: number) => {
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
  return store.dailyLists
    .filter(d => d.date.startsWith(monthStr))
    .flatMap(d => d.items)
    .reduce((s, e) => s + e.amount, 0)
}

const thisYearData = computed(() => MONTH_LABELS.map((_, i) => monthlyTotal(thisYear, i)))
const lastYearData = computed(() => MONTH_LABELS.map((_, i) => monthlyTotal(lastYear, i)))

const hasData = computed(() =>
  thisYearData.value.some(v => v > 0) || lastYearData.value.some(v => v > 0)
)

const chartData = computed(() => ({
  labels: MONTH_LABELS,
  datasets: [
    {
      label: `${thisYear}年`,
      data: thisYearData.value,
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b22',
      borderWidth: 2.5,
      pointBackgroundColor: '#f59e0b',
      pointRadius: 4,
      tension: 0.3,
      fill: true,
    },
    {
      label: `${lastYear}年`,
      data: lastYearData.value,
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f622',
      borderWidth: 2.5,
      pointBackgroundColor: '#3b82f6',
      pointRadius: 4,
      tension: 0.3,
      fill: true,
    },
  ],
}))

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
