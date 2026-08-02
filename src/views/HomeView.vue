<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userEmail = computed(() => authStore.user?.email ?? '未登入')

const goTo = (path: '/list' | '/data') => {
  router.push(path)
}
</script>

<template>
  <section class="panel brand-panel">
    <p class="eyebrow">incomehub</p>
    <h1>歡迎回來</h1>
    <p class="subtitle">目前登入：{{ userEmail }}</p>
  </section>

  <section class="panel">
    <h2>快速前往</h2>
    <el-space fill>
      <el-button type="primary" @click="goTo('/list')">收入列表</el-button>
      <el-button type="success" @click="goTo('/data')">數據分析</el-button>
    </el-space>
  </section>
</template>
