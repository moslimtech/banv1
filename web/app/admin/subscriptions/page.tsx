'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'
import { showError, showSuccess, showConfirm, showLoading, closeLoading } from '@/components/SweetAlert'
import { Check, X, Eye } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null)
  const [showImageModal, setShowImageModal] = useState(false)

  useEffect(() => {
    checkAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'approved',
          is_active: true,
        })
        .eq('id', subscription.id)

      if (error) {
        console.error('❌ [APPROVE ERROR]', error)
        throw error
      }

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
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'rejected',
          is_active: false,
        })
        .eq('id', subscription.id)

      if (error) {
        console.error('❌ [REJECT ERROR]', error)
        throw error
      }

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
        return <span className="px-3 py-1 rounded-full text-sm font-medium badge-warning">قيد المراجعة</span>
      case 'approved':
        return <span className="px-3 py-1 rounded-full text-sm font-medium badge-success">موافق عليه</span>
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-sm font-medium badge-danger">مرفوض</span>
      default:
        return <span className="px-3 py-1 rounded-full text-sm font-medium badge-muted">غير معروف</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

        {/* All Subscriptions */}
        <div>
          <h2 className="text-xl font-bold mb-4 app-text-main">جميع الاشتراكات ({subscriptions.length})</h2>
          <div className="app-card shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full" >
                <thead className="app-bg-surface">
                  <tr >
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">المستخدم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">الباقة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">المبلغ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">تاريخ الطلب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">تاريخ الانتهاء</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider app-text-muted">الإيصال</th>
                  </tr>
                </thead>
                <tbody >
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="app-hover-bg" >
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm app-text-muted">
                        {subscription.expires_at ? (
                          new Date(subscription.expires_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        ) : (
                          <span className="app-text-subtle">غير محدد</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {subscription.receipt_image_url ? (
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription)
                              setShowImageModal(true)
                            }}
                            className="flex items-center gap-1"
                            className="icon-primary"
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
            {subscriptions.length === 0 && (
              <div className="text-center py-12 app-text-muted">
                لا توجد اشتراكات
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="app-card shadow-xl rounded-3xl max-w-4xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold app-text-main">صورة إيصال الدفع</h3>
                <button
                  onClick={() => {
                    setShowImageModal(false)
                    setSelectedSubscription(null)
                  }}
                  className="app-text-muted app-hover-bg rounded-full p-2"
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
                <div className="border rounded-3xl overflow-hidden app-border">
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
                    className="bg-secondary"
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
                    className="badge-error"
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
