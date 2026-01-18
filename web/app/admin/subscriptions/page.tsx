'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess, showConfirm, showLoading, closeLoading } from '@/components/SweetAlert'
import { Check, X, Eye, User, Package as PackageIcon, Calendar, DollarSign } from 'lucide-react'
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

      if (error) throw error

      closeLoading()
      showSuccess('تم الموافقة على الاشتراك بنجاح!')
      loadSubscriptions()
    } catch (error: any) {
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

      if (error) throw error

      closeLoading()
      showSuccess('تم رفض الاشتراك بنجاح!')
      loadSubscriptions()
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في رفض الاشتراك')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">قيد المراجعة</span>
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">موافق عليه</span>
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">مرفوض</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">غير معروف</span>
    }
  }

  const pendingSubscriptions = subscriptions.filter(s => s.status === 'pending')
  const allSubscriptions = subscriptions

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">مراجعة الاشتراكات</h1>
          <p className="text-gray-600">مراجعة وتأكيد طلبات الاشتراك في الباقات</p>
        </div>

        {/* Pending Subscriptions */}
        {pendingSubscriptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">الطلبات المعلقة ({pendingSubscriptions.length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingSubscriptions.map((subscription) => (
                <div key={subscription.id} className="bg-white rounded-lg shadow-lg p-6 border-2 border-yellow-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={18} className="text-gray-500" />
                        <span className="font-semibold text-gray-900">
                          {subscription.user?.full_name || subscription.user?.email || 'مستخدم'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <PackageIcon size={18} className="text-blue-500" />
                        <span className="text-gray-700">{subscription.package?.name_ar || 'باقة غير معروفة'}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={18} className="text-green-500" />
                        <span className="text-gray-700">{subscription.amount_paid} EGP</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={18} className="text-gray-500" />
                        <span className="text-gray-600 text-sm">
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

                  {subscription.receipt_image_url && (
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          setSelectedSubscription(subscription)
                          setShowImageModal(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full justify-center"
                      >
                        <Eye size={18} />
                        <span>عرض صورة الإيصال</span>
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(subscription)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X size={18} />
                      <span>رفض</span>
                    </button>
                    <button
                      onClick={() => handleApprove(subscription)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Check size={18} />
                      <span>موافق</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Subscriptions */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-900">جميع الاشتراكات ({allSubscriptions.length})</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الباقة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإيصال</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.user?.full_name || subscription.user?.email || 'مستخدم'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {subscription.package?.name_ar || 'باقة غير معروفة'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {subscription.amount_paid} EGP
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(subscription.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subscription.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {subscription.receipt_image_url ? (
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription)
                              setShowImageModal(true)
                            }}
                            className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Eye size={16} />
                            <span>عرض</span>
                          </button>
                        ) : (
                          <span className="text-gray-400">لا يوجد</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {allSubscriptions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                لا توجد اشتراكات
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">صورة إيصال الدفع</h3>
                <button
                  onClick={() => {
                    setShowImageModal(false)
                    setSelectedSubscription(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 mb-1">
                  <span className="font-semibold">المستخدم:</span> {selectedSubscription.user?.full_name || selectedSubscription.user?.email || 'مستخدم'}
                </p>
                <p className="text-gray-600 mb-1">
                  <span className="font-semibold">الباقة:</span> {selectedSubscription.package?.name_ar || 'باقة غير معروفة'}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">المبلغ:</span> {selectedSubscription.amount_paid} EGP
                </p>
              </div>
              {selectedSubscription.receipt_image_url && (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
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
                      handleReject(selectedSubscription)
                      setShowImageModal(false)
                      setSelectedSubscription(null)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X size={18} />
                    <span>رفض</span>
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedSubscription)
                      setShowImageModal(false)
                      setSelectedSubscription(null)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check size={18} />
                    <span>موافق</span>
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
