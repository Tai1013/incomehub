<template>
  <PanelSection title="個人資訊">
    <el-space direction="vertical" fill :size="16" style="width: 100%;">
      <div class="glass-content">
        <el-space direction="vertical" fill :size="12" style="width: 100%;">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="Email">{{ userEmail }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ userRole }}</el-descriptions-item>
          </el-descriptions>
          <el-button type="primary" plain @click="showChangePassword = true">修改密碼</el-button>
        </el-space>
      </div>
    </el-space>

    <ChangePasswordDialog v-model="showChangePassword" />
  </PanelSection>

  <PanelSection title="分類管理" style="margin-top: 10px;">
    <template #actions>
      <el-button
        v-if="!isSorting"
        type="primary"
        plain
        size="small"
        @click="openSortMode"
      >
        開啟排序
      </el-button>
      <el-space v-else :size="8">
        <el-button size="small" @click="cancelSortMode">取消</el-button>
        <el-button type="primary" size="small" :loading="typesSaving" @click="confirmSortMode">確定</el-button>
      </el-space>
    </template>

    <div class="type-management-warning">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="調整分類不會改動既有收入分類。"
      />
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="排序會改變顯示順序，預設選第一分類。"
      />
    </div>

    <div class="glass-content">
      <el-space wrap :size="8">
        <div
          v-for="(config, index) in displayTypeConfigs"
          :key="`${config.label}-${index}`"
          class="type-item"
          :draggable="isSorting"
          @dragstart="onSortDragStart(index)"
          @dragover.prevent
          @drop="onSortDrop(index)"
          @dragend="onSortDragEnd"
        >
        <el-tag
          type="info"
          :closable="!isSorting"
          size="large"
          class="type-tag"
          :class="{ 'type-tag-sorting': isSorting }"
          @close="handleDeleteType(config)"
          @pointerdown="handleTypePointerDown(config)"
          @pointerup="handleTypePointerEnd"
          @pointerleave="handleTypePointerEnd"
          @pointercancel="handleTypePointerEnd"
        >
          <el-icon v-if="allIcons[config.icon]"><component :is="allIcons[config.icon]" /></el-icon>
          <span>{{ config.label }}</span>
        </el-tag>
        </div>
        <el-tag v-if="!isSorting" size="large" class="type-tag add-type-tag" @click="openAddDialog">
          <el-icon><Plus /></el-icon><span>新增分類</span>
        </el-tag>
      </el-space>
    </div>
  </PanelSection>

  <BaseActionDialog
    v-model="addDialogVisible"
    title="新增分類"
    :confirm-loading="typesSaving"
    :confirm-disabled="!newTypeForm.label.trim()"
    confirm-button-text="新增"
    @confirm="handleAddType"
  >
    <el-form :model="newTypeForm" label-position="top">
      <el-form-item label="分類名稱">
        <el-input v-model="newTypeForm.label" placeholder="例如 兼職收入" maxlength="20" show-word-limit />
      </el-form-item>
      <el-form-item label="選擇圖示" style="margin-bottom: 0;">
        <el-input v-model="iconSearch" placeholder="搜尋圖示名稱..." clearable style="margin-bottom: 8px;" />
        <div class="icon-grid">
          <div
            v-for="[name] in filteredIcons"
            :key="name"
            class="icon-item"
            :class="{ selected: newTypeForm.icon === name }"
            :title="name"
            @click="newTypeForm.icon = name"
          >
            <el-icon size="18"><component :is="allIcons[name]" /></el-icon>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </BaseActionDialog>

  <BaseActionDialog
    v-model="editDialogVisible"
    title="編輯分類"
    :confirm-loading="typesSaving"
    :confirm-disabled="!editTypeForm.label.trim()"
    confirm-button-text="儲存"
    @confirm="handleEditType"
  >
    <el-form :model="editTypeForm" label-position="top">
      <el-form-item label="分類名稱">
        <el-input v-model="editTypeForm.label" placeholder="例如 兼職收入" maxlength="20" show-word-limit />
      </el-form-item>
      <el-form-item label="選擇圖示" style="margin-bottom: 0;">
        <el-input v-model="editIconSearch" placeholder="搜尋圖示名稱..." clearable style="margin-bottom: 8px;" />
        <div class="icon-grid">
          <div
            v-for="[name] in filteredEditIcons"
            :key="name"
            class="icon-item"
            :class="{ selected: editTypeForm.icon === name }"
            :title="name"
            @click="editTypeForm.icon = name"
          >
            <el-icon size="18"><component :is="allIcons[name]" /></el-icon>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </BaseActionDialog>

  <PanelSection title="目標金額" style="margin-top: 10px;">
    <el-space direction="vertical" fill :size="12" style="width: 100%;">
      <div class="glass-content">
        <el-form label-position="top" @submit.prevent="saveTargets">
          <el-form-item label="每年目標金額">
            <el-input-number
              v-model="form.yearlyTarget"
              :min="0"
              :step="10000"
              :precision="0"
              style="width: 100%;"
              placeholder="未設定"
            />
          </el-form-item>
          <el-form-item label="每月目標金額">
            <el-input-number
              v-model="form.monthlyTarget"
              :min="0"
              :step="1000"
              :precision="0"
              style="width: 100%;"
              placeholder="未設定"
            />
          </el-form-item>
          <el-button type="primary" plain native-type="submit" :loading="saving" style="width: 100%;">儲存目標</el-button>
        </el-form>
      </div>
    </el-space>
  </PanelSection>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { Component } from 'vue'
import { useAuthStore } from '../stores/auth'
import { openConfirm } from '../services/messageBox'
import ChangePasswordDialog from '../components/auth/ChangePasswordDialog.vue'
import BaseActionDialog from '../components/layout/BaseActionDialog.vue'
import PanelSection from '../components/layout/PanelSection.vue'
import type { IncomeTypeConfig } from '../types/income'

const allIcons = ElementPlusIconsVue as Record<string, Component>

const authStore = useAuthStore()
const userEmail = computed(() => authStore.user?.email ?? '未登入')
const userRole = computed(() => authStore.role?.trim().toLowerCase() || 'user')
const showChangePassword = ref(false)
const saving = ref(false)
const typesSaving = ref(false)
const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const iconSearch = ref('')
const editIconSearch = ref('')
const editingOriginalLabel = ref('')
const longPressTimer = ref<number | null>(null)
const isSorting = ref(false)
const sortingTypeConfigs = ref<IncomeTypeConfig[]>([])
const sortDragSourceIndex = ref(-1)

const LONG_PRESS_MS = 500

const form = ref({
  yearlyTarget: authStore.yearlyTarget,
  monthlyTarget: authStore.monthlyTarget,
})

const newTypeForm = ref({ icon: '', label: '' })
const editTypeForm = ref({ icon: '', label: '' })

const displayTypeConfigs = computed(() => {
  return isSorting.value ? sortingTypeConfigs.value : authStore.incomeTypeConfigs
})

const filteredIcons = computed(() => {
  const entries = Object.entries(allIcons)
  if (!iconSearch.value.trim()) return entries
  const q = iconSearch.value.trim().toLowerCase()
  return entries.filter(([name]) => name.toLowerCase().includes(q))
})

const filteredEditIcons = computed(() => {
  const entries = Object.entries(allIcons)
  if (!editIconSearch.value.trim()) return entries
  const q = editIconSearch.value.trim().toLowerCase()
  return entries.filter(([name]) => name.toLowerCase().includes(q))
})

const openAddDialog = () => {
  newTypeForm.value = { icon: '', label: '' }
  iconSearch.value = ''
  addDialogVisible.value = true
}

const openSortMode = () => {
  clearLongPressTimer()
  sortingTypeConfigs.value = [...authStore.incomeTypeConfigs]
  sortDragSourceIndex.value = -1
  isSorting.value = true
}

const cancelSortMode = () => {
  sortDragSourceIndex.value = -1
  sortingTypeConfigs.value = []
  isSorting.value = false
}

const confirmSortMode = async () => {
  typesSaving.value = true
  try {
    await authStore.updateIncomeTypeConfigs([...sortingTypeConfigs.value])
    ElMessage.success('分類排序已更新')
    cancelSortMode()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err))
  } finally {
    typesSaving.value = false
  }
}

const openEditDialog = (config: IncomeTypeConfig) => {
  editingOriginalLabel.value = config.label
  editTypeForm.value = {
    icon: config.icon,
    label: config.label,
  }
  editIconSearch.value = ''
  editDialogVisible.value = true
}

const clearLongPressTimer = () => {
  if (longPressTimer.value == null) {
    return
  }

  window.clearTimeout(longPressTimer.value)
  longPressTimer.value = null
}

const onTypePressStart = (config: IncomeTypeConfig) => {
  clearLongPressTimer()
  longPressTimer.value = window.setTimeout(() => {
    openEditDialog(config)
    clearLongPressTimer()
  }, LONG_PRESS_MS)
}

const onTypePressEnd = () => {
  clearLongPressTimer()
}

const handleTypePointerDown = (config: IncomeTypeConfig) => {
  if (isSorting.value) {
    return
  }

  onTypePressStart(config)
}

const handleTypePointerEnd = () => {
  if (isSorting.value) {
    return
  }

  onTypePressEnd()
}

const onSortDragStart = (index: number) => {
  if (!isSorting.value) {
    return
  }

  sortDragSourceIndex.value = index
}

const onSortDrop = (targetIndex: number) => {
  if (!isSorting.value) {
    return
  }

  const sourceIndex = sortDragSourceIndex.value
  if (sourceIndex < 0 || sourceIndex === targetIndex) {
    return
  }

  const next = [...sortingTypeConfigs.value]
  const [moved] = next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, moved)
  sortingTypeConfigs.value = next
  sortDragSourceIndex.value = targetIndex
}

const onSortDragEnd = () => {
  sortDragSourceIndex.value = -1
}

watch(
  () => [authStore.yearlyTarget, authStore.monthlyTarget],
  ([yearly, monthly]) => {
    form.value.yearlyTarget = yearly
    form.value.monthlyTarget = monthly
  }
)

const saveTargets = async () => {
  saving.value = true
  try {
    await authStore.updateTargets(form.value.yearlyTarget, form.value.monthlyTarget)
    ElMessage.success('目標已儲存')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err))
  } finally {
    saving.value = false
  }
}

const handleAddType = async () => {
  const label = newTypeForm.value.label.trim()
  const icon = newTypeForm.value.icon.trim()
  if (!label) return

  const exists = authStore.incomeTypeConfigs.some(c => c.label === label)
  if (exists) {
    ElMessage.warning(`分類「${label}」已存在`)
    return
  }

  typesSaving.value = true
  try {
    const next: IncomeTypeConfig[] = [...authStore.incomeTypeConfigs, { icon, label }]
    await authStore.updateIncomeTypeConfigs(next)
    newTypeForm.value = { icon: '', label: '' }
    addDialogVisible.value = false
    ElMessage.success('分類已新增')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err))
  } finally {
    typesSaving.value = false
  }
}

const handleEditType = async () => {
  const label = editTypeForm.value.label.trim()
  const icon = editTypeForm.value.icon.trim()
  if (!label) return

  const originalLabel = editingOriginalLabel.value
  const exists = authStore.incomeTypeConfigs.some(c => c.label === label && c.label !== originalLabel)
  if (exists) {
    ElMessage.warning(`分類「${label}」已存在`)
    return
  }

  typesSaving.value = true
  try {
    const next: IncomeTypeConfig[] = authStore.incomeTypeConfigs.map((config) => {
      if (config.label !== originalLabel) {
        return config
      }

      return {
        icon,
        label,
      }
    })

    await authStore.updateIncomeTypeConfigs(next)
    editDialogVisible.value = false
    ElMessage.success('分類已更新')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : String(err))
  } finally {
    typesSaving.value = false
  }
}

const handleDeleteType = async (config: IncomeTypeConfig) => {
  try {
    await openConfirm(
      `確定要刪除「${config.label}」分類？`,
      '刪除分類',
      {
        confirmButtonText: '刪除',
        beforeClose: async (action, instance, done) => {
          if (action !== 'confirm') {
            done()
            return
          }
          instance.confirmButtonLoading = true
          try {
            const next = authStore.incomeTypeConfigs.filter(c => c.label !== config.label)
            await authStore.updateIncomeTypeConfigs(next)
            ElMessage.success('分類已刪除')
            done()
          } catch (err) {
            ElMessage.error(err instanceof Error ? err.message : String(err))
            instance.confirmButtonLoading = false
          }
        },
      }
    )
  } catch {
    // 取消
  }
}</script>

<style scoped lang="scss">
.glass-content {
  width: 100%;
  padding: 16px;
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  background: var(--glass-tint-strong);
  box-shadow: var(--glass-shadow-soft), var(--glass-highlight);
  backdrop-filter: blur(var(--glass-blur)) saturate(175%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(175%);
}

.glass-content :deep(.el-descriptions__body) {
  border-radius: 12px;
  overflow: hidden;
}

.glass-content :deep(.el-input-number) {
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 16px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
}

.glass-content :deep(.el-input-number .el-input__wrapper) {
  box-shadow: none;
  background: rgba(255, 255, 255, 0.42);
}

.add-type-tag {
  cursor: pointer;
  border-style: dashed;
}

.type-management-warning {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}

.type-item {
  display: inline-flex;
}

.type-tag-sorting {
  cursor: move;
}

.type-tag {
  :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
  padding: 4px;
}

.icon-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: var(--el-fill-color);
  }

  &.selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}
</style>