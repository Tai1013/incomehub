<template>
  <PanelSection title="圖表分析" class="chart-panel">
    <el-space direction="vertical" fill style="width: 100%" :size="16">
      <MonthPieChart />
      <YearPieChart />
      <YearBarChart />
      <TwoYearLineChart />
      <YearCumulativeChart />
      <AllYearsBarChart />
      <TypeTrendChart />
      <QuarterlyChart />
      <CalendarHeatmap />
      <MonthlyRangeChart />
      <BonusTrendChart />
    </el-space>
  </PanelSection>
</template>

<script setup lang="ts">
import MonthPieChart from '../components/income/charts/MonthPieChart.vue'
import YearPieChart from '../components/income/charts/YearPieChart.vue'
import YearBarChart from '../components/income/charts/YearBarChart.vue'
import TwoYearLineChart from '../components/income/charts/TwoYearLineChart.vue'
import YearCumulativeChart from '../components/income/charts/YearCumulativeChart.vue'
import AllYearsBarChart from '../components/income/charts/AllYearsBarChart.vue'
import TypeTrendChart from '../components/income/charts/TypeTrendChart.vue'
import QuarterlyChart from '../components/income/charts/QuarterlyChart.vue'
import CalendarHeatmap from '../components/income/charts/CalendarHeatmap.vue'
import MonthlyRangeChart from '../components/income/charts/MonthlyRangeChart.vue'
import BonusTrendChart from '../components/income/charts/BonusTrendChart.vue'
import PanelSection from '../components/layout/PanelSection.vue'
</script>

<style scoped lang="scss">
.chart-panel {
  border-radius: 18px;

  :deep(.el-space) {
    width: 100%;
  }

  :deep(.el-space__item) {
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
  }

  :deep(.el-card) {
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  :deep(canvas) {
    max-width: 100% !important;
  }
}


</style>
