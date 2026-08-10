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
import { useAuthStore } from '../stores/auth'
import ChangePasswordDialog from '../components/auth/ChangePasswordDialog.vue'
import PanelSection from '../components/layout/PanelSection.vue'

const authStore = useAuthStore()
const userEmail = computed(() => authStore.user?.email ?? '未登入')
const userRole = computed(() => authStore.role?.trim().toLowerCase() || 'user')
const showChangePassword = ref(false)
const saving = ref(false)

const form = ref({
  yearlyTarget: authStore.yearlyTarget,
  monthlyTarget: authStore.monthlyTarget,
})

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
</script>

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
</style>