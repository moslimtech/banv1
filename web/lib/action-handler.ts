/**
 * Unified Action Handler Pattern
 * 
 * Provides a consistent pattern for all CRUD operations in hooks.
 * 
 * Pattern:
 * 1. Set loading state
 * 2. Execute Supabase call
 * 3. Show success/error toast
 * 4. Return success boolean
 * 
 * Usage in hooks:
 * const createItem = useActionHandler(
 *   async (data) => {
 *     const { error } = await supabase.from('items').insert(data)
 *     if (error) throw error
 *   },
 *   {
 *     successMessage: 'تم إضافة العنصر بنجاح',
 *     errorMessage: 'فشل إضافة العنصر',
 *     onSuccess: () => loadItems(),
 *   }
 * )
 */

import { useState, useCallback } from 'react'
import { toast } from './toast'

export interface ActionOptions {
  /** Message to show on success */
  successMessage?: string
  /** Message to show on error */
  errorMessage?: string
  /** Show loading indicator */
  showLoading?: boolean
  /** Loading message */
  loadingMessage?: string
  /** Callback on success */
  onSuccess?: () => void | Promise<void>
  /** Callback on error */
  onError?: (error: Error) => void | Promise<void>
  /** Confirm before executing */
  confirmMessage?: string
  /** Suppress success toast */
  suppressSuccessToast?: boolean
  /** Suppress error toast */
  suppressErrorToast?: boolean
}

/**
 * Execute an action with unified handling
 * 
 * @param action The async action to execute
 * @param options Configuration options
 * @returns Success boolean
 */
export async function executeAction<T = void>(
  action: () => Promise<T>,
  options: ActionOptions = {}
): Promise<{ success: boolean; data?: T; error?: Error }> {
  const {
    successMessage,
    errorMessage,
    showLoading = false,
    loadingMessage,
    onSuccess,
    onError,
    confirmMessage,
    suppressSuccessToast = false,
    suppressErrorToast = false,
  } = options

  try {
    // Show confirmation if required
    if (confirmMessage) {
      const confirmed = await toast.confirm({
        message: confirmMessage,
      })
      if (!confirmed) {
        return { success: false }
      }
    }

    // Show loading if required
    if (showLoading && loadingMessage) {
      toast.loading(loadingMessage)
    }

    // Execute action
    const data = await action()

    // Close loading
    if (showLoading) {
      toast.close()
    }

    // Show success toast
    if (!suppressSuccessToast && successMessage) {
      toast.success(successMessage)
    }

    // Call success callback
    if (onSuccess) {
      await onSuccess()
    }

    return { success: true, data }
  } catch (error) {
    const err = error as Error

    // Close loading
    if (showLoading) {
      toast.close()
    }

    // Show error toast
    if (!suppressErrorToast) {
      const message = errorMessage || err.message || 'حدث خطأ غير متوقع'
      toast.error(message)
    }

    // Call error callback
    if (onError) {
      await onError(err)
    }

    return { success: false, error: err }
  }
}

/**
 * Hook for creating action handlers
 * 
 * Usage:
 * const { execute, loading } = useActionHandler(
 *   async (data) => { await supabase.from('items').insert(data) },
 *   { successMessage: 'تم الحفظ' }
 * )
 */
export function useActionHandler<TArgs extends unknown[], TReturn = void>(
  action: (...args: TArgs) => Promise<TReturn>,
  options: ActionOptions = {}
) {
  const [loading, setLoading] = useState(false)

  const execute = useCallback(
    async (...args: TArgs) => {
      setLoading(true)
      const result = await executeAction(() => action(...args), options)
      setLoading(false)
      return result
    },
    [action, options]
  )

  return { execute, loading }
}

/**
 * Create a standardized CRUD action handler
 * 
 * Usage in hooks:
 * const createPackage = createActionHandler(
 *   (data) => supabase.from('packages').insert(data),
 *   'package',
 *   'create'
 * )
 */
export function createActionHandler<T>(
  action: (data: T) => Promise<unknown>,
  entityName: string,
  operation: 'create' | 'update' | 'delete',
  onSuccess?: () => void | Promise<void>
) {
  const messages = {
    create: {
      success: `تم إضافة ${entityName} بنجاح`,
      error: `فشل إضافة ${entityName}`,
      loading: `جاري إضافة ${entityName}...`,
    },
    update: {
      success: `تم تحديث ${entityName} بنجاح`,
      error: `فشل تحديث ${entityName}`,
      loading: `جاري تحديث ${entityName}...`,
    },
    delete: {
      success: `تم حذف ${entityName} بنجاح`,
      error: `فشل حذف ${entityName}`,
      loading: `جاري حذف ${entityName}...`,
      confirm: `هل أنت متأكد من حذف ${entityName}؟`,
    },
  }

  const config = messages[operation]

  return async (data: T) => {
    const result = await executeAction(() => action(data), {
      successMessage: config.success,
      errorMessage: config.error,
      showLoading: true,
      loadingMessage: config.loading,
      confirmMessage: operation === 'delete' ? (config as any).confirm : undefined,
      onSuccess,
    })

    return result.success
  }
}
