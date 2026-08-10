<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <span>每月收入</span>
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openRangeDialog">{{ rangeLabel }}</el-tag>
          <el-tag size="small">總計 {{ totalFormatted }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData">
      <Chart type="bar" :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="區間內尚無收入資料" :image-size="80" />

    <el-dialog v-model="rangeDialogVisible" title="設定年月區間" width="320px" align-center :lock-scroll="true">
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <el-row :gutter="10">
          <el-col :span="12">
            <el-select v-model="draftStartYear" placeholder="起始年" style="width: 100%;">
              <el-option v-for="year in yearOptions" :key="`start-${year}`" :label="`${year}年`" :value="year" />
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-select v-model="draftStartMonth" placeholder="起始月" style="width: 100%;">
              <el-option v-for="month in monthOptions" :key="`start-m-${month}`" :label="`${String(month).padStart(2, '0')}月`" :value="month" />
            </el-select>
          </el-col>
        </el-row>

        <el-row :gutter="10">
          <el-col :span="12">
            <el-select v-model="draftEndYear" placeholder="結束年" style="width: 100%;">
              <el-option v-for="year in yearOptions" :key="`end-${year}`" :label="`${year}年`" :value="year" />
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-select v-model="draftEndMonth" placeholder="結束月" style="width: 100%;">
              <el-option v-for="month in monthOptions" :key="`end-m-${month}`" :label="`${String(month).padStart(2, '0')}月`" :value="month" />
            </el-select>
          </el-col>
        </el-row>
      </div>

      <template #footer>
        <el-row :gutter="10">
          <el-col :span="12">
            <el-button type="danger" plain style="width: 100%;" @click="resetDraftRange">重置</el-button>
          </el-col>
          <el-col :span="12">
            <el-button type="primary" style="width: 100%;" @click="applyRange">確定</el-button>
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

const currentYear = dayjs().year()
const DEFAULT_START = `${currentYear}-01`
const DEFAULT_END = `${currentYear}-12`

const startMonth = ref(DEFAULT_START)
const endMonth = ref(DEFAULT_END)
const rangeDialogVisible = ref(false)

const draftStartYear = ref(currentYear)
const draftStartMonth = ref(1)
const draftEndYear = ref(currentYear)
const draftEndMonth = ref(12)

const yearOptions = computed(() => {
  const years = new Set<number>([currentYear])
  store.dailyLists.forEach((d) => years.add(dayjs(d.date).year()))
  return Array.from(years).sort((a, b) => b - a)
})

const monthOptions = Array.from({ length: 12 }, (_, idx) => idx + 1)

const rangeLabel = computed(() => {
  const start = dayjs(`${startMonth.value}-01`).format('YYYY/MM')
  const end = dayjs(`${endMonth.value}-01`).format('YYYY/MM')
  return `${start} - ${end}`
})

const openRangeDialog = () => {
  const start = dayjs(`${startMonth.value}-01`)
  const end = dayjs(`${endMonth.value}-01`)
  draftStartYear.value = start.year()
  draftStartMonth.value = start.month() + 1
  draftEndYear.value = end.year()
  draftEndMonth.value = end.month() + 1
  rangeDialogVisible.value = true
}

const resetDraftRange = () => {
  draftStartYear.value = currentYear
  draftStartMonth.value = 1
  draftEndYear.value = currentYear
  draftEndMonth.value = 12
}

const applyRange = () => {
  if (
    draftStartYear.value == null ||
    draftStartMonth.value == null ||
    draftEndYear.value == null ||
    draftEndMonth.value == null
  ) {
    ElMessage.warning('起訖年份與月份皆為必填')
    return
  }
  const rawStart = dayjs(`${draftStartYear.value}-${String(draftStartMonth.value).padStart(2, '0')}-01`)
  const rawEnd = dayjs(`${draftEndYear.value}-${String(draftEndMonth.value).padStart(2, '0')}-01`)
  const start = rawStart.isAfter(rawEnd) ? rawEnd : rawStart
  const end = rawStart.isAfter(rawEnd) ? rawStart : rawEnd
  startMonth.value = start.format('YYYY-MM')
  endMonth.value = end.format('YYYY-MM')
  rangeDialogVisible.value = false
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

const monthKeys = computed(() => {
  const start = dayjs(`${startMonth.value}-01`).startOf('month')
  const end = dayjs(`${endMonth.value}-01`).startOf('month')
  const length = end.diff(start, 'month') + 1
  return Array.from({ length }, (_, i) => start.add(i, 'month').format('YYYY-MM'))
})

const rangeEntries = computed(() =>
  store.dailyLists
    .filter(d => {
      const monthKey = dayjs(d.date).format('YYYY-MM')
      return monthKey >= startMonth.value && monthKey <= endMonth.value
    })
    .flatMap(d => d.items)
)

const hasData = computed(() => rangeEntries.value.length > 0)

const totalFormatted = computed(() => {
  const total = rangeEntries.value.reduce((s, e) => s + e.amount, 0)
  return `$${total.toLocaleString()}`
})

const chartData = computed(() => {
  // Bar datasets per income type (stacked)
  const barDatasets = incomeTypes.map((type, idx) => {
    const monthlyTotals = monthKeys.value.map(monthKey => {
      return rangeEntries.value
        .filter(e => e.type === type && dayjs(e.date).format('YYYY-MM') === monthKey)
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
    labels: monthKeys.value.map(monthKey => dayjs(`${monthKey}-01`).format('YY/MM')),
    datasets: barDatasets,
  }
})

const chartOptions = {
  responsive: true,
  aspectRatio: 1.45,
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
