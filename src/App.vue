<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useLoading } from './composables/useLoading'

const authStore = useAuthStore()
const { isLoading } = useLoading()
authStore.initAuth()
</script>

<template>
  <section
    v-loading="!authStore.ready || isLoading > 0"
    element-loading-text="載入中..."
    element-loading-background="rgba(255, 255, 255, 0.7)"
    style="min-height: 100vh"
  >
    <RouterView />
  </section>
</template>
