<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const activeTab = ref<'login' | 'register'>('login')
const EMAIL_HISTORY_KEY = 'incomehub.email.history'
const MAX_EMAIL_HISTORY = 8

const form = reactive({
  email: '',
  password: '',
})

const emailHistory = ref<string[]>([])

const loadEmailHistory = () => {
  try {
    const raw = localStorage.getItem(EMAIL_HISTORY_KEY)
    if (!raw) return

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return

    emailHistory.value = parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, MAX_EMAIL_HISTORY)
  } catch {
    emailHistory.value = []
  }
}

const saveEmailToHistory = (email: string) => {
  const normalizedEmail = email.trim()
  if (!normalizedEmail) return

  const nextHistory = [
    normalizedEmail,
    ...emailHistory.value.filter((item) => item.toLowerCase() !== normalizedEmail.toLowerCase()),
  ].slice(0, MAX_EMAIL_HISTORY)

  emailHistory.value = nextHistory
  localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(nextHistory))
}

const queryEmailHistory = (
  queryString: string,
  callback: (results: Array<{ value: string }>) => void,
) => {
  const keyword = queryString.trim().toLowerCase()
  const results = emailHistory.value
    .filter((item) => !keyword || item.toLowerCase().includes(keyword))
    .map((item) => ({ value: item }))

  callback(results)
}

const handleLogin = async () => {
  if (!form.email || !form.password) {
    ElMessage.warning('請輸入 Email 與密碼')
    return
  }

  try {
    await authStore.signInWithEmail(form.email, form.password)
    saveEmailToHistory(form.email)
    ElMessage.success('登入成功')
    router.push('/home')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登入失敗，請稍後再試')
  }
}

const handleRegister = async () => {
  if (!form.email || !form.password) {
    ElMessage.warning('請輸入 Email 與密碼')
    return
  }

  try {
    await authStore.signUpWithEmail(form.email, form.password)
    saveEmailToHistory(form.email)
    ElMessage.success('註冊成功，請使用相同帳號登入')
    activeTab.value = 'login'
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '註冊失敗，請稍後再試')
  }
}

onMounted(() => {
  loadEmailHistory()
})
</script>

<template>
  <main class="auth-page">
    <el-card shadow="hover" style="width: min(92vw, 420px)">
      <template #header>
        <el-space direction="vertical" fill>
          <h2 style="margin: 0">登入 IncomeHub</h2>
          <span style="color: var(--el-text-color-secondary)">登入後才可讀取你的收入資料</span>
        </el-space>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="登入" name="login" />
        <el-tab-pane label="註冊" name="register" />
      </el-tabs>

      <el-form label-position="top">
        <el-form-item label="Email">
          <el-autocomplete
            v-model="form.email"
            :fetch-suggestions="queryEmailHistory"
            trigger-on-focus
            clearable
            placeholder="you@example.com"
            autocomplete="email"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="密碼">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="至少 6 碼"
            autocomplete="current-password"
          />
        </el-form-item>

        <el-button
          v-if="activeTab === 'login'"
          type="primary"
          style="width: 100%"
          :loading="authStore.loading"
          @click="handleLogin"
        >
          登入
        </el-button>

        <el-button
          v-else
          type="success"
          style="width: 100%"
          :loading="authStore.loading"
          @click="handleRegister"
        >
          註冊
        </el-button>
      </el-form>
    </el-card>
  </main>
</template>

<style scoped lang="scss">
.auth-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: transparent;
}

:deep(.el-card) {
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(255, 255, 255, 0.62);
  box-shadow: 0 22px 38px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(20px) saturate(165%);
  -webkit-backdrop-filter: blur(20px) saturate(165%);
}
</style>