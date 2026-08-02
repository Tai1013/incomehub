<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <span>當年分類佔比</span>
        <div class="chart-header-tags">
          <el-tag type="info" size="small">{{ currentYearLabel }}</el-tag>
          <el-tag size="small">總計 {{ totalFormatted }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData" style="max-width: 360px; margin: 0 auto;">
      <PolarArea :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="今年尚無收入資料" :image-size="80" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { PolarArea } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, RadialLinearScale, Tooltip, Legend } from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import { incomeTypes } from '../../../types/income'
import { useChartFormat } from '../../../composables/useChartFormat'

ChartJS.register(ArcElement, RadialLinearScale, Tooltip, Legend)

const store = useIncomeStore()
const { formatShort } = useChartFormat()

const currentYear = dayjs().format('YYYY')
const currentYearLabel = `${currentYear}年`

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
  const totals = incomeTypes.map(type =>
    yearEntries.value.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0)
  )
  const activeIndices = incomeTypes.map((_, i) => i).filter(i => totals[i] > 0)

  return {
    labels: activeIndices.map(i => incomeTypes[i]),
    datasets: [{
      data: activeIndices.map(i => totals[i]),
      backgroundColor: activeIndices.map(i => COLORS[i % COLORS.length] + 'cc'),
      borderColor: activeIndices.map(i => COLORS[i % COLORS.length]),
      borderWidth: 1,
    }],
  }
})

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const val = ctx.parsed.r
          const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
          return ` ${ctx.label}: $${val.toLocaleString()} (${pct}%)`
        },
      },
    },
  },
  scales: {
    r: {
      ticks: {
        callback: (val: any) => `$${formatShort(Number(val))}`,
        backdropColor: 'transparent',
      },
    },
  },
}
</script>
