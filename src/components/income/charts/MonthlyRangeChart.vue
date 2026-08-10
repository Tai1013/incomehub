<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <span>月最高 / 日均 / 最低</span>
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openYearDialog">{{ selectedYear }}年（每日）</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="所選年份尚無收入資料" :image-size="80" />

    <el-dialog v-model="yearDialogVisible" title="選擇年份" width="280px" align-center :lock-scroll="true">
      <el-select v-model="draftYear" placeholder="年" style="width: 100%;">
        <el-option v-for="year in yearOptions" :key="year" :label="`${year}年`" :value="year" />
      </el-select>
      <template #footer>
        <el-row :gutter="10">
          <el-col :span="12">
            <el-button type="danger" plain style="width: 100%;" @click="resetDraftYear">重置</el-button>
          </el-col>
          <el-col :span="12">
            <el-button type="primary" style="width: 100%;" @click="applyYear">確定</el-button>
          </el-col>
        </el-row>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
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

const currentYear = dayjs().year()
const selectedYear = ref(String(currentYear))
const yearDialogVisible = ref(false)
const draftYear = ref(currentYear)

const yearOptions = computed(() => {
  const years = new Set<number>([currentYear])
  store.dailyLists.forEach((d) => years.add(dayjs(d.date).year()))
  return Array.from(years).sort((a, b) => b - a)
})

const openYearDialog = () => {
  draftYear.value = Number(selectedYear.value)
  yearDialogVisible.value = true
}

const resetDraftYear = () => {
  draftYear.value = currentYear
}

const applyYear = () => {
  if (draftYear.value == null) {
    ElMessage.warning('年份為必填')
    return
  }
  selectedYear.value = String(draftYear.value)
  yearDialogVisible.value = false
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

const hasData = computed(() =>
  store.dailyLists.some(d => d.date.startsWith(selectedYear.value))
)

const monthStats = computed(() =>
  MONTH_LABELS.map((_, monthIdx) => {
    const monthStr = `${selectedYear.value}-${String(monthIdx + 1).padStart(2, '0')}`
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
  aspectRatio: 1.45,
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
