<template>
  <section class="panel">
    <h2>每日收入列表</h2>
    <DailyIncomeList />
  </section>

  <section class="panel">
    <h2>圖表分析</h2>
    <el-space direction="vertical" fill style="width: 100%;" :size="16">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <MonthPieChart />
        </el-col>
        <el-col :xs="24" :sm="12">
          <YearPieChart />
        </el-col>
      </el-row>
      <YearBarChart />
    </el-space>
  </section>
</template>

<script setup lang="ts">
import DailyIncomeList from '../components/income/DailyIncomeList.vue'
import MonthPieChart from '../components/income/charts/MonthPieChart.vue'
import YearPieChart from '../components/income/charts/YearPieChart.vue'
import YearBarChart from '../components/income/charts/YearBarChart.vue'
</script>
