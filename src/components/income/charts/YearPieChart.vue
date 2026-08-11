<template>
  <el-card shadow="never">
    <template #header>
      <div class="chart-header">
        <ChartHeaderTitle chart-key="year-pie" title="年分類佔比" />
        <div class="chart-header-tags">
          <el-tag type="info" size="small" style="cursor: pointer;" @click="openYearDialog">{{ selectedYearLabel }}</el-tag>
          <el-tag size="small">總計 {{ totalFormatted }}</el-tag>
        </div>
      </div>
    </template>
    <div v-if="hasData" style="max-width: 360px; margin: 0 auto;">
      <PolarArea :data="chartData" :options="chartOptions" />
    </div>
    <el-empty v-else description="今年尚無收入資料" :image-size="80" />

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
import { PolarArea } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, RadialLinearScale, Tooltip, Legend } from 'chart.js'
import { useIncomeStore } from '../../../stores/income'
import ChartHeaderTitle from './ChartHeaderTitle.vue'
import BaseActionDialog from '../../layout/BaseActionDialog.vue'
import { useChartFormat } from '../../../composables/useChartFormat'
import { useOrderedIncomeTypes } from '../../../composables/useOrderedIncomeTypes'

ChartJS.register(ArcElement, RadialLinearScale, Tooltip, Legend)

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

const selectedYearLabel = computed(() => dayjs(`${selectedYear.value}-01-01`).format('YYYY'))

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
  const totals = incomeTypes.value.map(type =>
    yearEntries.value.filter(e => e.type === type).reduce((s, e) => s + e.amount, 0)
  )
  const activeIndices = incomeTypes.value.map((_, i) => i).filter(i => totals[i] > 0)

  return {
    labels: activeIndices.map(i => incomeTypes.value[i]),
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
