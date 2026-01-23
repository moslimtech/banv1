'use client'

import Swal from 'sweetalert2'

// M3 Golden Theme Colors
const M3_COLORS = {
  primary: '#D4AF37',    // Gold - Primary brand color
  success: '#10b981',    // Green - Success state
  error: '#ef4444',      // Red - Error state
  secondary: '#6b7280',  // Gray - Secondary actions
}

// M3 Custom Class for rounded corners
const M3_CLASS = 'swal2-show'

export const showSuccess = (message: string) => {
  return Swal.fire({
    icon: 'success',
    title: 'نجح!',
    text: message,
    confirmButtonText: 'حسناً',
    confirmButtonColor: M3_COLORS.primary, // Gold theme
    customClass: {
      popup: 'rounded-3xl', // M3 rounded
      confirmButton: 'rounded-full', // M3 button
    },
  })
}

export const showError = (message: string) => {
  return Swal.fire({
    icon: 'error',
    title: 'خطأ!',
    text: message,
    confirmButtonText: 'حسناً',
    confirmButtonColor: M3_COLORS.error,
    customClass: {
      popup: 'rounded-3xl',
      confirmButton: 'rounded-full',
    },
  })
}

export const showConfirm = (message: string) => {
  return Swal.fire({
    icon: 'question',
    title: 'تأكيد',
    text: message,
    showCancelButton: true,
    confirmButtonText: 'نعم',
    cancelButtonText: 'لا',
    confirmButtonColor: M3_COLORS.primary, // Gold for primary action
    cancelButtonColor: M3_COLORS.secondary,
    customClass: {
      popup: 'rounded-3xl',
      confirmButton: 'rounded-full',
      cancelButton: 'rounded-full',
    },
  })
}

export const showLoading = (message: string = 'جاري التحميل...') => {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: 'rounded-3xl',
    },
    didOpen: () => {
      Swal.showLoading()
    },
  })
}

export const closeLoading = () => {
  Swal.close()
}
