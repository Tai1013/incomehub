<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <span>季度收入分析</span>
        <div class="chart-header-tags">
          <el-tag type="info" size="small">{{ currentYear }}年</el-tag>
          <el-tag size="small">年總計 {{ totalFormatted }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="今年尚無收入資料" :image-size="80" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import { incomeTypes } from '../../../types/income'
import { useChartFormat } from '../../../composables/useChartFormat'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const store = useIncomeStore()
const { formatShort } = useChartFormat()

const currentYear = dayjs().format('YYYY')
const QUARTER_LABELS = ['Q1（1-3月）', 'Q2（4-6月）', 'Q3（7-9月）', 'Q4（10-12月）']
const QUARTER_MONTHS = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']]
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

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
  const datasets = incomeTypes.map((type, idx) => {
    const data = QUARTER_MONTHS.map(months =>
      yearEntries.value
        .filter(e => e.type === type && months.some(m => e.date.startsWith(`${currentYear}-${m}`)))
        .reduce((s, e) => s + e.amount, 0)
    )
    return {
      label: type,
      data,
      backgroundColor: COLORS[idx % COLORS.length] + 'bb',
      borderColor: COLORS[idx % COLORS.length],
      borderWidth: 1,
      borderRadius: 4,
      stack: 'q',
    }
  }).filter(ds => ds.data.some(v => v > 0))

  return { labels: QUARTER_LABELS, datasets }
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
      beginAtZero: true,
      ticks: { callback: (val: any) => formatShort(Number(val)) },
    },
  },
}
</script>
