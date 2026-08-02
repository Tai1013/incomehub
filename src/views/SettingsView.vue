<template>
  <section class="panel">
    <h2>個人設定</h2>
    <el-descriptions :column="1" border>
      <el-descriptions-item label="Email">{{ userEmail }}</el-descriptions-item>
      <el-descriptions-item label="角色">{{ userRole }}</el-descriptions-item>
    </el-descriptions>

    <el-divider />

    <el-button type="primary" plain @click="showChangePassword = true">修改密碼</el-button>

    <ChangePasswordDialog v-model="showChangePassword" />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import ChangePasswordDialog from '../components/auth/ChangePasswordDialog.vue'

const authStore = useAuthStore()
const userEmail = computed(() => authStore.user?.email ?? '未登入')
const userRole = computed(() => authStore.role?.trim().toLowerCase() || 'user')
const showChangePassword = ref(false)
</script>