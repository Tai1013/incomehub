<template>
  <nav class="bottom-nav">
    <button
      class="nav-item"
      :class="{ active: route.path === '/list' }"
      @click="router.push('/list')"
    >
      <el-icon :size="22"><List /></el-icon>
      <span class="nav-label">收入列表</span>
    </button>

    <button class="nav-item nav-center" @click="router.push('/home')">
      <div class="hub-btn" :class="{ active: route.path === '/home' }">
        <img src="/hub-icon.svg" alt="IncomeHub" />
      </div>
    </button>

    <button
      class="nav-item"
      :class="{ active: route.path === '/data' }"
      @click="router.push('/data')"
    >
      <el-icon :size="22"><DataAnalysis /></el-icon>
      <span class="nav-label">數據分析</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { List, DataAnalysis } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
</script>

<style scoped lang="scss">
.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 52px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 -2px 12px rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;
  padding: 0;

  &.active {
    color: var(--el-color-primary);
  }
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

.nav-center {
  flex: 1.2;
  position: relative;
  gap: 2px;
}

.hub-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  transition: transform 0.15s, box-shadow 0.15s;
  margin-top: -20px;
  border: 4px solid white;
  padding: 2px;

  img {
    border-radius: 50%;
    display: block;
    width: 36px;
    height: 36px;
  }

  &.active {
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.55);
    transform: scale(1.06);
  }

  &:hover {
    transform: scale(1.06);
  }
}

.hub-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  background: linear-gradient(90deg, #c084fc, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  &.active {
    background: linear-gradient(90deg, #a855f7, #6366f1);
    -webkit-background-clip: text;
    background-clip: text;
  }
}
</style>
