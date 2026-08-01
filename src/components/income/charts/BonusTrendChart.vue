<template>
  <el-card shadow="never">
    <template #header>
      <el-space wrap>
        <el-select
          v-model="selectedType"
          size="small"
          style="width: 120px;"
          :teleported="true"
          popper-class="bonus-type-popper"
        >
          <template #prefix>
            <el-icon v-if="selectedOption?.icon" style="vertical-align: middle;">
              <component :is="selectedOption.icon" />
            </el-icon>
          </template>
          <el-option v-for="o in INCOME_TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value">
            <el-icon v-if="o.icon" style="margin-right: 4px; vertical-align: middle;"><component :is="o.icon" /></el-icon>
            <span>{{ o.label }}</span>
          </el-option>
        </el-select>
        <el-tag type="info" size="small">{{ yearRange }}</el-tag>
        <el-tag size="small">今年累計 {{ thisYearTotal }}</el-tag>
      </el-space>
    </template>
    <div v-if="hasData">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else :description="`近兩年尚無「${selectedType}」資料`" :image-size="80" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import { type IncomeType } from '../../../types/income'
import { INCOME_TYPE_OPTIONS } from '../../../configs/constant'
import { useChartFormat } from '../../../composables/useChartFormat'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler)

const store = useIncomeStore()
const { formatShort } = useChartFormat()

const selectedType = ref<IncomeType>('月獎金')
const selectedOption = computed(() => INCOME_TYPE_OPTIONS.find(o => o.value === selectedType.value))

const thisYear = dayjs().format('YYYY')
const lastYear = dayjs().subtract(1, 'year').format('YYYY')
const yearRange = `${lastYear} – ${thisYear}`

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

const amountForMonth = (year: string, monthIdx: number): number => {
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
  return store.dailyLists
    .filter(d => d.date.startsWith(monthStr))
    .flatMap(d => d.items)
    .filter(e => e.type === selectedType.value)
    .reduce((s, e) => s + e.amount, 0)
}

const thisYearData = computed(() => MONTH_LABELS.map((_, i) => amountForMonth(thisYear, i)))
const lastYearData = computed(() => MONTH_LABELS.map((_, i) => amountForMonth(lastYear, i)))

const hasData = computed(() =>
  thisYearData.value.some(v => v > 0) || lastYearData.value.some(v => v > 0)
)

const thisYearTotal = computed(() => {
  const total = thisYearData.value.reduce((s, v) => s + v, 0)
  return `$${total.toLocaleString()}`
})

const suggestedMax = computed(() => {
  const allValues = [...thisYearData.value, ...lastYearData.value].filter(v => v > 0)
  if (allValues.length === 0) return 10000
  return Math.ceil(Math.max(...allValues) * 1.2 / 1000) * 1000
})

const chartData = computed(() => ({
  labels: MONTH_LABELS,
  datasets: [
    {
      label: `${thisYear}年`,
      data: thisYearData.value,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.1)',
      borderWidth: 2.5,
      pointBackgroundColor: thisYearData.value.map(v => v > 0 ? '#f59e0b' : 'transparent'),
      pointRadius: thisYearData.value.map(v => v > 0 ? 4 : 0),
      tension: 0.3,
      fill: false,
    },
    {
      label: `${lastYear}年`,
      data: lastYearData.value,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      borderWidth: 2.5,
      borderDash: [5, 4],
      pointBackgroundColor: lastYearData.value.map(v => v > 0 ? '#3b82f6' : 'transparent'),
      pointRadius: lastYearData.value.map(v => v > 0 ? 4 : 0),
      tension: 0.3,
      fill: false,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  spanGaps: false,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) =>
          ctx.parsed.y > 0
            ? ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`
            : ` ${ctx.dataset.label}: 無`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      suggestedMax: suggestedMax.value,
      ticks: { callback: (val: any) => formatShort(Number(val)) },
      grid: { color: 'rgba(0,0,0,0.06)' },
    },
  },
}))
</script>
