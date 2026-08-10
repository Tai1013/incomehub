<script setup lang="ts">
import { Menu, Plus } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

defineEmits<{
  addIncome: []
  openMenu: []
}>()

const goHome = () => {
  if (route.path !== '/home') {
    router.push('/home')
  }
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <el-button class="icon-button" :icon="Menu" aria-label="開啟選單" circle @click="$emit('openMenu')" />
    </div>

    <div class="header-center">
      <h1 class="app-title" role="button" tabindex="0" @click="goHome" @keydown.enter="goHome">INCOMEHUB</h1>
    </div>

    <div class="header-right">
      <el-button class="icon-button" :icon="Plus" aria-label="新增收入" circle @click="$emit('addIncome')" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.48);
  border-bottom: 1px solid rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(14px) saturate(165%);
  -webkit-backdrop-filter: blur(14px) saturate(165%);
}

.header-left,
.header-right {
  width: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-center {
  flex: 1;
  text-align: center;
}

.app-title {
  margin: 0;
  font-size: 13px;
  letter-spacing: 2px;
  font-weight: 700;
  color: #1f2937;
  cursor: pointer;
}

.icon-button {
  --el-button-size: 34px;
  --el-button-bg-color: rgba(255, 255, 255, 0.58);
  --el-button-border-color: rgba(255, 255, 255, 0.72);
  --el-button-text-color: #1f2937;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.66);
  --el-button-hover-border-color: rgba(255, 255, 255, 0.78);
  --el-button-active-bg-color: rgba(255, 255, 255, 0.72);
  --el-button-active-border-color: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(10px) saturate(170%);
  -webkit-backdrop-filter: blur(10px) saturate(170%);

  @media (hover: hover) {
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}
</style>
