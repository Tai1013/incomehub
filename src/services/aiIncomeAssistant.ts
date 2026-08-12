import dayjs from 'dayjs'
import { formatShort } from '../configs/formatter'
import { supabase } from '../lib/supabase'
import type { IncomeEntry } from '../types/income'

interface AskIncomeAssistantPayload {
  question: string
  entries: IncomeEntry[]
}

interface IncomeAmountSummary {
  label: string
  amount: number
  entryCount: number
}

interface IncomeYearTypeSummary {
  year: string
  typeTotals: IncomeAmountSummary[]
}

interface IncomeAssistantSummary {
  entryCount: number
  totalAmount: number
  yearTotals: IncomeAmountSummary[]
  monthTotals: IncomeAmountSummary[]
  typeTotals: IncomeAmountSummary[]
  yearTypeTotals: IncomeYearTypeSummary[]
  currentYear?: IncomeAmountSummary
  previousYear?: IncomeAmountSummary
  yearGrowthRate: number | null
  topMonth?: IncomeAmountSummary
  topTypes: IncomeAmountSummary[]
}

interface IncomeAssistantRequestPayload {
  question: string
  locale: 'zh-TW'
  generatedAt: string
  instructions: string[]
  summary: IncomeAssistantSummary
}

interface IncomeAssistantResponse {
  reply?: string
  error?: string
}

const defaultAssistantErrorReply = 'AI 小助手暫時無法回覆，請稍後再試。'
const authRequiredAssistantErrorReply = '登入狀態已過期，請重新登入後再使用 AI 小助手。'
const assistantReplyDelay = 900
const assistantMode = import.meta.env.VITE_AI_ASSISTANT_MODE === 'edge' ? 'edge' : 'mock'
const assistantFunctionName = 'income-assistant'
const assistantInstructions = [
  '請用繁體中文回答。',
  '回覆要根據收入摘要，不要假設摘要以外的資料。',
  '可以用 3 到 4 個短重點回覆，保留具體數字、異常月份、收入組成與保守建議。',
  '如果使用者詢問扣除特定收入類型後的成長率，請根據每一年各收入類型金額，逐年扣除後再計算。',
  '不要把資料限制或缺少資料獨立列成一個重點。',
  '只有在無法回答核心問題時，才在最後一句簡短提醒資料限制。',
]

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

const sumEntries = (entries: IncomeEntry[]) => entries.reduce((total, entry) => total + entry.amount, 0)

const groupByYear = (entries: IncomeEntry[]) => {
  const grouped = new Map<string, IncomeEntry[]>()

  entries.forEach((entry) => {
    const year = dayjs(entry.date).format('YYYY')
    const bucket = grouped.get(year) ?? []
    bucket.push(entry)
    grouped.set(year, bucket)
  })

  return grouped
}

const groupByMonth = (entries: IncomeEntry[]) => {
  const grouped = new Map<string, IncomeEntry[]>()

  entries.forEach((entry) => {
    const month = dayjs(entry.date).format('YYYY-MM')
    const bucket = grouped.get(month) ?? []
    bucket.push(entry)
    grouped.set(month, bucket)
  })

  return grouped
}

const toAmountSummaries = (groups: Map<string, IncomeEntry[]>) => Array.from(groups.entries()).map(([label, groupEntries]) => ({
  label,
  amount: sumEntries(groupEntries),
  entryCount: groupEntries.length,
}))

const getTypeGroups = (entries: IncomeEntry[]) => {
  const grouped = new Map<string, IncomeEntry[]>()

  entries.forEach((entry) => {
    const bucket = grouped.get(entry.type) ?? []
    bucket.push(entry)
    grouped.set(entry.type, bucket)
  })

  return grouped
}

export const buildIncomeAssistantSummary = (entries: IncomeEntry[]): IncomeAssistantSummary => {
  const yearGroups = groupByYear(entries)
  const yearTotals = toAmountSummaries(groupByYear(entries)).sort((first, second) => second.label.localeCompare(first.label))
  const monthTotals = toAmountSummaries(groupByMonth(entries)).sort((first, second) => second.amount - first.amount)
  const typeTotals = toAmountSummaries(getTypeGroups(entries)).sort((first, second) => second.amount - first.amount)
  const yearTypeTotals = Array.from(yearGroups.entries())
    .map(([year, yearEntries]) => ({
      year,
      typeTotals: toAmountSummaries(getTypeGroups(yearEntries)).sort((first, second) => second.amount - first.amount),
    }))
    .sort((first, second) => second.year.localeCompare(first.year))
  const currentYear = yearTotals[0]
  const previousYear = yearTotals[1]
  const yearGrowthRate = previousYear && previousYear.amount > 0
    ? ((currentYear.amount - previousYear.amount) / previousYear.amount) * 100
    : null

  return {
    entryCount: entries.length,
    totalAmount: sumEntries(entries),
    yearTotals,
    monthTotals,
    typeTotals,
    yearTypeTotals,
    currentYear,
    previousYear,
    yearGrowthRate,
    topMonth: monthTotals[0],
    topTypes: typeTotals.slice(0, 3),
  }
}

export const buildIncomeAssistantRequestPayload = (question: string, entries: IncomeEntry[]): IncomeAssistantRequestPayload => ({
  question,
  locale: 'zh-TW',
  generatedAt: dayjs().toISOString(),
  instructions: assistantInstructions,
  summary: buildIncomeAssistantSummary(entries),
})

const buildIncomeSummaryReply = (payload: IncomeAssistantRequestPayload) => {
  const { question, summary } = payload

  if (summary.entryCount === 0) {
    return `我收到你的問題：「${question}」\n\n目前還沒有可分析的收入資料。新增幾筆收入後，我就能幫你看成長率、異常月份和收入結構。`
  }

  const topTypeLines = summary.topTypes.map((item) => `- ${item.label}: ${formatShort(item.amount)}`).join('\n')

  return [
    `我收到你的問題：「${question}」`,
    '',
    summary.currentYear ? `先用目前資料做一版模擬分析：${summary.currentYear.label} 年收入合計約 ${formatShort(summary.currentYear.amount)}。` : '',
    summary.previousYear && summary.yearGrowthRate !== null
      ? `和 ${summary.previousYear.label} 年相比，成長率約 ${summary.yearGrowthRate.toFixed(1)}%。`
      : '',
    summary.topMonth ? `收入最高的月份是 ${summary.topMonth.label}，約 ${formatShort(summary.topMonth.amount)}。` : '',
    topTypeLines ? `主要收入來源：\n${topTypeLines}` : '',
    '',
    '等串接 Gemini 後，這裡會改成由 AI 依你的問題產生更細的建議。',
  ]
    .filter(Boolean)
    .join('\n')
}

const resolveFunctionErrorMessage = async (error: unknown) => {
  const context = (error as { context?: unknown }).context

  if (!(context instanceof Response)) {
    return defaultAssistantErrorReply
  }

  try {
    const data = await context.clone().json() as IncomeAssistantResponse

    if (data.error?.trim()) {
      return data.error.trim()
    }
  } catch {
    // Fall back to status-based messages below.
  }

  if (context.status === 429) {
    return 'AI 服務目前用量已達上限，請稍後再試。'
  }

  if (context.status === 401 || context.status === 403) {
    return authRequiredAssistantErrorReply
  }

  if (context.status >= 500) {
    return 'AI 服務暫時不穩定，請稍後再試。'
  }

  return defaultAssistantErrorReply
}

const askIncomeAssistantByEdgeFunction = async (payload: IncomeAssistantRequestPayload) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error(authRequiredAssistantErrorReply)
  }

  const { data, error } = await supabase.functions.invoke<IncomeAssistantResponse>(assistantFunctionName, {
    body: payload,
  })

  if (error) {
    throw new Error(await resolveFunctionErrorMessage(error))
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  if (!data?.reply) {
    throw new Error(defaultAssistantErrorReply)
  }

  return data.reply
}

export const askIncomeAssistant = async ({ question, entries }: AskIncomeAssistantPayload) => {
  const payload = buildIncomeAssistantRequestPayload(question, entries)

  if (assistantMode === 'edge') {
    return askIncomeAssistantByEdgeFunction(payload)
  }

  await wait(assistantReplyDelay)
  return buildIncomeSummaryReply(payload)
}
