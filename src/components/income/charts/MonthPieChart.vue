<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <span>月分類佔比</span>
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openMonthDialog">{{ selectedMonthLabel }}</el-tag>
          <el-tag size="small">總計 {{ totalFormatted }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData" style="max-width: 360px; margin: 0 auto;">
      <PolarArea :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="本月尚無收入資料" :image-size="80" />

    <el-dialog v-model="monthDialogVisible" title="選擇月份" width="320px" align-center :lock-scroll="true">
      <el-row :gutter="10">
        <el-col :span="12">
          <el-select v-model="draftYear" placeholder="年" style="width: 100%;">
            <el-option v-for="year in yearOptions" :key="year" :label="`${year}年`" :value="year" />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-select v-model="draftMonth" placeholder="月" style="width: 100%;">
            <el-option v-for="month in monthOptions" :key="month" :label="`${String(month).padStart(2, '0')}月`" :value="month" />
          </el-select>
        </el-col>
      </el-row>
      <template #footer>
        <el-row :gutter="10">
          <el-col :span="12">
            <el-button type="danger" plain style="width: 100%;" @click="resetDraftMonth">重置</el-button>
          </el-col>
          <el-col :span="12">
            <el-button type="primary" style="width: 100%;" @click="applyMonth">確定</el-button>
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
import { PolarArea } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, RadialLinearScale, Tooltip, Legend } from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import { incomeTypes } from '../../../types/income'
import { useChartFormat } from '../../../composables/useChartFormat'

ChartJS.register(ArcElement, RadialLinearScale, Tooltip, Legend)

const store = useIncomeStore()
const { formatShort } = useChartFormat()

const currentDate = dayjs()
const DEFAULT_YEAR = currentDate.year()
const DEFAULT_MONTH = currentDate.month() + 1
const DEFAULT_MONTH_KEY = currentDate.format('YYYY-MM')

const selectedMonth = ref(DEFAULT_MONTH_KEY)
const monthDialogVisible = ref(false)
const draftYear = ref(DEFAULT_YEAR)
const draftMonth = ref(DEFAULT_MONTH)

const yearOptions = computed(() => {
  const years = new Set<number>([DEFAULT_YEAR])
  store.dailyLists.forEach((d) => years.add(dayjs(d.date).year()))
  return Array.from(years).sort((a, b) => b - a)
})

const monthOptions = Array.from({ length: 12 }, (_, idx) => idx + 1)

const selectedMonthLabel = computed(() => dayjs(`${selectedMonth.value}-01`).format('YYYY/MM'))

const openMonthDialog = () => {
  const parsed = dayjs(`${selectedMonth.value}-01`)
  draftYear.value = parsed.year()
  draftMonth.value = parsed.month() + 1
  monthDialogVisible.value = true
}

const resetDraftMonth = () => {
  draftYear.value = DEFAULT_YEAR
  draftMonth.value = DEFAULT_MONTH
}

const applyMonth = () => {
  if (draftYear.value == null || draftMonth.value == null) {
    ElMessage.warning('年份與月份為必填')
    return
  }
  selectedMonth.value = dayjs(`${draftYear.value}-${String(draftMonth.value).padStart(2, '0')}-01`).format('YYYY-MM')
  monthDialogVisible.value = false
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

const monthEntries = computed(() =>
  store.dailyLists
    .filter(d => d.date.startsWith(selectedMonth.value))
    .flatMap(d => d.items)
)

const hasData = computed(() => monthEntries.value.length > 0)

const totalFormatted = computed(() => {
  const total = monthEntries.value.reduce((s, e) => s + e.amount, 0)
  return `$${total.toLocaleString()}`
})

const chartData = computed(() => {
  const totals = incomeTypes.map(type =>
    monthEntries.value.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0)
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
