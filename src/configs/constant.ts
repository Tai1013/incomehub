import type { Component } from 'vue'
import type { IncomeType } from '../types/income'
import { Wallet, Trophy, Medal, Present, Coin, Money } from '@element-plus/icons-vue'

export interface SelectOption<T = string> {
  value: T
  label: string
  icon?: Component
}

/** 收入分類下拉選項（統一格式：value / label / icon?） */
export const INCOME_TYPE_OPTIONS: SelectOption<IncomeType>[] = [
  { value: '薪水',   label: '薪水',   icon: Wallet  },
  { value: '月獎金', label: '月獎金', icon: Trophy  },
  { value: '年獎金', label: '年獎金', icon: Medal   },
  { value: '年終',   label: '年終',   icon: Present },
  { value: '節日禮金', label: '節日禮金', icon: Coin },
  { value: '股票利息', label: '股票利息', icon: Money },
]

/** 收入分類純值陣列（供圖表迭代使用） */
export const INCOME_TYPES: IncomeType[] = INCOME_TYPE_OPTIONS.map(o => o.value)
