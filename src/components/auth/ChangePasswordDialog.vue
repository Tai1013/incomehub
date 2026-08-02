<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改密碼"
    width="320"
    center
    align-center
    append-to-body
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formModel"
      :rules="rules"
      :show-message="true"
      label-position="top"
    >
      <el-form-item label="舊密碼" prop="oldPassword">
        <el-input
          v-model="formModel.oldPassword"
          type="password"
          show-password
          placeholder="請輸入舊密碼"
        />
      </el-form-item>

      <el-form-item label="新密碼" prop="newPassword">
        <el-input
          v-model="formModel.newPassword"
          type="password"
          show-password
          placeholder="請輸入新密碼（至少 6 位）"
        />
      </el-form-item>

      <el-form-item label="確認新密碼" prop="confirmPassword">
        <el-input
          v-model="formModel.confirmPassword"
          type="password"
          show-password
          placeholder="請再次輸入新密碼"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">確認修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { changePassword } from '../../services/auth'

const dialogVisible = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const formModel = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validateConfirm = (_rule: unknown, value: string, callback: (e?: Error) => void) => {
  if (value !== formModel.newPassword) {
    callback(new Error('兩次輸入的密碼不一致'))
  } else {
    callback()
  }
}

const validateNewPassword = (_rule: unknown, value: string, callback: (e?: Error) => void) => {
  if (value && formModel.oldPassword && value === formModel.oldPassword) {
    callback(new Error('新密碼不能與舊密碼相同'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  oldPassword: [{ required: true, message: '請輸入舊密碼', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '請輸入新密碼', trigger: 'blur' },
    { min: 6, message: '密碼至少 6 個字元', trigger: 'blur' },
    { validator: validateNewPassword, trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '請確認新密碼', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const email = authStore.user?.email
  if (!email) return

  loading.value = true
  try {
    await changePassword(email, formModel.oldPassword, formModel.newPassword)
    ElMessage.success('密碼修改成功')
    dialogVisible.value = false
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'same_password') {
      ElMessage.error('新密碼不能與舊密碼相同')
    } else {
      const msg = err instanceof Error ? err.message : '修改失敗，請稍後再試'
      ElMessage.error(msg)
    }
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
}
</script>
