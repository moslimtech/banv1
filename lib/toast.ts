/**
 * Unified Toast Notification System
 * 
 * Provides consistent feedback across all user actions.
 * Wraps SweetAlert for now, can be replaced with any toast library.
 * 
 * Features:
 * - Success/Error/Warning/Info toasts
 * - Loading states
 * - Confirmation dialogs
 * - Consistent styling
 * 
 * Usage:
 * import { toast } from '@/lib/toast'
 * 
 * toast.success('تم الحفظ بنجاح')
 * toast.error('حدث خطأ')
 * const confirmed = await toast.confirm('هل أنت متأكد؟')
 */

import Swal from 'sweetalert2'

interface ToastOptions {
  title?: string
  message: string
  duration?: number
}

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'question' | 'info'
}

/**
 * Show success toast
 */
export function success(message: string, title?: string, duration: number = 3000) {
  return Swal.fire({
    icon: 'success',
    title: title || 'نجح',
    text: message,
    timer: duration,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
    timerProgressBar: true,
  })
}

/**
 * Show error toast
 */
export function error(message: string, title?: string) {
  return Swal.fire({
    icon: 'error',
    title: title || 'خطأ',
    text: message,
    confirmButtonText: 'حسناً',
    confirmButtonColor: 'var(--status-error)',
  })
}

/**
 * Show warning toast
 */
export function warning(message: string, title?: string) {
  return Swal.fire({
    icon: 'warning',
    title: title || 'تحذير',
    text: message,
    confirmButtonText: 'حسناً',
    confirmButtonColor: 'var(--status-warning)',
  })
}

/**
 * Show info toast
 */
export function info(message: string, title?: string, duration: number = 3000) {
  return Swal.fire({
    icon: 'info',
    title: title || 'معلومة',
    text: message,
    timer: duration,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
    timerProgressBar: true,
  })
}

/**
 * Show loading indicator
 */
export function loading(message: string = 'جاري التحميل...') {
  return Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading()
    },
  })
}

/**
 * Close any open toast/loading
 */
export function close() {
  return Swal.close()
}

/**
 * Show confirmation dialog
 */
export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const result = await Swal.fire({
    icon: options.type || 'question',
    title: options.title || 'تأكيد',
    text: options.message,
    showCancelButton: true,
    confirmButtonText: options.confirmText || 'نعم',
    cancelButtonText: options.cancelText || 'لا',
    confirmButtonColor: 'var(--primary-color)',
    cancelButtonColor: 'var(--border-color)',
    reverseButtons: true,
  })

  return result.isConfirmed
}

/**
 * Show delete confirmation (special case)
 */
export async function confirmDelete(itemName: string = 'هذا العنصر'): Promise<boolean> {
  return confirm({
    title: 'تأكيد الحذف',
    message: `هل أنت متأكد من حذف ${itemName}؟ لا يمكن التراجع عن هذا الإجراء.`,
    confirmText: 'نعم، احذف',
    cancelText: 'إلغاء',
    type: 'warning',
  })
}

/**
 * Unified toast object (matches common toast libraries)
 */
export const toast = {
  success,
  error,
  warning,
  info,
  loading,
  close,
  confirm,
  confirmDelete,
}

/**
 * Execute action with unified error handling and toast
 * 
 * Usage:
 * await withToast(
 *   async () => { await supabase.from('places').insert(data) },
 *   { successMessage: 'تم الحفظ', errorMessage: 'فشل الحفظ' }
 * )
 */
export async function withToast<T>(
  action: () => Promise<T>,
  options: {
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
    showSuccess?: boolean
    showError?: boolean
  } = {}
): Promise<T | null> {
  const {
    loadingMessage,
    successMessage,
    errorMessage,
    showSuccess = true,
    showError = true,
  } = options

  try {
    if (loadingMessage) {
      loading(loadingMessage)
    }

    const result = await action()

    if (loadingMessage) {
      close()
    }

    if (showSuccess && successMessage) {
      success(successMessage)
    }

    return result
  } catch (err: any) {
    if (loadingMessage) {
      close()
    }

    if (showError) {
      const message = errorMessage || err.message || 'حدث خطأ غير متوقع'
      error(message)
    }

    console.error('❌ [withToast] Error:', err)
    return null
  }
}
