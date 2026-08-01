<template>
  <el-card shadow="never">
    <template #header>
      <el-space>
        <span>當年累積收入</span>
        <el-tag type="info" size="small">{{ currentYear }}年</el-tag>
        <el-tag size="small">年累計 {{ totalFormatted }}</el-tag>
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
  LineElement, PointElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import { useChartFormat } from '../../../composables/useChartFormat'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler)

const store = useIncomeStore()
const { formatShort } = useChartFormat()

const currentYear = dayjs().format('YYYY')
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
  let cumulative = 0
  const data = MONTH_LABELS.map((_, monthIdx) => {
    const monthStr = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}`
    cumulative += yearEntries.value
      .filter(e => e.date.startsWith(monthStr))
      .reduce((s, e) => s + e.amount, 0)
    return cumulative
  })

  return {
    labels: MONTH_LABELS,
    datasets: [{
      label: '累積收入',
      data,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderWidth: 2.5,
      pointBackgroundColor: '#f59e0b',
      pointRadius: 4,
      tension: 0.4,
      fill: true,
    }],
  }
})

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` 累積: $${ctx.parsed.y.toLocaleString()}`,
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
