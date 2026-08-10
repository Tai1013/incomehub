import type { Component } from 'vue'
import type { FavoriteChartKey } from '../types/chart'
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

export interface ChartDefinition {
  key: FavoriteChartKey
  anchor: string
  title: string
  ariaLabel: string
  component: Component
}

export const CHART_DEFINITIONS: ChartDefinition[] = [
  { key: 'month-pie', anchor: 'month-pie', title: '本月類型占比', ariaLabel: '查看本月收入占比圖', component: MonthPieChart },
  { key: 'year-pie', anchor: 'year-pie', title: '今年類型占比', ariaLabel: '查看今年收入占比圖', component: YearPieChart },
  { key: 'year-bar', anchor: 'year-bar', title: '每月收入', ariaLabel: '查看每月收入圖', component: YearBarChart },
  { key: 'two-year-line', anchor: 'two-year-line', title: '近兩年月趨勢', ariaLabel: '查看近兩年月收入趨勢圖', component: TwoYearLineChart },
  { key: 'year-cumulative', anchor: 'year-cumulative', title: '今年累積收入', ariaLabel: '查看今年累積收入圖', component: YearCumulativeChart },
  {
    key: 'year-cumulative-compare',
    anchor: 'year-cumulative-compare',
    title: '年累積收入比較',
    ariaLabel: '查看年累積收入比較圖',
    component: YearCumulativeCompareChart,
  },
  { key: 'all-years-bar', anchor: 'all-years-bar', title: '歷年收入', ariaLabel: '查看歷年收入圖', component: AllYearsBarChart },
  { key: 'type-trend', anchor: 'type-trend', title: '分類月趨勢', ariaLabel: '查看各分類月趨勢圖', component: TypeTrendChart },
  { key: 'quarterly', anchor: 'quarterly', title: '季度收入比較', ariaLabel: '查看季度收入比較圖', component: QuarterlyChart },
  {
    key: 'calendar-heatmap',
    anchor: 'calendar-heatmap',
    title: '收入日曆熱力圖',
    ariaLabel: '查看收入日曆熱力圖',
    component: CalendarHeatmap,
  },
  {
    key: 'monthly-range',
    anchor: 'monthly-range',
    title: '每月收入波動範圍',
    ariaLabel: '查看每月收入波動範圍圖',
    component: MonthlyRangeChart,
  },
  { key: 'bonus-trend', anchor: 'bonus-trend', title: '獎金趨勢', ariaLabel: '查看獎金趨勢圖', component: BonusTrendChart },
]
