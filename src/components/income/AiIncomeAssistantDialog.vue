<template>
  <el-dialog
    v-model="dialogVisible"
    class="ai-assistant-dialog"
    title="AI 小助手"
    fullscreen
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="assistant-shell">
      <el-scrollbar ref="assistantScrollbarRef" class="assistant-scroll">
        <div class="assistant-content">
          <el-alert
            title="AI 會根據目前收入摘要產生分析，結果可作為檢視趨勢的參考。"
            type="info"
            show-icon
            :closable="false"
          />

          <el-space wrap>
            <el-button v-for="question in quickQuestions" :key="question" class="quick-question-button" plain @click="submitQuestion(question)">
              {{ question }}
            </el-button>
          </el-space>

          <div class="message-list">
            <template v-for="item in messages" :key="item.id">
              <div v-if="item.kind === 'message'" class="message-row" :class="`is-${item.role}`">
                <div class="message-bubble" :class="{ 'is-pending': item.isPending }">
                  <span v-if="item.isPending" class="typing-indicator" aria-label="AI 正在回覆">
                    <span class="typing-dot" />
                    <span class="typing-dot" />
                    <span class="typing-dot" />
                  </span>
                  <div v-else-if="item.role === 'assistant'" class="message-markdown" v-html="renderAssistantContent(item.content)" />
                  <template v-else>
                    {{ item.content }}
                  </template>
                </div>
              </div>
              <el-divider v-else-if="item.kind === 'divider'" class="topic-divider">
                {{ item.label }}
              </el-divider>
              <el-space v-else wrap>
                <el-button
                  v-for="question in quickQuestions"
                  :key="`${item.id}-${question}`"
                  class="quick-question-button"
                  plain
                  @click="submitQuestion(question)"
                >
                  {{ question }}
                </el-button>
              </el-space>
            </template>
          </div>
        </div>
      </el-scrollbar>

      <div class="assistant-composer">
        <el-input
          v-model="draftQuestion"
          maxlength="120"
          show-word-limit
          placeholder="輸入想分析的收入問題"
          @keydown.enter.exact.prevent="submitQuestion()"
        />
        <div class="assistant-composer-actions">
          <el-tooltip content="建立新話題" placement="top">
            <el-button
              circle
              :icon="Plus"
              :type="canCreateNewTopic ? 'success' : 'default'"
              :disabled="!canCreateNewTopic"
              aria-label="建立新話題"
              @click="createNewTopic"
            />
          </el-tooltip>
          <el-button class="assistant-submit-button" type="primary" :icon="Promotion" :disabled="!canSubmit" @click="submitQuestion()">
            送出
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { Plus, Promotion } from '@element-plus/icons-vue'
import type { ScrollbarInstance } from 'element-plus'
import { askIncomeAssistant } from '../../services/aiIncomeAssistant'
import { useIncomeStore } from '../../stores/income'

type AssistantMessageRole = 'assistant' | 'user'

interface AssistantMessage {
  id: number
  kind: 'message'
  role: AssistantMessageRole
  content: string
  isPending?: boolean
}

interface AssistantDivider {
  id: number
  kind: 'divider'
  label: string
}

interface AssistantQuickQuestions {
  id: number
  kind: 'quickQuestions'
}

type AssistantTimelineItem = AssistantMessage | AssistantDivider | AssistantQuickQuestions

const dialogVisible = defineModel<boolean>({ default: false })

const quickQuestions = [
  '我今年收入比去年差在哪？',
  '今年收入成長主要來自哪些月份？',
  '今年收入主要靠哪幾種類型撐起來？',
  '我的收入是否太集中在少數月份或類型？',
  '幫我用保守一點的方式估今年總收入',
]
const assistantErrorReply = '目前暫時無法產生分析，請稍後再試。'
const markdownRenderer = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
})

markdownRenderer.disable(['image'])

const incomeStore = useIncomeStore()
const draftQuestion = ref('')
const messageId = ref(1)
const assistantScrollbarRef = ref<ScrollbarInstance>()
const createInitialMessages = (): AssistantTimelineItem[] => [
  {
    id: 1,
    kind: 'message',
    role: 'assistant',
    content: '可以問我收入成長、月份變化、收入結構、集中風險或保守預估，我會依你的收入摘要回覆分析。',
  },
]
const messages = ref<AssistantTimelineItem[]>(createInitialMessages())

const canSubmit = computed(() => draftQuestion.value.trim().length > 0)

const canCreateNewTopic = computed(() => {
  let latestDividerIndex = -1

  for (let index = messages.value.length - 1; index >= 0; index -= 1) {
    if (messages.value[index].kind === 'divider') {
      latestDividerIndex = index
      break
    }
  }

  const currentTopicItems = messages.value.slice(latestDividerIndex + 1)

  return currentTopicItems.some((item) => item.kind === 'message' && item.role === 'user')
})

const nextMessageId = () => {
  messageId.value += 1
  return messageId.value
}

const scrollToBottom = async () => {
  await nextTick()
  const scrollbar = assistantScrollbarRef.value
  const wrap = scrollbar?.wrapRef

  if (!scrollbar || !wrap) {
    return
  }

  scrollbar.setScrollTop(wrap.scrollHeight)
}

const renderAssistantContent = (content: string) => markdownRenderer.render(content)

const incomeEntries = computed(() => incomeStore.dailyLists.flatMap((group) => group.items))

const resolveAssistantReply = (replyMessageId: number, content: string) => {
  const replyMessage = messages.value.find(
    (item): item is AssistantMessage => item.kind === 'message' && item.id === replyMessageId,
  )

  if (!replyMessage) {
    return
  }

  replyMessage.content = content
  replyMessage.isPending = false
  scrollToBottom()
}

const createNewTopic = () => {
  if (!canCreateNewTopic.value) {
    return
  }

  draftQuestion.value = ''
  messages.value.push(
    {
      id: nextMessageId(),
      kind: 'divider',
      label: '新話題',
    },
    {
      id: nextMessageId(),
      kind: 'quickQuestions',
    },
  )
  scrollToBottom()
}

const submitQuestion = async (selectedQuestion = '') => {
  const question = (selectedQuestion || draftQuestion.value).trim()

  if (!question) {
    return
  }

  messages.value.push({
    id: nextMessageId(),
    kind: 'message',
    role: 'user',
    content: question,
  })
  const replyMessageId = nextMessageId()
  messages.value.push({
    id: replyMessageId,
    kind: 'message',
    role: 'assistant',
    content: '',
    isPending: true,
  })
  if (!selectedQuestion) {
    draftQuestion.value = ''
  }
  scrollToBottom()

  try {
    const reply = await askIncomeAssistant({ question, entries: incomeEntries.value })
    resolveAssistantReply(replyMessageId, reply)
  } catch {
    resolveAssistantReply(replyMessageId, assistantErrorReply)
  }
}

onBeforeUnmount(() => {
  messages.value.forEach((item) => {
    if (item.kind === 'message' && item.isPending) {
      item.content = assistantErrorReply
      item.isPending = false
    }
  })
})
</script>

<style scoped lang="scss">
:global(.ai-assistant-dialog) {
  --assistant-composer-height: 100px;

  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  margin: 0;
  border-radius: 0;
  overflow: hidden;
}

:global(.ai-assistant-dialog .el-dialog__body) {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.assistant-shell {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  height: 100%;
  padding-bottom: calc(
    var(--assistant-composer-height) + env(safe-area-inset-bottom) - var(--el-dialog-padding-primary)
  );
}

.assistant-scroll {
  flex: 1;
  min-height: 0;
}

:deep(.assistant-scroll .el-scrollbar__bar) {
  display: none;
}

.assistant-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  // padding: 12px 16px 16px;
}

.message-list {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-question-button {
  --el-button-bg-color: var(--el-color-primary-light-9);
  --el-button-border-color: var(--el-color-primary-light-7);
  --el-button-text-color: var(--el-color-primary-dark-2);
  --el-button-hover-bg-color: var(--el-color-primary-light-8);
  --el-button-hover-border-color: var(--el-color-primary-light-5);
  --el-button-hover-text-color: var(--el-color-primary-dark-2);
}

.message-row {
  display: flex;

  &.is-user {
    justify-content: flex-end;
  }
}

.message-bubble {
  max-width: min(78%, 560px);
  padding: 4px 12px;
  border: 1px solid var(--glass-border-soft);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
  color: #1f2937;
  line-height: 1.55;
  white-space: pre-wrap;
}

.message-markdown {
  white-space: normal;
}

.message-markdown :deep(p) {
  margin: 0 0 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.message-markdown :deep(ul),
.message-markdown :deep(ol) {
  margin: 6px 0 8px;
  padding-left: 20px;
}

.message-markdown :deep(li) {
  margin: 4px 0;
}

.message-markdown :deep(h1),
.message-markdown :deep(h2),
.message-markdown :deep(h3) {
  margin: 4px 0 8px;
  color: #111827;
  font-size: 14px;
  line-height: 1.45;
}

.message-markdown :deep(strong) {
  color: #111827;
  font-weight: 700;
}

.message-markdown :deep(code) {
  padding: 1px 5px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.08);
  color: #111827;
  font-size: 0.92em;
}

.message-markdown :deep(pre) {
  margin: 8px 0;
  padding: 8px 10px;
  overflow-x: auto;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.08);
}

.message-markdown :deep(pre code) {
  padding: 0;
  background: transparent;
}

.message-bubble.is-pending {
  min-width: 58px;
  padding: 8px 12px;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 14px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
  opacity: 0.35;
  animation: typing-bounce 1s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.16s;
  }

  &:nth-child(3) {
    animation-delay: 0.32s;
  }
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }

  40% {
    transform: translateY(-3px);
    opacity: 0.9;
  }
}

.message-row.is-user .message-bubble {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.14);
}

.topic-divider {
  margin: 16px 0 12px;
}

:deep(.topic-divider .el-divider__text) {
  color: var(--el-color-primary);
  font-weight: 700;
}

.assistant-composer {
  position: fixed;
  right: 0;
  bottom: env(safe-area-inset-bottom);
  left: 0;
  z-index: 1;
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  height: var(--assistant-composer-height);
  padding: 12px 16px;
  border-top: 1px solid var(--glass-border-soft);
  background: rgba(255, 255, 255, 0.58);
  box-shadow: 0 -12px 24px rgba(15, 23, 42, 0.08);
}

.assistant-composer-actions {
  display: flex;
  min-width: 0;
}

.assistant-submit-button {
  flex: auto;
}

@media (max-width: 520px) {
  .assistant-composer {
    grid-template-columns: 1fr;
  }

  .assistant-composer-actions {
    width: 100%;
  }

  .message-bubble {
    max-width: 88%;
  }
}
</style>