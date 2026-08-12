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
            title="目前先完成 UI，尚未串接 AI API。"
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
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { Plus, Promotion } from '@element-plus/icons-vue'
import type { ScrollbarInstance } from 'element-plus'

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
  '哪幾個月收入異常？',
  '如果扣掉年終，收入成長率還正常嗎？',
  '我的獎金佔比是不是太高？',
  '幫我用保守一點的方式估今年總收入',
]
const assistantReplyContent = '目前這裡會先保留為 UI 預覽。串接 AI 後，會用已整理好的收入摘要回答這個問題，並在免費額度用完時顯示提示。'
const assistantReplyDelay = 900

const draftQuestion = ref('')
const messageId = ref(1)
const assistantScrollbarRef = ref<ScrollbarInstance>()
const assistantReplyTimers = new Set<number>()
const createInitialMessages = (): AssistantTimelineItem[] => [
  {
    id: 1,
    kind: 'message',
    role: 'assistant',
    content: '可以問我收入成長、異常月份、獎金占比或保守預估。下一步串接 Gemini 後，會依你的收入摘要回覆分析。',
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

const resolveAssistantReply = (replyMessageId: number) => {
  const replyMessage = messages.value.find(
    (item): item is AssistantMessage => item.kind === 'message' && item.id === replyMessageId,
  )

  if (!replyMessage) {
    return
  }

  replyMessage.content = assistantReplyContent
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

const submitQuestion = (selectedQuestion = '') => {
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
  const replyTimer = window.setTimeout(() => {
    assistantReplyTimers.delete(replyTimer)
    resolveAssistantReply(replyMessageId)
  }, assistantReplyDelay)

  assistantReplyTimers.add(replyTimer)
  if (!selectedQuestion) {
    draftQuestion.value = ''
  }
  scrollToBottom()
}

onBeforeUnmount(() => {
  assistantReplyTimers.forEach((replyTimer) => window.clearTimeout(replyTimer))
  assistantReplyTimers.clear()
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