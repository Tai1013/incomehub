export type IncomeType = '薪水' | '月獎金' | '年獎金' | '年終' | '節日禮金' | '股票利息' | (string & {})

export interface IncomeTypeConfig {
  icon: string
  label: string
}

export interface IncomeEntry {
  id: string
  date: string
  type: IncomeType
  amount: number
  description?: string
}
