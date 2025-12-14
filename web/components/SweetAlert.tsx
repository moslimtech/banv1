'use client'

import Swal from 'sweetalert2'

export const showSuccess = (message: string) => {
  return Swal.fire({
    icon: 'success',
    title: 'نجح!',
    text: message,
    confirmButtonText: 'حسناً',
    confirmButtonColor: '#10b981',
  })
}

export const showError = (message: string) => {
  return Swal.fire({
    icon: 'error',
    title: 'خطأ!',
    text: message,
    confirmButtonText: 'حسناً',
    confirmButtonColor: '#ef4444',
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
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
  })
}

export const showLoading = (message: string = 'جاري التحميل...') => {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading()
    },
  })
}

export const closeLoading = () => {
  Swal.close()
}
