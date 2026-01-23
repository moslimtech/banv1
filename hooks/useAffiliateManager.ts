/**
 * useAffiliateManager Hook
 * 
 * Centralized hook for affiliate operations.
 * Eliminates direct Supabase calls from affiliate UI pages.
 * 
 * Features:
 * - Load affiliate data
 * - Load transactions history
 * - Copy affiliate code to clipboard
 * - Track earnings (total, pending, paid)
 * 
 * Usage:
 * const { 
 *   affiliate, 
 *   transactions, 
 *   loading, 
 *   copyCode 
 * } = useAffiliateManager()
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess } from '@/components/SweetAlert'
import { useAuthContext } from '@/contexts/AuthContext'

interface Affiliate {
  id: string
  user_id: string
  code: string
  discount_percentage: number
  commission_percentage: number
  total_earnings: number
  pending_earnings: number
  paid_earnings: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

interface AffiliateTransaction {
  id: string
  affiliate_id: string
  amount: number
  transaction_type: 'earned' | 'paid'
  user_subscription_id: string | null
  notes: string | null
  created_at: string
  subscription?: {
    id: string
    user_id: string
    package_id: string
    status: string
    created_at: string
  }
}

interface UseAffiliateManagerOptions {
  autoLoad?: boolean
}

export function useAffiliateManager(options: UseAffiliateManagerOptions = {}) {
  const { user } = useAuthContext()
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [transactions, setTransactions] = useState<AffiliateTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  /**
   * Load affiliate data and transactions
   */
  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Load affiliate data
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (affiliateError && affiliateError.code !== 'PGRST116') {
        throw affiliateError
      }

      setAffiliate(affiliateData || null)

      // Load transactions if affiliate exists
      if (affiliateData) {
        await loadTransactions(affiliateData.id)
      }
    } catch (error: any) {
      console.error('❌ [useAffiliateManager] Error loading affiliate data:', error)
      showError('فشل تحميل بيانات المسوق: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * Load transactions for the affiliate
   */
  const loadTransactions = useCallback(async (affiliateId: string) => {
    setTransactionsLoading(true)
    try {
      const { data, error } = await supabase
        .from('affiliate_transactions')
        .select(`
          *,
          subscription:user_subscriptions(*)
        `)
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTransactions(data || [])
    } catch (error: any) {
      console.error('❌ [useAffiliateManager] Error loading transactions:', error)
      showError('فشل تحميل المعاملات: ' + error.message)
    } finally {
      setTransactionsLoading(false)
    }
  }, [])

  /**
   * Refresh affiliate data
   */
  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  /**
   * Copy affiliate code to clipboard
   */
  const copyCode = useCallback(() => {
    if (!affiliate) {
      showError('لا يوجد كود للنسخ')
      return
    }

    navigator.clipboard.writeText(affiliate.code)
      .then(() => {
        showSuccess('تم نسخ كود التسويق بنجاح')
      })
      .catch((error) => {
        console.error('❌ [useAffiliateManager] Error copying code:', error)
        showError('فشل نسخ الكود')
      })
  }, [affiliate])

  /**
   * Get earnings summary
   */
  const getEarningsSummary = useCallback(() => {
    if (!affiliate) {
      return {
        total: 0,
        pending: 0,
        paid: 0,
      }
    }

    return {
      total: affiliate.total_earnings,
      pending: affiliate.pending_earnings,
      paid: affiliate.paid_earnings,
    }
  }, [affiliate])

  /**
   * Check if user is an affiliate
   */
  const isAffiliate = affiliate !== null && affiliate.is_active

  // Auto-load data on mount
  useEffect(() => {
    if (options.autoLoad !== false) {
      loadData()
    }
  }, [loadData, options.autoLoad])

  return {
    // Data
    affiliate,
    transactions,
    
    // Loading states
    loading,
    transactionsLoading,
    
    // Actions
    loadData,
    loadTransactions: () => affiliate && loadTransactions(affiliate.id),
    refresh,
    copyCode,
    
    // Computed
    isAffiliate,
    earningsSummary: getEarningsSummary(),
  }
}
