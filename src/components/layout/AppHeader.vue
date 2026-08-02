<script setup lang="ts">
import { Setting, Plus } from '@element-plus/icons-vue'

defineEmits<{
  addIncome: []
}>()
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <el-button class="icon-button" :icon="Setting" aria-label="設定" circle />
    </div>

    <div class="header-center">
      <h1 class="app-title">INCOMEHUB</h1>
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
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
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
  color: var(--el-text-color-primary);
}

.icon-button {
  --el-button-size: 34px;

  @media (hover: hover) {
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}
</style>
