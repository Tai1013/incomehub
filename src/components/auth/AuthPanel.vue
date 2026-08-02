<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const activeTab = ref<'login' | 'register'>('login')

const form = reactive({
  email: 'admin@incomehub.app',
  password: '',
})

const handleLogin = async () => {
  if (!form.email || !form.password) {
    ElMessage.warning('請輸入 Email 與密碼')
    return
  }

  try {
    await authStore.signInWithEmail(form.email, form.password)
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
    ElMessage.success('註冊成功，請使用相同帳號登入')
    activeTab.value = 'login'
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '註冊失敗，請稍後再試')
  }
}
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
          <el-input v-model="form.email" type="email" placeholder="you@example.com" autocomplete="email" />
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
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}
</style>