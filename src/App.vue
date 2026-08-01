<script setup lang="ts">
import AppHeader from './components/layout/AppHeader.vue'
import AddIncomeDialog from './components/income/AddIncomeDialog.vue'
import DailyIncomeList from './components/income/DailyIncomeList.vue'
import MonthPieChart from './components/income/charts/MonthPieChart.vue'
import YearPieChart from './components/income/charts/YearPieChart.vue'
import YearBarChart from './components/income/charts/YearBarChart.vue'
import TwoYearLineChart from './components/income/charts/TwoYearLineChart.vue'
import YearCumulativeChart from './components/income/charts/YearCumulativeChart.vue'
import AllYearsBarChart from './components/income/charts/AllYearsBarChart.vue'
import TypeTrendChart from './components/income/charts/TypeTrendChart.vue'
import QuarterlyChart from './components/income/charts/QuarterlyChart.vue'
import CalendarHeatmap from './components/income/charts/CalendarHeatmap.vue'
import MonthlyRangeChart from './components/income/charts/MonthlyRangeChart.vue'
import BonusTrendChart from './components/income/charts/BonusTrendChart.vue'
import { useIncomeStore } from './stores/income'

const incomeStore = useIncomeStore()

function openAddIncomeDialog() {
  incomeStore.openAddDialog()
}
</script>

<template>
  <main class="page-root">
    <section class="app-phone-shell">
      <AppHeader @add-income="openAddIncomeDialog" />
      <section class="main-content">
        <section class="panel list-panel">
          <DailyIncomeList />
        </section>
        <section class="panel chart-panel">
          <h2 class="chart-section-title">圖表分析</h2>
          <el-space direction="vertical" fill style="width: 100%;" :size="16">
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
        </section>
      </section>
    </section>
    <AddIncomeDialog />
  </main>
</template>

<style scoped lang="scss">
.page-root {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 0;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.app-phone-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  background: var(--el-bg-color);
  overflow: hidden;
  font-family: var(--el-font-family);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.main-content {
  flex: 1;
  padding: 10px 10px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.list-panel {
  border-radius: 18px;
}

.chart-panel {
  border-radius: 18px;
  margin-top: 10px;

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

.chart-section-title {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

</style>
