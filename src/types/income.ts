export type IncomeType = '薪水' | '月獎金' | '年獎金' | '年終' | '節日禮金' | '股票利息'

export interface IncomeEntry {
  id: string
  date: string
  type: IncomeType
  amount: number
}

export interface IncomeFormModel {
  date: string
  type: IncomeType | ''
  amount: number | null
}

/** @deprecated 請改從 configs/constant 引入 INCOME_TYPES */
export { INCOME_TYPES as incomeTypes } from '../configs/constant'
