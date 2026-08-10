<template>
  <el-dialog
    v-model="dialogVisible"
    width="320"
    center
    align-center
    class="income-dialog"
    @closed="resetForm"
  >
    <section class="dialog-content">
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="rules"
        :show-message="false"
        class="income-form"
        label-position="top"
      >
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="formModel.date"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            placeholder="請選擇日期"
            class="field-control"
            :editable="false"
          />
        </el-form-item>

        <el-form-item label="分類" prop="type">
          <div class="type-grid">
            <el-button
              v-for="o in INCOME_TYPE_OPTIONS"
              :key="o.value"
              type="default"
              class="type-tile"
              :class="{ 'is-active': formModel.type === o.value }"
              plain
              @click="formModel.type = o.value"
            >
              <span class="type-tile-content">
                <el-icon class="type-tile-icon">
                  <component :is="o.icon" />
                </el-icon>
                <div class="type-tile-label">{{ o.label }}</div>
              </span>
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="金額" prop="amount" class="amount-form-item">
          <section class="amount-entry-block">
            <el-input
              v-model="formattedAmount"
              inputmode="numeric"
              placeholder="請輸入金額"
              class="amount-input"
            >
              <template #prepend>NT$</template>
            </el-input>

            <div class="keypad-grid">
              <el-button
                v-for="key in keypadKeys"
                :key="key"
                type="default"
                class="keypad-key"
                @click="handleKeypadPress(key)"
              >
                {{ key }}
              </el-button>
            </div>
          </section>
        </el-form-item>
      </el-form>

      <el-form
        ref="descFormRef"
        :model="formModel"
        label-position="top"
        class="income-form"
      >
        <el-form-item label="說明" prop="description">
          <el-input
            v-model="formModel.description"
            type="textarea"
            :rows="3"
            maxlength="100"
            show-word-limit
            resize="none"
            placeholder="補充這筆收入的來源或備註"
          />
        </el-form-item>
      </el-form>

      <el-space class="action-buttons" :class="{ 'is-editing': isEditing }">
        <el-button type="primary" class="submit-button" @click="submitIncome()">{{ submitButtonText }}</el-button>
        <el-button v-if="!isEditing" class="submit-button" @click="submitIncome(true)">連續新增</el-button>
      </el-space>
    </section>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useIncomeStore } from '../../stores/income'
import { INCOME_TYPE_OPTIONS, INCOME_TYPES } from '../../configs/constant'
import type { IncomeEntry, IncomeType } from '../../types/income'
import { storeToRefs } from 'pinia'

const formRef = ref<FormInstance>()
const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'] as const
const amountInput = ref('')
const getTodayDate = () => dayjs().format('YYYY-MM-DD')

const formModel = reactive({
  date: getTodayDate(),
  type: INCOME_TYPES[0] as IncomeType,
  amount: null as number | null,
  description: '',
})

const rules: FormRules<typeof formModel> = {
  date: [{ required: true, message: '請先選擇日期', trigger: 'change' }],
  type: [{ required: true, message: '請先選擇分類', trigger: 'change' }],
  amount: [
    { required: true, message: '請輸入有效金額', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value || Number(value) <= 0) {
          callback(new Error('請輸入有效金額'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

const incomeStore = useIncomeStore()
const { editingEntry } = storeToRefs(incomeStore)
const isEditing = computed(() => Boolean(editingEntry.value))
const submitButtonText = computed(() => (isEditing.value ? '儲存' : '新增'))

const dialogVisible = computed({
  get: () => incomeStore.dialogVisible,
  set: (value: boolean) => {
    if (value) {
      incomeStore.dialogVisible = true
      return
    }

    incomeStore.closeDialog()
  },
})

const parsedAmount = computed(() => Number(amountInput.value || '0'))
const formattedAmount = computed({
  get: () => (amountInput.value ? Number(amountInput.value).toLocaleString('zh-TW') : ''),
  set: (value: string) => {
    const normalized = value.replace(/\D/g, '').slice(0, 9)
    amountInput.value = normalized
    formModel.amount = normalized ? Number(normalized) : null
  },
})

const appendAmount = (digit: string) => {
  if (amountInput.value.length >= 9) {
    return
  }

  if (amountInput.value === '0') {
    amountInput.value = digit
    formModel.amount = Number(amountInput.value)
    return
  }

  amountInput.value += digit
  formModel.amount = Number(amountInput.value)
}

const handleKeypadPress = (key: string) => {
  if (key === 'C') {
    clearAmount()
    return
  }

  if (key === '←') {
    backspaceAmount()
    return
  }

  appendAmount(key)
}

const clearAmount = () => {
  amountInput.value = ''
  formModel.amount = null
}

const backspaceAmount = () => {
  amountInput.value = amountInput.value.slice(0, -1)
  formModel.amount = amountInput.value ? Number(amountInput.value) : null
}

const resetForm = () => {
  formModel.date = getTodayDate()
  formModel.type = INCOME_TYPES[0] as IncomeType
  formModel.description = ''
  clearAmount()
  formRef.value?.clearValidate()
}

const applyEntryToForm = (entry: IncomeEntry) => {
  formModel.date = entry.date
  formModel.type = entry.type
  amountInput.value = String(entry.amount)
  formModel.amount = entry.amount
  formModel.description = entry.description ?? ''
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const resetForContinuousEntry = () => {
  formModel.type = INCOME_TYPES[0] as IncomeType
  formModel.description = ''
  clearAmount()
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const submitIncome = async (keepOpen = false) => {
  if (!formRef.value) {
    return
  }

  if (!formModel.date) {
    await formRef.value.validateField('date').catch(() => {})
    ElMessage.warning('請先選擇日期')
    return
  }

  if (!formModel.type) {
    await formRef.value.validateField('type').catch(() => {})
    ElMessage.warning('請先選擇分類')
    return
  }

  if (parsedAmount.value <= 0) {
    await formRef.value.validateField('amount').catch(() => {})
    ElMessage.warning('請輸入有效金額')
    return
  }

  if (editingEntry.value) {
    try {
      const updated = await incomeStore.updateEntry(editingEntry.value.date, editingEntry.value.id, {
        date: formModel.date,
        type: formModel.type,
        amount: parsedAmount.value,
        description: formModel.description,
      })

      if (!updated) {
        ElMessage.warning('找不到要修改的收入資料')
        return
      }

      ElMessage.success('修改成功')
      dialogVisible.value = false
      return
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '修改失敗，請稍後再試')
      return
    }
  }

  try {
    await incomeStore.addEntry({
      date: formModel.date,
      type: formModel.type,
      amount: parsedAmount.value,
      description: formModel.description,
    })

    ElMessage.success('新增成功')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '新增失敗，請稍後再試')
    return
  }

  if (keepOpen) {
    resetForContinuousEntry()
    return
  }

  dialogVisible.value = false
}

watch(
  () => [incomeStore.dialogVisible, editingEntry.value] as const,
  ([visible, editingEntry]) => {
    if (!visible) {
      return
    }

    if (editingEntry) {
      applyEntryToForm(editingEntry)
      return
    }

    resetForm()
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
:deep(.el-dialog__body) {
  padding-top: 20px;
  padding-bottom: 20px;
}

:deep(.field-control.el-date-editor.el-input) {
  width: 100%;
}

.type-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.type-tile {
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 64px;
  padding: 8px 4px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.56);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.52);
  color: var(--el-text-color-regular);
  margin: 0;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

:deep(.type-tile .el-button__text) {
  width: 100%;
  display: flex;
  justify-content: center;
}

.type-tile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

@media (hover: hover) {
  .type-tile:hover {
    border-color: var(--el-color-primary-light-5);
  }
}

.type-tile.is-active {
  border-color: var(--el-color-primary);
  background: rgba(254, 243, 224, 0.82);
  color: var(--el-color-primary);
}

.type-tile-icon {
  font-size: 18px;
}

.type-tile-label {
  width: 100%;
  margin: 0;
  padding: 0;
  font-size: 13px;
  line-height: 1.2;
  text-align: center;
}

:deep(.amount-form-item .el-form-item__content) {
  display: block;
}

.amount-entry-block {
  width: 100%;
  display: grid;
  gap: 0;
}

:deep(.amount-input .el-input__inner) {
  text-align: right;
}

:deep(.amount-input .el-input__wrapper) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

:deep(.amount-input .el-input-group__prepend) {
  border-bottom-left-radius: 0;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin-top: 0;
  margin-bottom: 0;
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-top: 0;
  border-radius: 0 0 16px 16px;
  background: rgba(255, 255, 255, 0.64);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.keypad-key {
  width: 100%;
  border-radius: 0;
  margin: 0;
}

:deep(.keypad-grid .el-button + .el-button) {
  margin-left: 0;
}

:deep(.keypad-key.el-button) {
  border-radius: 0;
  border: 0;
  background: transparent;
}

:deep(.keypad-grid .keypad-key:nth-child(3n + 2).el-button),
:deep(.keypad-grid .keypad-key:nth-child(3n + 3).el-button) {
  border-left: 1px solid var(--el-border-color);
}

:deep(.keypad-grid .keypad-key:nth-child(n + 4).el-button) {
  border-top: 1px solid var(--el-border-color);
}

:deep(.el-textarea .el-input__count) {
  background: transparent;
  box-shadow: none;
}

.action-buttons {
  width: 100%;

  :deep(.el-space__item) {
    width: calc(50% - 4px);
  }
}

.action-buttons.is-editing {
  :deep(.el-space__item) {
    width: 100%;
  }
}
</style>