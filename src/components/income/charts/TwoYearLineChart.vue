<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <ChartHeaderTitle chart-key="two-year-line" title="每月總和" />
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openYearDialog">{{ selectedYearsLabel }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="所選年份尚無收入資料" :image-size="80" />

    <BaseActionDialog
      v-model="yearDialogVisible"
      title="選擇年份（最多3個）"
      width="320px"
      :lock-scroll="true"
      :show-cancel-button="false"
      :show-custom-button="true"
      custom-button-text="重置"
      custom-button-type="danger"
      :footer-button-order="['secondaryConfirm', 'confirm']"
      @secondary-confirm="resetDraftYears"
      @confirm="applyYears"
    >
      <el-select
        v-model="draftYears"
        multiple
        class="year-multi-select"
        tag-type="primary"
        tag-effect="light"
        style="width: 100%;"
        placeholder="請選擇年份"
      >
        <el-option
          v-for="year in availableYears"
          :key="year"
          :label="`${year}年`"
          :value="year"
          :disabled="isYearOptionDisabled(year)"
        />
      </el-select>
    </BaseActionDialog>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import ChartHeaderTitle from './ChartHeaderTitle.vue'
import BaseActionDialog from '../../layout/BaseActionDialog.vue'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler)

const store = useIncomeStore()

const yearDialogVisible = ref(false)
const selectedYears = ref<string[]>([])
const draftYears = ref<string[]>([])

const availableYears = computed(() => {
  const years = new Set<string>()
  store.dailyLists.forEach((d) => {
    years.add(dayjs(d.date).format('YYYY'))
  })
  return Array.from(years).sort((a, b) => Number(b) - Number(a))
})

const defaultYears = computed(() => availableYears.value.slice(0, 2))

watch(availableYears, (years) => {
  const selectedFiltered = selectedYears.value.filter(y => years.includes(y)).slice(0, 3)
  selectedYears.value = selectedFiltered.length > 0 ? selectedFiltered : [...defaultYears.value]

  const draftFiltered = draftYears.value.filter(y => years.includes(y)).slice(0, 3)
  draftYears.value = draftFiltered.length > 0 ? draftFiltered : [...selectedYears.value]
}, { immediate: true })

const selectedYearsLabel = computed(() =>
  selectedYears.value
    .slice()
    .sort((a, b) => Number(a) - Number(b))
    .map(y => dayjs(`${y}-01-01`).format('YYYY'))
    .join(' / ')
)

const openYearDialog = () => {
  draftYears.value = [...selectedYears.value]
  yearDialogVisible.value = true
}

const resetDraftYears = () => {
  draftYears.value = [...defaultYears.value]
}

const applyYears = () => {
  if (draftYears.value.length === 0) {
    ElMessage.warning('請至少選擇一個年份')
    return
  }
  const uniqueYears = Array.from(
    new Set(draftYears.value.filter(y => availableYears.value.includes(y)))
  ).sort((a, b) => Number(a) - Number(b)).slice(0, 3)
  selectedYears.value = uniqueYears.length > 0 ? uniqueYears : [...defaultYears.value]
  yearDialogVisible.value = false
}

const isYearOptionDisabled = (year: string) => draftYears.value.length >= 3 && !draftYears.value.includes(year)

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
const COLORS = ['#f59e0b', '#3b82f6', '#10b981']

const isFutureMonth = (year: string, monthIdx: number) => {
  const target = dayjs(`${year}-${String(monthIdx + 1).padStart(2, '0')}-01`)
  return target.isAfter(dayjs().startOf('month'))
}

const monthlyTotal = (year: string, monthIdx: number) => {
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
  return store.dailyLists
    .filter(d => d.date.startsWith(monthStr))
    .flatMap(d => d.items)
    .reduce((s, e) => s + e.amount, 0)
}

const yearSeries = computed(() =>
  selectedYears.value.map((year) => ({
    year,
    data: MONTH_LABELS.map((_, i) => {
      if (isFutureMonth(year, i)) return null
      return monthlyTotal(year, i)
    }),
  }))
)

const hasData = computed(() =>
  yearSeries.value.some(series => series.data.some(v => (v ?? 0) > 0))
)

const chartData = computed(() => ({
  labels: MONTH_LABELS,
  datasets: yearSeries.value.map((series, idx) => {
    const color = COLORS[idx % COLORS.length]
    return {
      label: `${series.year}年`,
      data: series.data,
      borderColor: color,
      backgroundColor: color + '22',
      borderWidth: 2.5,
      pointBackgroundColor: series.data.map((v) => {
        if (v == null) return 'transparent'
        return v > 0 ? color : '#ffffff'
      }),
      pointBorderColor: series.data.map((v) => {
        if (v == null) return 'transparent'
        return color
      }),
      pointBorderWidth: series.data.map(v => v == null ? 0 : 2),
      pointRadius: series.data.map(v => v == null ? 0 : 4),
      tension: 0.3,
      fill: false,
    }
  }),
}))

const chartOptions = {
  responsive: true,
  aspectRatio: 1.45,
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

<style scoped lang="scss">
.year-multi-select :deep(.el-select__selected-item .el-tag),
.year-multi-select :deep(.el-select__tags .el-tag),
.year-multi-select :deep(.el-select-selection__tags .el-tag) {
  border-width: 1px;
  border-style: solid;
}
</style>
