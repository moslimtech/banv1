'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess, showConfirm, showLoading, closeLoading } from '@/components/SweetAlert'
import { Check, X, Eye, User, Package as PackageIcon, Calendar, DollarSign, Clock } from 'lucide-react'
import Image from 'next/image'

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null)
  const [showImageModal, setShowImageModal] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (user) {
      loadSubscriptions()
    }
  }, [user])

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Check if user is admin
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        router.push('/dashboard')
        return
      }

      if (!profileData?.is_admin) {
        showError('ليس لديك صلاحيات للوصول إلى لوحة الإدارة')
        router.push('/dashboard')
        return
      }
    } catch (error: any) {
      showError(error.message)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, package:packages(*), user:user_profiles(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('📋 [SUBSCRIPTIONS] Loaded subscriptions:', data?.map(s => ({ 
        id: s.id, 
        status: s.status, 
        receipt_image_url: s.receipt_image_url,
        has_receipt: !!s.receipt_image_url,
        user: s.user?.email,
        package: s.package?.name_ar
      })))
      console.log('📋 [SUBSCRIPTIONS] Full subscription data:', data)
      setSubscriptions(data || [])
    } catch (error: any) {
      console.error('Error loading subscriptions:', error)
      showError(error.message || 'حدث خطأ في تحميل الاشتراكات')
    }
  }

  const handleApprove = async (subscription: any) => {
    const confirmed = await showConfirm(
      `هل أنت متأكد من الموافقة على اشتراك ${subscription.user?.full_name || subscription.user?.email || 'المستخدم'} في باقة ${subscription.package?.name_ar || ''}؟`
    )

    if (!confirmed.isConfirmed) return

    showLoading('جاري الموافقة على الاشتراك...')
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'approved',
          is_active: true,
        })
        .eq('id', subscription.id)
        .select()

      if (error) {
        console.error('❌ [APPROVE ERROR]', error)
        throw error
      }

      console.log('✅ [APPROVE SUCCESS]', data)

      closeLoading()
      showSuccess('تم الموافقة على الاشتراك بنجاح!')
      
      // Reload subscriptions after a short delay to ensure DB is updated
      await new Promise(resolve => setTimeout(resolve, 500))
      await loadSubscriptions()
    } catch (error: any) {
      console.error('❌ [APPROVE ERROR]', error)
      closeLoading()
      showError(error.message || 'حدث خطأ في الموافقة على الاشتراك')
    }
  }

  const handleReject = async (subscription: any) => {
    const confirmed = await showConfirm(
      `هل أنت متأكد من رفض اشتراك ${subscription.user?.full_name || subscription.user?.email || 'المستخدم'} في باقة ${subscription.package?.name_ar || ''}؟`
    )

    if (!confirmed.isConfirmed) return

    showLoading('جاري رفض الاشتراك...')
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'rejected',
          is_active: false,
        })
        .eq('id', subscription.id)
        .select()

      if (error) {
        console.error('❌ [REJECT ERROR]', error)
        throw error
      }

      console.log('✅ [REJECT SUCCESS]', data)

      closeLoading()
      showSuccess('تم رفض الاشتراك بنجاح!')
      
      // Reload subscriptions after a short delay to ensure DB is updated
      await new Promise(resolve => setTimeout(resolve, 500))
      await loadSubscriptions()
    } catch (error: any) {
      console.error('❌ [REJECT ERROR]', error)
      closeLoading()
      showError(error.message || 'حدث خطأ في رفض الاشتراك')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--status-yellow-bg)', color: 'var(--status-warning)' }}>قيد المراجعة</span>
      case 'approved':
        return <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--status-green-bg)', color: 'var(--secondary-color)' }}>موافق عليه</span>
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--status-red-bg)', color: 'var(--status-error)' }}>مرفوض</span>
      default:
        return <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'var(--surface-color)', color: 'var(--text-color)' }}>غير معروف</span>
    }
  }

  const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending')
  const allSubscriptions = subscriptions

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary-color)' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 app-bg-base">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 app-text-main">مراجعة الاشتراكات</h1>
          <p className="app-text-muted">مراجعة وتأكيد طلبات الاشتراك في الباقات</p>
        </div>

        {/* Pending Subscriptions */}
        {pendingSubscriptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 app-text-main">الطلبات المعلقة ({pendingSubscriptions.length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingSubscriptions.map((subscription) => (
                <div key={subscription.id} className="app-card shadow-lg p-6 border-2" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={18} style={{ color: 'var(--text-muted)' }} />
                        <span className="font-semibold app-text-main">
                          {subscription.user?.full_name || subscription.user?.email || 'مستخدم'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <PackageIcon size={18} className="text-blue-500" />
                        <span className="app-text-main">{subscription.package?.name_ar || 'باقة غير معروفة'}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={18} className="text-green-500" />
                        <span className="app-text-main">{subscription.amount_paid} EGP</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                        <span className="app-text-muted text-sm">
                          {new Date(subscription.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>

                  <div className="mb-4">
                    {subscription.receipt_image_url ? (
                      <>
                        <div className="mb-2">
                          <p className="text-sm font-medium app-text-main mb-2">صورة الإيصال:</p>
                          <div className="relative border rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity app-border"
                            onClick={() => {
                              setSelectedSubscription(subscription)
                              setShowImageModal(true)
                            }}
                          >
                            <img
                              src={subscription.receipt_image_url}
                              alt="Receipt"
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                              <Eye size={24} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSubscription(subscription)
                            setShowImageModal(true)
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors w-full justify-center"
                          style={{ background: 'var(--primary-color)' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          <Eye size={18} />
                          <span>عرض صورة الإيصال بالحجم الكامل</span>
                        </button>
                      </>
                    ) : (
                      <div className="p-3 rounded-lg" style={{ background: 'var(--status-yellow-bg)', borderColor: 'var(--status-warning)', border: '1px solid' }}>
                        <p className="text-sm" style={{ color: 'var(--status-warning)' }}>⚠️ لم يتم رفع صورة إيصال الدفع</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(subscription)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium"
                      style={{ background: 'var(--secondary-color)' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <Check size={18} />
                      <span>موافق</span>
                    </button>
                    <button
                      onClick={() => handleReject(subscription)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium"
                      style={{ background: 'var(--status-error)' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <X size={18} />
                      <span>رفض</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Subscriptions */}
        <div>
          <h2 className="text-xl font-bold mb-4 app-text-main">جميع الاشتراكات ({allSubscriptions.length})</h2>
          <div className="app-card shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full" style={{ borderColor: 'var(--border-color)' }}>
                <thead className="app-bg-surface">
                  <tr style={{ borderColor: 'var(--border-color)' }}>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">المستخدم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">الباقة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">المبلغ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">تاريخ الطلب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">تاريخ الانتهاء</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">الإيصال</th>
                  </tr>
                </thead>
                <tbody style={{ borderColor: 'var(--border-color)' }}>
                  {allSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="app-hover-bg" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm app-text-main">
                        {subscription.user?.full_name || subscription.user?.email || 'مستخدم'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm app-text-main">
                        {subscription.package?.name_ar || 'باقة غير معروفة'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm app-text-main">
                        {subscription.amount_paid} EGP
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(subscription.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm app-text-muted">
                        {new Date(subscription.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {subscription.receipt_image_url ? (
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription)
                              setShowImageModal(true)
                            }}
                            className="flex items-center gap-1"
                            style={{ color: 'var(--primary-color)' }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          >
                            <Eye size={16} />
                            <span>عرض</span>
                          </button>
                        ) : (
                          <span className="app-text-subtle">لا يوجد</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {allSubscriptions.length === 0 && (
              <div className="text-center py-12 app-text-muted">
                لا توجد اشتراكات
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="app-card shadow-xl max-w-4xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold app-text-main">صورة إيصال الدفع</h3>
                <button
                  onClick={() => {
                    setShowImageModal(false)
                    setSelectedSubscription(null)
                  }}
                  className="app-text-muted app-hover-bg"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="mb-4">
                <p className="app-text-muted mb-1">
                  <span className="font-semibold">المستخدم:</span> {selectedSubscription.user?.full_name || selectedSubscription.user?.email || 'مستخدم'}
                </p>
                <p className="app-text-muted mb-1">
                  <span className="font-semibold">الباقة:</span> {selectedSubscription.package?.name_ar || 'باقة غير معروفة'}
                </p>
                <p className="app-text-muted mb-1">
                  <span className="font-semibold">المبلغ:</span> {selectedSubscription.amount_paid} EGP
                </p>
                {selectedSubscription.expires_at && (
                  <p className="app-text-muted">
                    <span className="font-semibold">تاريخ الانتهاء:</span> {new Date(selectedSubscription.expires_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
              {selectedSubscription.receipt_image_url && (
                <div className="border rounded-lg overflow-hidden app-border">
                  <img
                    src={selectedSubscription.receipt_image_url}
                    alt="Receipt"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                </div>
              )}
              {selectedSubscription.status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      handleApprove(selectedSubscription)
                      setShowImageModal(false)
                      setSelectedSubscription(null)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium"
                    style={{ background: 'var(--secondary-color)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Check size={18} />
                    <span>موافق</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedSubscription)
                      setShowImageModal(false)
                      setSelectedSubscription(null)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium"
                    style={{ background: 'var(--status-error)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <X size={18} />
                    <span>رفض</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
