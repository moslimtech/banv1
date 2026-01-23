import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Legacy hook for backward compatibility
 * Now uses AuthContext internally for better performance
 * @deprecated Prefer using useAuthContext directly
 */
export function useAuth(redirectToLogin: boolean = false) {
  return useAuthContext(redirectToLogin)
}
