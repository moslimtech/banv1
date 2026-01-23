'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

interface Affiliate {
  id: string
  user_id: string
  code: string
  discount_percentage: number
  total_earnings: number
  paid_earnings: number
  pending_earnings: number
  is_active: boolean
  created_at: string
}

interface AffiliateTransaction {
  id: string
  affiliate_id: string
  transaction_type: 'earning' | 'withdrawal' | 'adjustment' | 'bonus'
  amount: number
  description_ar?: string
  description_en?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
}

interface AffiliateStats {
  totalEarnings: number
  pendingBalance: number
  withdrawnAmount: number
  totalReferrals: number
  activeSubscriptions: number
}

export function useAffiliate() {
  const { user } = useAuthContext()
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [transactions, setTransactions] = useState<AffiliateTransaction[]>([])
  const [stats, setStats] = useState<AffiliateStats>({
    totalEarnings: 0,
    pendingBalance: 0,
    withdrawnAmount: 0,
    totalReferrals: 0,
    activeSubscriptions: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch affiliate data
  const fetchAffiliate = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Get affiliate record
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (affiliateError) {
        if (affiliateError.code === 'PGRST116') {
          // No affiliate record
          setAffiliate(null)
          setLoading(false)
          return
        }
        throw affiliateError
      }

      setAffiliate(affiliateData)

      // Get balance using database function
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_affiliate_balance', { p_affiliate_id: affiliateData.id })

      if (balanceError) throw balanceError

      // Get transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('affiliate_transactions')
        .select('*')
        .eq('affiliate_id', affiliateData.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (transactionsError) throw transactionsError

      setTransactions(transactionsData || [])

      // Calculate stats
      const earnings = (transactionsData || [])
        .filter(t => t.transaction_type === 'earning' && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

      const withdrawals = (transactionsData || [])
        .filter(t => t.transaction_type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

      // Get referrals count
      const { count: referralsCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('affiliate_code_used', affiliateData.code)

      // Get active subscriptions
      const { count: activeCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('affiliate_code_used', affiliateData.code)
        .eq('is_active', true)

      setStats({
        totalEarnings: earnings,
        pendingBalance: typeof balanceData === 'number' ? balanceData : 0,
        withdrawnAmount: withdrawals,
        totalReferrals: referralsCount || 0,
        activeSubscriptions: activeCount || 0
      })

    } catch (err) {
      console.error('Error fetching affiliate data:', err)
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  // Copy affiliate code
  const copyCode = async () => {
    if (!affiliate) return

    try {
      await navigator.clipboard.writeText(affiliate.code)
      // You can add a toast notification here
      alert('تم نسخ الكود بنجاح!')
    } catch (err) {
      console.error('Error copying code:', err)
      alert('فشل نسخ الكود')
    }
  }

  // Request withdrawal
  const requestWithdrawal = async (amount: number) => {
    if (!affiliate) return { success: false, error: 'لم يتم العثور على حساب المسوق' }
    if (amount > stats.pendingBalance) return { success: false, error: 'المبلغ أكبر من الرصيد المتاح' }
    if (amount <= 0) return { success: false, error: 'المبلغ غير صحيح' }

    try {
      const { error: insertError } = await supabase
        .from('affiliate_transactions')
        .insert({
          affiliate_id: affiliate.id,
          transaction_type: 'withdrawal',
          amount: -amount, // Negative for withdrawal
          description_ar: `طلب سحب ${amount} جنيه`,
          status: 'pending'
        })

      if (insertError) throw insertError

      // Refresh data
      await fetchAffiliate()

      return { success: true, error: null }
    } catch (err) {
      console.error('Error requesting withdrawal:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'فشل طلب السحب' 
      }
    }
  }

  useEffect(() => {
    fetchAffiliate()
  }, [user])

  return {
    affiliate,
    transactions,
    stats,
    loading,
    error,
    copyCode,
    requestWithdrawal,
    refresh: fetchAffiliate
  }
}
