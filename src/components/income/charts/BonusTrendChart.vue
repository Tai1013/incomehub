<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <ChartHeaderTitle chart-key="bonus-trend" title="分類收入趨勢" />
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openFilterDialog">
            {{ selectedTypeLabel }} | {{ yearRange }}
          </el-tag>
          <el-tag size="small">區間末年累計 {{ endYearTotal }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else :description="`${yearRange} 尚無「${selectedType}」資料`" :image-size="80" />

    <el-dialog v-model="filterDialogVisible" title="篩選條件" width="320px" align-center :lock-scroll="true">
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <el-select v-model="draftType" placeholder="分類" style="width: 100%;">
          <el-option v-for="o in INCOME_TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>

        <el-row :gutter="10">
          <el-col :span="12">
            <el-select v-model="draftStartYear" placeholder="起始年" style="width: 100%;">
              <el-option v-for="year in yearOptions" :key="`start-${year}`" :label="`${year}年`" :value="year" />
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-select v-model="draftEndYear" placeholder="結束年" style="width: 100%;">
              <el-option v-for="year in yearOptions" :key="`end-${year}`" :label="`${year}年`" :value="year" />
            </el-select>
          </el-col>
        </el-row>
      </div>

      <template #footer>
        <el-row :gutter="10">
          <el-col :span="12">
            <el-button type="danger" plain style="width: 100%;" @click="resetDraftFilter">重置</el-button>
          </el-col>
          <el-col :span="12">
            <el-button type="primary" style="width: 100%;" @click="applyFilter">確定</el-button>
          </el-col>
        </el-row>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import ChartHeaderTitle from './ChartHeaderTitle.vue'
import { type IncomeType } from '../../../types/income'
import { INCOME_TYPE_OPTIONS } from '../../../configs/constant'
import { useChartFormat } from '../../../composables/useChartFormat'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler)

const store = useIncomeStore()
const { formatShort } = useChartFormat()

const selectedType = ref<IncomeType>('月獎金')
const selectedTypeLabel = computed(() => INCOME_TYPE_OPTIONS.find(o => o.value === selectedType.value)?.label ?? selectedType.value)

const currentYear = dayjs().year()
const defaultStartYear = currentYear - 1
const defaultEndYear = currentYear

const startYear = ref(defaultStartYear)
const endYear = ref(defaultEndYear)

const filterDialogVisible = ref(false)
const draftType = ref<IncomeType>(selectedType.value)
const draftStartYear = ref(defaultStartYear)
const draftEndYear = ref(defaultEndYear)

const yearOptions = computed(() => {
  const years = new Set<number>([currentYear, currentYear - 1])
  store.dailyLists.forEach((d) => years.add(dayjs(d.date).year()))
  return Array.from(years).sort((a, b) => b - a)
})

const yearRange = computed(() => `${startYear.value} - ${endYear.value}`)

const openFilterDialog = () => {
  draftType.value = selectedType.value
  draftStartYear.value = startYear.value
  draftEndYear.value = endYear.value
  filterDialogVisible.value = true
}

const resetDraftFilter = () => {
  draftType.value = '月獎金'
  draftStartYear.value = defaultStartYear
  draftEndYear.value = defaultEndYear
}

const applyFilter = () => {
  if (!draftType.value || draftStartYear.value == null || draftEndYear.value == null) {
    ElMessage.warning('分類與起訖年份皆為必填')
    return
  }

  const start = Math.min(draftStartYear.value, draftEndYear.value)
  const end = Math.max(draftStartYear.value, draftEndYear.value)
  selectedType.value = draftType.value
  startYear.value = start
  endYear.value = end
  filterDialogVisible.value = false
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

const isFutureMonth = (year: number, monthIdx: number) => {
  const target = dayjs(`${year}-${String(monthIdx + 1).padStart(2, '0')}-01`)
  return target.isAfter(dayjs().startOf('month'))
}

const amountForMonth = (year: number, monthIdx: number): number | null => {
  if (isFutureMonth(year, monthIdx)) return null
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
  return store.dailyLists
    .filter(d => d.date.startsWith(monthStr))
    .flatMap(d => d.items)
    .filter(e => e.type === selectedType.value)
    .reduce((s, e) => s + e.amount, 0)
}

const endYearData = computed(() => MONTH_LABELS.map((_, i) => amountForMonth(endYear.value, i)))
const startYearData = computed(() => MONTH_LABELS.map((_, i) => amountForMonth(startYear.value, i)))

const hasData = computed(() =>
  endYearData.value.some(v => (v ?? 0) > 0) || startYearData.value.some(v => (v ?? 0) > 0)
)

const endYearTotal = computed(() => {
  const total = endYearData.value.reduce<number>((s, v) => s + (v ?? 0), 0)
  return `$${total.toLocaleString()}`
})

const suggestedMax = computed(() => {
  const allValues = [...endYearData.value, ...startYearData.value].filter((v): v is number => (v ?? 0) > 0)
  if (allValues.length === 0) return 10000
  return Math.ceil(Math.max(...allValues) * 1.2 / 1000) * 1000
})

const chartData = computed(() => ({
  labels: MONTH_LABELS,
  datasets: [
    {
      label: `${endYear.value}年`,
      data: endYearData.value,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.1)',
      borderWidth: 2.5,
      pointBackgroundColor: endYearData.value.map((v) => {
        if (v == null) return 'transparent'
        return v > 0 ? '#f59e0b' : '#ffffff'
      }),
      pointBorderColor: endYearData.value.map((v) => {
        if (v == null) return 'transparent'
        return '#f59e0b'
      }),
      pointBorderWidth: endYearData.value.map(v => v == null ? 0 : 2),
      pointRadius: endYearData.value.map(v => v == null ? 0 : 4),
      tension: 0.3,
      fill: false,
    },
    {
      label: `${startYear.value}年`,
      data: startYearData.value,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      borderWidth: 2.5,
      borderDash: [5, 4],
      pointBackgroundColor: startYearData.value.map((v) => {
        if (v == null) return 'transparent'
        return v > 0 ? '#3b82f6' : '#ffffff'
      }),
      pointBorderColor: startYearData.value.map((v) => {
        if (v == null) return 'transparent'
        return '#3b82f6'
      }),
      pointBorderWidth: startYearData.value.map(v => v == null ? 0 : 2),
      pointRadius: startYearData.value.map(v => v == null ? 0 : 4),
      tension: 0.3,
      fill: false,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  aspectRatio: 1.45,
  spanGaps: false,
  plugins: {
    legend: { position: 'bottom' as const },
    tooltip: {
      callbacks: {
        label: (ctx: any) =>
          ctx.parsed.y == null
            ? ''
            : ctx.parsed.y > 0
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
