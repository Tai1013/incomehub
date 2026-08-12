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

class AssistantHttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
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

const isIncomeAssistantRequestPayload = (payload: unknown): payload is IncomeAssistantRequestPayload => {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as Partial<IncomeAssistantRequestPayload>
  return typeof candidate.question === 'string' && candidate.locale === 'zh-TW' && !!candidate.summary
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

const resolveGeminiErrorMessage = (status: number) => {
  if (status === 429) {
    return 'AI 服務目前用量已達上限，請稍後再試。'
  }

  if (status === 401 || status === 403) {
    return 'AI 服務設定需要檢查，請稍後再試。'
  }

  if (status >= 500) {
    return 'AI 服務暫時不穩定，請稍後再試。'
  }

  return 'AI 小助手暫時無法回覆，請稍後再試。'
}

const askGemini = async (payload: IncomeAssistantRequestPayload) => {
  if (!geminiApiKey) {
    throw new AssistantHttpError(500, 'AI 服務尚未完成設定，請稍後再試。')
  }

  const response = await createGeminiInteraction(payload)

  if (!response.ok) {
    throw new AssistantHttpError(response.status, resolveGeminiErrorMessage(response.status))
  }

  const data = await response.json() as GeminiInteractionResponse
  const reply = extractInteractionText(data)

  if (!reply) {
    throw new AssistantHttpError(502, 'AI 服務暫時沒有回傳內容，請稍後再試。')
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
    const status = error instanceof AssistantHttpError ? error.status : 500
    return jsonResponse({ error: message }, status)
  }
})
