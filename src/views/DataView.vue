<script setup lang="ts">
import MonthPieChart from '../components/income/charts/MonthPieChart.vue'
import YearPieChart from '../components/income/charts/YearPieChart.vue'
import YearBarChart from '../components/income/charts/YearBarChart.vue'
import TwoYearLineChart from '../components/income/charts/TwoYearLineChart.vue'
import YearCumulativeChart from '../components/income/charts/YearCumulativeChart.vue'
import YearCumulativeCompareChart from '../components/income/charts/YearCumulativeCompareChart.vue'
import AllYearsBarChart from '../components/income/charts/AllYearsBarChart.vue'
import TypeTrendChart from '../components/income/charts/TypeTrendChart.vue'
import QuarterlyChart from '../components/income/charts/QuarterlyChart.vue'
import CalendarHeatmap from '../components/income/charts/CalendarHeatmap.vue'
import MonthlyRangeChart from '../components/income/charts/MonthlyRangeChart.vue'
import BonusTrendChart from '../components/income/charts/BonusTrendChart.vue'
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <MonthPieChart />
    <YearPieChart />
    <YearBarChart />
    <TwoYearLineChart />
    <YearCumulativeChart />
    <YearCumulativeCompareChart />
    <AllYearsBarChart />
    <TypeTrendChart />
    <QuarterlyChart />
    <CalendarHeatmap />
    <MonthlyRangeChart />
    <BonusTrendChart />
  </div>
</template>

<style scoped lang="scss">
:deep(.el-card) {
  border-radius: 14px;
}
</style>
