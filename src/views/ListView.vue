<template>
  <PanelSection title="收入列表" :tag="editMode ? '編輯模式' : ''">
    <template #actions>
      <el-tag round effect="light" size="small" type="info">{{ dailyLists.length }} 天</el-tag>
      <el-switch v-model="editMode" />
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
