<template>
  <PanelSection title="收入列表" :tag="editMode ? '編輯模式' : ''">
    <template #actions>
      <el-tag round effect="light" size="small" type="info">{{ dailyLists.length }} 天</el-tag>
      <el-switch v-model="editMode" class="list-mode-switch" />
    </template>
    <DailyIncomeList :edit-mode="editMode" />
  </PanelSection>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DailyIncomeList from '../components/income/DailyIncomeList.vue'
import PanelSection from '../components/layout/PanelSection.vue'
import { useIncomeEntries } from '../composables/useIncomeEntries'

const editMode = ref(false)
const { dailyLists } = useIncomeEntries()
</script>

<style scoped lang="scss">
:deep(.list-mode-switch .el-switch__core) {
  background: rgba(255, 255, 255, 0.42);
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.56), 0 1px 2px rgba(15, 23, 42, 0.08);
}

:deep(.list-mode-switch .el-switch__action) {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.42);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
}

:deep(.list-mode-switch.is-checked .el-switch__core) {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

:deep(.list-mode-switch.is-checked .el-switch__action) {
  border-color: rgba(255, 255, 255, 0.78);
}
</style>
