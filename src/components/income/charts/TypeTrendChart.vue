<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <ChartHeaderTitle chart-key="type-trend" title="各分類月趨勢" />
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openYearDialog">{{ selectedYear }}年</el-tag>
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
  LineElement, PointElement, Tooltip, Legend,
} from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import ChartHeaderTitle from './ChartHeaderTitle.vue'
import { incomeTypes } from '../../../types/income'
import { useChartFormat } from '../../../composables/useChartFormat'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

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
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316']

const isFutureMonth = (year: string, monthIdx: number) => {
  const target = dayjs(`${year}-${String(monthIdx + 1).padStart(2, '0')}-01`)
  return target.isAfter(dayjs().startOf('month'))
}

const yearEntries = computed(() =>
  store.dailyLists
    .filter(d => d.date.startsWith(selectedYear.value))
    .flatMap(d => d.items)
)

const hasData = computed(() => yearEntries.value.length > 0)

const chartData = computed(() => {
  const datasets = incomeTypes.map((type, idx) => {
    const data = MONTH_LABELS.map((_, monthIdx) => {
      if (isFutureMonth(selectedYear.value, monthIdx)) return null
      const monthStr = `${selectedYear.value}-${String(monthIdx + 1).padStart(2, '0')}`
      return yearEntries.value
        .filter(e => e.type === type && e.date.startsWith(monthStr))
        .reduce((s, e) => s + e.amount, 0)
    })
    return {
      label: type,
      data,
      borderColor: COLORS[idx % COLORS.length],
      backgroundColor: COLORS[idx % COLORS.length] + '33',
      borderWidth: 2,
      pointBackgroundColor: data.map((v) => {
        if (v == null) return 'transparent'
        return v > 0 ? COLORS[idx % COLORS.length] : '#ffffff'
      }),
      pointBorderColor: data.map((v) => {
        if (v == null) return 'transparent'
        return COLORS[idx % COLORS.length]
      }),
      pointBorderWidth: data.map(v => v == null ? 0 : 2),
      pointRadius: data.map(v => v == null ? 0 : 3),
      tension: 0.3,
      hidden: !data.some(v => (v ?? 0) > 0),
    }
  })

  return { labels: MONTH_LABELS, datasets }
})

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
      ticks: { callback: (val: any) => formatShort(Number(val)) },
    },
  },
}
</script>
