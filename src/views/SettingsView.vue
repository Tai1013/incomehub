<template>
  <PanelSection title="個人設定">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="Email">{{ userEmail }}</el-descriptions-item>
      <el-descriptions-item label="角色">{{ userRole }}</el-descriptions-item>
    </el-descriptions>

    <el-divider />

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
      <el-button type="primary" native-type="submit" :loading="saving">儲存目標</el-button>
    </el-form>

    <el-divider />

    <el-button type="primary" plain @click="showChangePassword = true">修改密碼</el-button>

    <ChangePasswordDialog v-model="showChangePassword" />
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