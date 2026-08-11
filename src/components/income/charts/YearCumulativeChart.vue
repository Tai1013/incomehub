<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <ChartHeaderTitle chart-key="year-cumulative" title="年累積收入" />
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openYearDialog">{{ selectedYear }}年</el-tag>
          <el-tag size="small">年累計 {{ totalFormatted }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="所選年份尚無收入資料" :image-size="80" />

    <BaseActionDialog
      v-model="yearDialogVisible"
      title="選擇年份"
      width="280px"
      :lock-scroll="true"
      :show-cancel-button="false"
      :show-custom-button="true"
      custom-button-text="重置"
      custom-button-type="danger"
      :footer-button-order="['secondaryConfirm', 'confirm']"
      @secondary-confirm="resetDraftYear"
      @confirm="applyYear"
    >
      <el-select v-model="draftYear" placeholder="年" style="width: 100%;">
        <el-option v-for="year in yearOptions" :key="year" :label="`${year}年`" :value="year" />
      </el-select>
    </BaseActionDialog>
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
import ChartHeaderTitle from './ChartHeaderTitle.vue'
import BaseActionDialog from '../../layout/BaseActionDialog.vue'
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

const totalFormatted = computed(() => {
  const total = yearEntries.value.reduce((s, e) => s + e.amount, 0)
  return `$${total.toLocaleString()}`
})

const chartData = computed(() => {
  let cumulative = 0
  const data = MONTH_LABELS.map((_, monthIdx) => {
    if (isFutureMonth(selectedYear.value, monthIdx)) return null
    const monthStr = `${selectedYear.value}-${String(monthIdx + 1).padStart(2, '0')}`
    cumulative += yearEntries.value
      .filter(e => e.date.startsWith(monthStr))
      .reduce((s, e) => s + e.amount, 0)
    return cumulative
  })

  return {
    labels: MONTH_LABELS,
    datasets: [{
      label: '累積收入',
      data,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderWidth: 2.5,
      pointBackgroundColor: data.map((v) => {
        if (v == null) return 'transparent'
        return v > 0 ? '#f59e0b' : '#ffffff'
      }),
      pointBorderColor: data.map((v) => {
        if (v == null) return 'transparent'
        return '#f59e0b'
      }),
      pointBorderWidth: data.map(v => v == null ? 0 : 2),
      pointRadius: data.map(v => v == null ? 0 : 4),
      tension: 0.4,
      fill: true,
    }],
  }
})

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) =>
          ctx.parsed.y != null ? ` 累積: $${ctx.parsed.y.toLocaleString()}` : '',
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
