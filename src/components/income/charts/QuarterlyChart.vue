<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <ChartHeaderTitle chart-key="quarterly" title="季度收入分析" />
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openYearDialog">{{ selectedYear }}年</el-tag>
          <el-tag size="small">年總計 {{ totalFormatted }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData">
      <Bar :data="chartData" :options="chartOptions" />
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
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import ChartHeaderTitle from './ChartHeaderTitle.vue'
import { useChartFormat } from '../../../composables/useChartFormat'
import { useOrderedIncomeTypes } from '../../../composables/useOrderedIncomeTypes'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const store = useIncomeStore()
const { formatShort } = useChartFormat()
const incomeTypes = useOrderedIncomeTypes()

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

const QUARTER_LABELS = ['Q1（1-3月）', 'Q2（4-6月）', 'Q3（7-9月）', 'Q4（10-12月）']
const QUARTER_MONTHS = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']]
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

const yearEntries = computed(() =>
  store.dailyLists
    .filter(d => d.date.startsWith(selectedYear.value))
    .flatMap(d => d.items)
)

const hasData = computed(() => yearEntries.value.length > 0)

const totalFormatted = computed(() => {
  const total = yearEntries.value.reduce((s, e) => s + e.amount, 0)
  return `$${total.toLocaleString()}`
})

const chartData = computed(() => {
  const datasets = incomeTypes.value.map((type, idx) => {
    const data = QUARTER_MONTHS.map(months =>
      yearEntries.value
        .filter(e => e.type === type && months.some(m => e.date.startsWith(`${selectedYear.value}-${m}`)))
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
      beginAtZero: true,
      ticks: { callback: (val: any) => formatShort(Number(val)) },
    },
  },
}
</script>
