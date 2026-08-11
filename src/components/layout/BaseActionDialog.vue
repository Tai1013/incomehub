<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :align-center="alignCenter"
    :show-close="showClose"
    center
    v-bind="$attrs"
  >
    <slot />

    <template #footer>
      <template v-for="button in footerButtonOrder" :key="button">
        <el-button v-if="button === 'cancel' && showCancelButton" @click="handleCancel">
          {{ cancelButtonText }}
        </el-button>

        <el-button
          v-else-if="button === 'confirm' && showConfirmButton"
          type="primary"
          :loading="confirmLoading"
          :disabled="confirmDisabled"
          @click="handleConfirm"
        >
          {{ confirmButtonText }}
        </el-button>

        <el-button
          v-else-if="button === 'secondaryConfirm' && showSecondaryConfirmButton"
          type="primary"
          plain
          :loading="secondaryConfirmLoading"
          :disabled="secondaryConfirmDisabled"
          @click="handleSecondaryConfirm"
        >
          {{ secondaryConfirmButtonText }}
        </el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

type FooterButtonKey = 'cancel' | 'confirm' | 'secondaryConfirm'

const dialogVisible = defineModel<boolean>({ default: false })

withDefaults(
  defineProps<{
    title?: string
    showCancelButton?: boolean
    showConfirmButton?: boolean
    cancelButtonText?: string
    confirmButtonText?: string
    confirmLoading?: boolean
    confirmDisabled?: boolean
    showSecondaryConfirmButton?: boolean
    secondaryConfirmButtonText?: string
    secondaryConfirmLoading?: boolean
    secondaryConfirmDisabled?: boolean
    footerButtonOrder?: FooterButtonKey[]
    width?: string
    closeOnClickModal?: boolean
    alignCenter?: boolean
    showClose?: boolean
  }>(),
  {
    title: '',
    showCancelButton: true,
    showConfirmButton: true,
    cancelButtonText: '取消',
    confirmButtonText: '確定',
    confirmLoading: false,
    confirmDisabled: false,
    showSecondaryConfirmButton: false,
    secondaryConfirmButtonText: '連續確認',
    secondaryConfirmLoading: false,
    secondaryConfirmDisabled: false,
    footerButtonOrder: () => ['cancel', 'confirm', 'secondaryConfirm'],
    width: 'min(280px, 95%)',
    closeOnClickModal: true,
    alignCenter: true,
    showClose: false,
  }
)

const emit = defineEmits<{
  cancel: []
  confirm: []
  secondaryConfirm: []
}>()

const handleCancel = () => {
  emit('cancel')
  dialogVisible.value = false
}

const handleConfirm = () => {
  emit('confirm')
}

const handleSecondaryConfirm = () => {
  emit('secondaryConfirm')
}
</script>
