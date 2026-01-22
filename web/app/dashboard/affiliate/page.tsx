'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useAffiliate } from '@/hooks/useAffiliate'
import { 
  Copy, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingBag,
  CreditCard,
  MapPin,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  CheckCircle
} from 'lucide-react'

export default function AffiliateDashboardPage() {
  const { colors } = useTheme()
  const { profile } = useAuthContext()
  const router = useRouter()
  const { affiliate, transactions, stats, loading, copyCode, requestWithdrawal } = useAffiliate()
  const [activeTab, setActiveTab] = useState<'earnings' | 'places'>('earnings')
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')

  // Get transaction type label and color
  const getTransactionStyle = (type: string) => {
    const styles: Record<string, { label: string; color: string; icon: any }> = {
      earning: { label: 'عمولة', color: '#10B981', icon: ArrowUpRight },
      withdrawal: { label: 'سحب', color: '#EF4444', icon: ArrowDownRight },
      bonus: { label: 'مكافأة', color: '#F59E0B', icon: Gift },
      adjustment: { label: 'تعديل', color: '#6B7280', icon: CheckCircle }
    }
    return styles[type] || styles.earning
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle withdrawal request
  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount)
    if (isNaN(amount)) {
      alert('الرجاء إدخال مبلغ صحيح')
      return
    }

    const result = await requestWithdrawal(amount)
    if (result.success) {
      alert('تم إرسال طلب السحب بنجاح! سيتم مراجعته قريباً.')
      setShowWithdrawalModal(false)
      setWithdrawalAmount('')
    } else {
      alert(result.error || 'فشل طلب السحب')
    }
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center">
          <div 
            className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: colors.outline,
              borderTopColor: colors.primary
            }}
          />
          <p style={{ color: colors.onSurface }}>جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!affiliate) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: colors.background }}
      >
        <div 
          className="max-w-md w-full text-center p-8"
          style={{
            backgroundColor: colors.surface,
            borderRadius: '24px',
            border: `1px solid ${colors.outline}`
          }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <TrendingUp size={40} style={{ color: colors.primary }} />
          </div>
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: colors.onSurface }}
          >
            أنت لست مسوقاً
          </h2>
          <p 
            className="mb-6"
            style={{ color: colors.onSurface }}
          >
            للحصول على حساب مسوق، يرجى التواصل مع الإدارة
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 rounded-full font-medium transition-opacity"
            style={{
              backgroundColor: colors.primary,
              color: colors.onPrimary
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen py-6 px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: colors.onSurface }}
          >
            لوحة المسوق 💰
          </h1>
          <p style={{ color: colors.onSurface }}>
            إدارة أرباحك وأماكنك من مكان واحد
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('earnings')}
            className="px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'earnings' ? colors.primaryContainer : colors.outline,
              color: activeTab === 'earnings' ? colors.onPrimaryContainer : colors.onSurface
            }}
          >
            💰 أرباحي
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className="px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'places' ? colors.primaryContainer : colors.outline,
              color: activeTab === 'places' ? colors.onPrimaryContainer : colors.onSurface
            }}
          >
            🏪 أماكني
          </button>
        </div>

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Available Balance */}
              <div
                className="p-6 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  border: `1px solid ${colors.outline}`
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#10B98120' }}
                  >
                    <DollarSign size={24} style={{ color: '#10B981' }} />
                  </div>
                  <button
                    onClick={() => setShowWithdrawalModal(true)}
                    disabled={stats.pendingBalance <= 0}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.onPrimary
                    }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    سحب
                  </button>
                </div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: colors.onSurface }}
                >
                  الرصيد المتاح
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.onSurface }}
                >
                  {stats.pendingBalance.toFixed(2)} <span className="text-base">جنيه</span>
                </p>
              </div>

              {/* Total Earnings */}
              <div
                className="p-6 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  border: `1px solid ${colors.outline}`
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: '#3B82F620' }}
                >
                  <TrendingUp size={24} style={{ color: '#3B82F6' }} />
                </div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: colors.onSurface }}
                >
                  إجمالي الأرباح
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.onSurface }}
                >
                  {stats.totalEarnings.toFixed(2)} <span className="text-base">جنيه</span>
                </p>
              </div>

              {/* Referrals */}
              <div
                className="p-6 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  border: `1px solid ${colors.outline}`
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: '#F59E0B20' }}
                >
                  <Users size={24} style={{ color: '#F59E0B' }} />
                </div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: colors.onSurface }}
                >
                  المستخدمين المسجلين
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.onSurface }}
                >
                  {stats.totalReferrals}
                </p>
              </div>

              {/* Active Subscriptions */}
              <div
                className="p-6 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  border: `1px solid ${colors.outline}`
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: '#8B5CF620' }}
                >
                  <ShoppingBag size={24} style={{ color: '#8B5CF6' }} />
                </div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: colors.onSurface }}
                >
                  الاشتراكات النشطة
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.onSurface }}
                >
                  {stats.activeSubscriptions}
                </p>
              </div>
            </div>

            {/* Affiliate Code Card */}
            <div
              className="p-6"
              style={{
                backgroundColor: colors.surface,
                borderRadius: '24px',
                border: `1px solid ${colors.outline}`
              }}
            >
              <h3 
                className="text-lg font-bold mb-4"
                style={{ color: colors.onSurface }}
              >
                كود التسويق الخاص بك
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div 
                  className="flex-1 px-4 py-4 rounded-2xl font-mono text-lg font-bold text-center"
                  style={{
                    backgroundColor: colors.primaryContainer,
                    color: colors.onPrimaryContainer
                  }}
                >
                  {affiliate.code}
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-medium transition-opacity"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.onPrimary
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Copy size={20} />
                  <span className="hidden sm:inline">نسخ الكود</span>
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <p 
                  className="text-sm"
                  style={{ color: colors.onSurface }}
                >
                  نسبة الخصم: <span className="font-bold" style={{ color: colors.onSurface }}>{affiliate.discount_percentage}%</span>
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div
              className="overflow-hidden"
              style={{
                backgroundColor: colors.surface,
                borderRadius: '24px',
                border: `1px solid ${colors.outline}`
              }}
            >
              <div className="p-6 border-b" style={{ borderColor: colors.outline }}>
                <h3 
                  className="text-lg font-bold"
                  style={{ color: colors.onSurface }}
                >
                  سجل المعاملات
                </h3>
              </div>
              <div className="overflow-x-auto">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <CreditCard 
                      size={48} 
                      className="mx-auto mb-4" 
                      style={{ color: colors.onSurface, opacity: 0.5 }} 
                    />
                    <p style={{ color: colors.onSurface }}>
                      لا توجد معاملات بعد
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead style={{ backgroundColor: colors.outline }}>
                      <tr>
                        <th 
                          className="px-6 py-4 text-right text-xs font-medium uppercase"
                          style={{ color: colors.onSurface }}
                        >
                          النوع
                        </th>
                        <th 
                          className="px-6 py-4 text-right text-xs font-medium uppercase"
                          style={{ color: colors.onSurface }}
                        >
                          المبلغ
                        </th>
                        <th 
                          className="px-6 py-4 text-right text-xs font-medium uppercase"
                          style={{ color: colors.onSurface }}
                        >
                          الحالة
                        </th>
                        <th 
                          className="px-6 py-4 text-right text-xs font-medium uppercase"
                          style={{ color: colors.onSurface }}
                        >
                          التاريخ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => {
                        const style = getTransactionStyle(transaction.transaction_type)
                        const Icon = style.icon
                        return (
                          <tr 
                            key={transaction.id}
                            className="border-b transition-colors hover:bg-opacity-50"
                            style={{ 
                              borderColor: colors.outline,
                              backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.outline
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: `${style.color}20` }}
                                >
                                  <Icon size={16} style={{ color: style.color }} />
                                </div>
                                <span 
                                  className="font-medium text-sm"
                                  style={{ color: colors.onSurface }}
                                >
                                  {style.label}
                                </span>
                              </div>
                            </td>
                            <td 
                              className="px-6 py-4 font-bold"
                              style={{ color: colors.onSurface }}
                            >
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} جنيه
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: transaction.status === 'completed' ? '#10B98120' : 
                                                  transaction.status === 'pending' ? '#F59E0B20' : '#EF444420',
                                  color: transaction.status === 'completed' ? '#10B981' : 
                                        transaction.status === 'pending' ? '#F59E0B' : '#EF4444'
                                }}
                              >
                                {transaction.status === 'completed' ? 'مكتمل' : 
                                 transaction.status === 'pending' ? 'قيد المراجعة' : 'ملغي'}
                              </span>
                            </td>
                            <td 
                              className="px-6 py-4 text-sm"
                              style={{ color: colors.onSurface }}
                            >
                              {formatDate(transaction.created_at)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Places Tab */}
        {activeTab === 'places' && (
          <div className="space-y-6">
            <div
              className="p-8 text-center"
              style={{
                backgroundColor: colors.surface,
                borderRadius: '24px',
                border: `1px solid ${colors.outline}`
              }}
            >
              <MapPin 
                size={48} 
                className="mx-auto mb-4" 
                style={{ color: colors.primary }} 
              />
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: colors.onSurface }}
              >
                أماكني
              </h3>
              <p 
                className="mb-6"
                style={{ color: colors.onSurface }}
              >
                إدارة الصيدليات والمحلات والأماكن الخاصة بك
              </p>
              <button
                onClick={() => router.push('/dashboard/places')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-opacity"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.onPrimary
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <Plus size={20} />
                انتقل إلى أماكني
              </button>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowWithdrawalModal(false)}
          >
            <div
              className="max-w-md w-full p-6"
              style={{
                backgroundColor: colors.surface,
                borderRadius: '24px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 
                className="text-xl font-bold mb-4"
                style={{ color: colors.onSurface }}
              >
                طلب سحب
              </h3>
              <p 
                className="text-sm mb-4"
                style={{ color: colors.onSurface }}
              >
                الرصيد المتاح: <span className="font-bold">{stats.pendingBalance.toFixed(2)} جنيه</span>
              </p>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="المبلغ المطلوب"
                className="w-full px-4 py-3 rounded-2xl mb-4 border outline-none"
                style={{
                  backgroundColor: colors.outline,
                  borderColor: colors.outline,
                  color: colors.onSurface
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleWithdrawal}
                  className="flex-1 py-3 rounded-full font-medium transition-opacity"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.onPrimary
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  تأكيد
                </button>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="flex-1 py-3 rounded-full font-medium transition-colors"
                  style={{
                    backgroundColor: colors.outline,
                    color: colors.onSurface
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
