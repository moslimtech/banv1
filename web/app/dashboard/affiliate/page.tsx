'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Affiliate } from '@/lib/types'
import { showError } from '@/components/SweetAlert'
import { Copy, TrendingUp, DollarSign, Calendar } from 'lucide-react'

export default function AffiliateDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      // Load affiliate data
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setAffiliate(affiliateData)

      // Load transactions
      if (affiliateData) {
        const { data: transactionsData } = await supabase
          .from('affiliate_transactions')
          .select('*, subscription:user_subscriptions(*)')
          .eq('affiliate_id', affiliateData.id)
          .order('created_at', { ascending: false })

        setTransactions(transactionsData || [])
      }
    } catch (error: any) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    if (affiliate) {
      navigator.clipboard.writeText(affiliate.code)
      ;(window as any).Swal.fire({
        icon: 'success',
        title: 'تم النسخ!',
        text: 'تم نسخ كود التسويق بنجاح',
        timer: 2000,
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">أنت لست مسوقاً</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">لوحة المسوق</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="text-green-500" size={32} />
              <div>
                <p className="text-gray-600">إجمالي الأرباح</p>
                <p className="text-2xl font-bold">{affiliate.total_earnings} EGP</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="text-blue-500" size={32} />
              <div>
                <p className="text-gray-600">المستحقات</p>
                <p className="text-2xl font-bold">{affiliate.pending_earnings} EGP</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <Calendar className="text-yellow-500" size={32} />
              <div>
                <p className="text-gray-600">المدفوع</p>
                <p className="text-2xl font-bold">{affiliate.paid_earnings} EGP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Affiliate Code */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">كود التسويق</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-lg">
              {affiliate.code}
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Copy size={20} />
              نسخ
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            نسبة الخصم: {affiliate.discount_percentage}%
          </p>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">المعاملات</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {transaction.amount} EGP
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded ${
                          transaction.transaction_type === 'earned'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.transaction_type === 'earned' ? 'ربح' : 'دفع'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(transaction.created_at).toLocaleString('ar-EG')}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      لا توجد معاملات بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
