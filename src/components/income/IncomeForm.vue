<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useIncomeStore } from '../../stores/income'
import { incomeTypes } from '../../types/income'
import type { IncomeFormModel, IncomeType } from '../../types/income'

const formRef = ref()
const incomeStore = useIncomeStore()
const amountText = ref('')
const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←']

const form = reactive<IncomeFormModel>({
  date: getTodayDate(),
  type: '',
  amount: null,
})

const rules = {
  date: [{ required: true, message: '請選擇日期', trigger: 'change' }],
  type: [{ required: true, message: '請選擇收入類型', trigger: 'change' }],
  amount: [
    { required: true, message: '請輸入收入金額', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: number, callback: (error?: Error) => void) => {
        if (value <= 0) {
          callback(new Error('金額必須大於 0'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

function selectType(type: IncomeType) {
  form.type = type
}

function resetForm() {
  form.date = getTodayDate()
  form.type = ''
  form.amount = null
  amountText.value = ''
}

function inputDigit(digit: string) {
  if (amountText.value.length >= 9) {
    return
  }

  if (amountText.value === '0') {
    amountText.value = digit
  } else {
    amountText.value += digit
  }

  form.amount = Number(amountText.value)
}

function handleKeypadPress(key: string) {
  if (key === 'C') {
    clearAmount()
    return
  }

  if (key === '←') {
    backspaceAmount()
    return
  }

  inputDigit(key)
}

function backspaceAmount() {
  amountText.value = amountText.value.slice(0, -1)
  form.amount = amountText.value ? Number(amountText.value) : null
}

function clearAmount() {
  amountText.value = ''
  form.amount = null
}

function getDisplayAmount() {
  const amount = Number(amountText.value || '0')
  return new Intl.NumberFormat('zh-TW').format(amount)
}

async function submitEntry() {
  if (!formRef.value) {
    return
  }

  await formRef.value.validate((valid: boolean) => {
    if (!valid) {
      return
    }

    incomeStore.addEntry({
      date: form.date,
      type: form.type as IncomeType,
      amount: Number(form.amount),
    })

    ElMessage.success('新增收入成功')
    resetForm()
    formRef.value?.clearValidate()
  })
}

function getTodayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="income-form">
    <el-form-item label="日期" prop="date">
      <el-date-picker
        v-model="form.date"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="選擇日期"
        style="width: 100%"
        :editable="false"
      />
    </el-form-item>

    <el-form-item label="收入類型" prop="type">
      <div class="tag-group">
        <el-check-tag
          v-for="type in incomeTypes"
          :key="type"
          :checked="form.type === type"
          @change="selectType(type)"
        >
          {{ type }}
        </el-check-tag>
      </div>
    </el-form-item>

    <el-form-item label="收入金額" prop="amount">
      <div class="amount-box">
        <strong class="amount-value">NT$ {{ getDisplayAmount() }}</strong>
      </div>

      <div class="keypad-grid">
        <el-button
          v-for="key in keypadKeys"
          :key="key"
          class="keypad-btn"
          size="large"
          @click="handleKeypadPress(key)"
        >
          {{ key }}
        </el-button>
      </div>
    </el-form-item>

    <el-button type="primary" size="large" class="submit-btn" @click="submitEntry">新增收入</el-button>
  </el-form>
</template>
