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
        <img :src="hubIconSrc" alt="IncomeHub" />
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
import hubIconSrc from '../../assets/hub-icon.svg'

const route = useRoute()
const router = useRouter()
</script>

<style scoped lang="scss">
.bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-sizing: content-box;
  height: 52px;
  margin: 0;
  padding: 0 8px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.5) 100%);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-top-color: rgba(255, 255, 255, 0.82);
  box-shadow: 0 -2px 0 rgba(255, 255, 255, 0.56) inset, 0 14px 30px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(20px) saturate(185%);
  -webkit-backdrop-filter: blur(20px) saturate(185%);
  flex-shrink: 0;
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
  border-radius: 14px;
  transition: color 0.2s ease, background-color 0.2s ease;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  overflow: visible;
}

.hub-btn {
  width: 56px;
  height: 56px;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(140deg, #0ea5a4 0%, #0b6e65 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 22px rgba(11, 110, 101, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.34);
  transition: transform 0.15s, box-shadow 0.15s;
  margin-top: -16px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  padding: 0;

  img {
    border-radius: 50%;
    display: block;
    width: 56px;
    height: 56px;
  }

  &.active {
    box-shadow: 0 14px 25px rgba(11, 110, 101, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.4);
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
