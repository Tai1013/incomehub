import { ElMessageBox } from 'element-plus'

type ConfirmOptions = NonNullable<Parameters<typeof ElMessageBox.confirm>[2]>

const DEFAULT_CONFIRM_OPTIONS: Partial<ConfirmOptions> = {
  customStyle: { width: 'min(280px, 88vw)' },
  center: true,
  showClose: false,
  confirmButtonText: '確認',
  cancelButtonText: '取消',
}

export const openConfirm = (
  message: string,
  title = '提示',
  options: Partial<ConfirmOptions> = {}
) => ElMessageBox.confirm(message, title, { ...DEFAULT_CONFIRM_OPTIONS, ...options })
