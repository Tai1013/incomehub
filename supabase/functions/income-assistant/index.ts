declare const Deno: {
  env: {
    get: (key: string) => string | undefined
  }
  serve: (handler: (request: Request) => Response | Promise<Response>) => void
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

interface GeminiInteractionResponse {
  output_text?: string
  outputText?: string
  steps?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.6-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json',
  },
})

const formatShort = (value: number) => {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(1))}K`
  return `${value}`
}

const isIncomeAssistantRequestPayload = (payload: unknown): payload is IncomeAssistantRequestPayload => {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as Partial<IncomeAssistantRequestPayload>
  return typeof candidate.question === 'string' && candidate.locale === 'zh-TW' && !!candidate.summary
}

const buildMockReply = ({ question, summary }: IncomeAssistantRequestPayload) => {
  if (summary.entryCount === 0) {
    return `我收到你的問題：「${question}」\n\n目前 Edge Function 已收到請求，但收入摘要裡還沒有資料。新增收入後，就能分析成長率、異常月份和收入組成。`
  }

  const topTypeLines = summary.topTypes.map((item) => `- ${item.label}: ${formatShort(item.amount)}`).join('\n')

  return [
    `我收到你的問題：「${question}」`,
    '',
    '這是 Supabase Edge Function 回傳的 mock 分析：',
    summary.currentYear ? `${summary.currentYear.label} 年收入合計約 ${formatShort(summary.currentYear.amount)}。` : '',
    summary.previousYear && summary.yearGrowthRate !== null
      ? `和 ${summary.previousYear.label} 年相比，成長率約 ${summary.yearGrowthRate.toFixed(1)}%。`
      : '目前缺少前一年完整資料，所以暫時不計算年成長率。',
    summary.topMonth ? `收入最高的月份是 ${summary.topMonth.label}，約 ${formatShort(summary.topMonth.amount)}。` : '',
    topTypeLines ? `主要收入來源：\n${topTypeLines}` : '',
    '',
    '下一步可以在這裡改成呼叫 Gemini API。',
  ]
    .filter(Boolean)
    .join('\n')
}

const buildGeminiPrompt = (payload: IncomeAssistantRequestPayload) => [
  '你是 IncomeHub 的 AI 收入分析助手。',
  '請根據使用者的收入摘要回答問題。',
  '請勿編造摘要中沒有的收入資料。',
  '如果使用者詢問扣除特定收入類型後的成長率，請根據每一年各收入類型金額，找出該收入類型在每一年的金額，先逐年扣除後再計算。',
  '若使用者指定某個收入類型，請只在資料中確實存在該類型時進行扣除或比較。',
  '回覆可以保留整體成長率、異常月份、收入組成與保守建議，但每個重點請簡短。',
  '不要以「您好」作為開頭，可以直接回答結論。',
  '不要建立「缺少資料說明」這類段落，也不要把資料限制獨立列成一點。',
  '只有在無法回答核心問題時，才用最後一句簡短提醒資料限制。',
  '回覆時不要提到任何內部資料欄位名稱、JSON、payload、summary 或 API 參數。',
  '請把內部欄位轉成使用者看得懂的說法，例如「每年各收入類型金額」。',
  '回覆請簡潔、具體，使用繁體中文。',
  '',
  '使用者問題：',
  payload.question,
  '',
  '回覆規則：',
  payload.instructions.map((instruction) => `- ${instruction}`).join('\n'),
  '',
  '以下是內部收入摘要資料，僅供你計算與判斷，禁止在回覆中提到欄位名稱或資料格式：',
  JSON.stringify(payload.summary, null, 2),
].join('\n')

const createGeminiInteraction = async (payload: IncomeAssistantRequestPayload) => fetch(
  'https://generativelanguage.googleapis.com/v1beta/interactions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey ?? '',
      'Api-Revision': '2026-05-20',
    },
    body: JSON.stringify({
      model: geminiModel,
      input: buildGeminiPrompt(payload),
      store: false,
      generation_config: {
        temperature: 0.35,
      },
    }),
  },
)

const extractInteractionText = (data: GeminiInteractionResponse) => {
  const outputText = data.output_text ?? data.outputText

  if (outputText?.trim()) {
    return outputText.trim()
  }

  return data.steps
    ?.flatMap((step) => step.content ?? [])
    .filter((content) => content.type === 'text' && content.text)
    .map((content) => content.text)
    .join('')
    .trim()
}

const askGemini = async (payload: IncomeAssistantRequestPayload) => {
  if (!geminiApiKey) {
    return buildMockReply(payload)
  }

  const response = await createGeminiInteraction(payload)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini Interactions API request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json() as GeminiInteractionResponse
  const reply = extractInteractionText(data)

  if (!reply) {
    throw new Error('Gemini Interactions API did not return text')
  }

  return reply
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const payload = await request.json()

    if (!isIncomeAssistantRequestPayload(payload)) {
      return jsonResponse({ error: 'Invalid request payload' }, 400)
    }

    const reply = await askGemini(payload)
    return jsonResponse({ reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500)
  }
})
