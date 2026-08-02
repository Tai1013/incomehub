<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <span>月最高 / 日均 / 最低</span>
        <div class="chart-header-tags">
          <el-tag type="info" size="small">{{ currentYear }}年（每日）</el-tag>
        </div>
      </div>
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

const hasData = computed(() =>
  store.dailyLists.some(d => d.date.startsWith(currentYear))
)

const monthStats = computed(() =>
  MONTH_LABELS.map((_, monthIdx) => {
    const monthStr = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}`
    const dailyTotals = store.dailyLists
      .filter(d => d.date.startsWith(monthStr))
      .map(d => d.items.reduce((s, e) => s + e.amount, 0))
      .filter(v => v > 0)

    if (dailyTotals.length === 0) return { min: null, max: null, avg: null }
    const sum = dailyTotals.reduce((s, v) => s + v, 0)
    return {
      min: Math.min(...dailyTotals),
      max: Math.max(...dailyTotals),
      avg: Math.round(sum / dailyTotals.length),
    }
  })
)

const chartData = computed(() => ({
  labels: MONTH_LABELS,
  datasets: [
    {
      label: '最低',
      data: monthStats.value.map(s => s.min),
      borderColor: 'rgba(245,158,11,0.25)',
      borderWidth: 1,
      pointRadius: 0,
      tension: 0.3,
      fill: false,
    },
    {
      label: '最高',
      data: monthStats.value.map(s => s.max),
      borderColor: 'rgba(245,158,11,0.25)',
      borderWidth: 1,
      pointRadius: 0,
      tension: 0.3,
      fill: '-1',
      backgroundColor: 'rgba(245,158,11,0.1)',
    },
    {
      label: '日均',
      data: monthStats.value.map(s => s.avg),
      borderColor: '#f59e0b',
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointBackgroundColor: '#f59e0b',
      pointRadius: 4,
      tension: 0.3,
      fill: false,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  spanGaps: true,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) =>
          ctx.parsed.y != null ? ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}` : '',
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
