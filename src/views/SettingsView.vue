<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const userEmail = computed(() => authStore.user?.email ?? '未登入')
const userRole = computed(() => authStore.role?.trim().toLowerCase() || 'user')
</script>

<template>
  <section class="panel">
    <h2>個人設定</h2>
    <el-descriptions :column="1" border>
      <el-descriptions-item label="Email">{{ userEmail }}</el-descriptions-item>
      <el-descriptions-item label="角色">{{ userRole }}</el-descriptions-item>
    </el-descriptions>
  </section>
</template>