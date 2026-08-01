<template>
  <el-card shadow="never">
    <template #header>
      <span>歷年收入總覽</span>
    </template>
    <div v-if="hasData">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="尚無收入資料" :image-size="80" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import { useChartFormat } from '../../../composables/useChartFormat'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const store = useIncomeStore()
const { formatShort } = useChartFormat()

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6']

const yearTotals = computed(() => {
  const map = new Map<string, number>()
  for (const d of store.dailyLists) {
    const year = d.date.slice(0, 4)
    const total = d.items.reduce((s, e) => s + e.amount, 0)
    map.set(year, (map.get(year) ?? 0) + total)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
})

const hasData = computed(() => yearTotals.value.length > 0)

const chartData = computed(() => ({
  labels: yearTotals.value.map(([y]) => `${y}年`),
  datasets: [{
    label: '年度總收入',
    data: yearTotals.value.map(([, v]) => v),
    backgroundColor: yearTotals.value.map((_, i) => COLORS[i % COLORS.length] + 'bb'),
    borderColor: yearTotals.value.map((_, i) => COLORS[i % COLORS.length]),
    borderWidth: 1,
    borderRadius: 6,
  }],
}))

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` $${ctx.parsed.y.toLocaleString()}`,
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
