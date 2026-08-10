<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <span>年累積收入比較</span>
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openYearDialog">比較年 {{ selectedYear }}</el-tag>
          <el-tag type="primary" size="small">今年 {{ currentYear }}</el-tag>
          <el-tag :type="diffTagType" size="small">相差 {{ diffFormatted }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="今年與比較年尚無收入資料" :image-size="80" />

    <el-dialog v-model="yearDialogVisible" title="選擇比較年份" width="280px" align-center :lock-scroll="true">
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
const selectedYear = ref(String(currentYear - 1))
const yearDialogVisible = ref(false)
const draftYear = ref(currentYear - 1)

const yearOptions = computed(() => {
  const years = new Set<number>([currentYear, currentYear - 1])
  store.dailyLists.forEach((d) => years.add(dayjs(d.date).year()))
  return Array.from(years).sort((a, b) => b - a)
})

const openYearDialog = () => {
  draftYear.value = Number(selectedYear.value)
  yearDialogVisible.value = true
}

const resetDraftYear = () => {
  draftYear.value = currentYear - 1
}

const applyYear = () => {
  if (draftYear.value == null) {
    ElMessage.warning('年份為必填')
    return
  }
  if (draftYear.value === currentYear) {
    ElMessage.warning('比較年份不能與今年相同')
    return
  }
  selectedYear.value = String(draftYear.value)
  yearDialogVisible.value = false
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

const compareYearEntries = computed(() =>
  store.dailyLists
    .filter(d => d.date.startsWith(selectedYear.value))
    .flatMap(d => d.items)
)

const currentYearEntries = computed(() =>
  store.dailyLists
    .filter(d => d.date.startsWith(String(currentYear)))
    .flatMap(d => d.items)
)

const hasData = computed(() =>
  compareYearEntries.value.length > 0 || currentYearEntries.value.length > 0
)

const diffValue = computed(() => {
  const compareTotal = compareYearEntries.value.reduce((s, e) => s + e.amount, 0)
  const currentTotal = currentYearEntries.value.reduce((s, e) => s + e.amount, 0)
  return currentTotal - compareTotal
})

const diffTagType = computed(() => {
  if (diffValue.value < 0) return 'danger'
  if (diffValue.value > 0) return 'success'
  return 'info'
})

const diffFormatted = computed(() => {
  const sign = diffValue.value >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(diffValue.value).toLocaleString()}`
})

const chartData = computed(() => {
  let compareCumulative = 0
  const compareData = MONTH_LABELS.map((_, monthIdx) => {
    const monthStr = `${selectedYear.value}-${String(monthIdx + 1).padStart(2, '0')}`
    compareCumulative += compareYearEntries.value
      .filter(e => e.date.startsWith(monthStr))
      .reduce((s, e) => s + e.amount, 0)
    return compareCumulative
  })

  let currentCumulative = 0
  const currentData = MONTH_LABELS.map((_, monthIdx) => {
    const monthStr = `${currentYear}-${String(monthIdx + 1).padStart(2, '0')}`
    currentCumulative += currentYearEntries.value
      .filter(e => e.date.startsWith(monthStr))
      .reduce((s, e) => s + e.amount, 0)
    return currentCumulative
  })

  const currentPointColors = currentData.map((value, monthIdx) =>
    value >= compareData[monthIdx] ? '#F59E0B' : '#F56C6C'
  )

  return {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: `${selectedYear.value}年`,
        data: compareData,
        borderColor: '#909399',
        backgroundColor: 'rgba(144,147,153,0.12)',
        borderWidth: 2.5,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#909399',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: false,
      },
      {
        label: `${currentYear}年`,
        data: currentData,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245,158,11,0.12)',
        borderWidth: 2.5,
        pointBackgroundColor: currentPointColors,
        pointBorderColor: currentPointColors,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: false,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  aspectRatio: 1.45,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label} 累積: $${ctx.parsed.y.toLocaleString()}`,
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
