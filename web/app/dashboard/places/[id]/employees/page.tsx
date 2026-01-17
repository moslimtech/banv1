'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { EmployeeRequest, PlaceEmployee } from '@/lib/types'
import { showError, showSuccess } from '@/components/SweetAlert'
import { UserPlus, CheckCircle, X, Shield, MessageSquare, Package } from 'lucide-react'
import Link from 'next/link'

export default function PlaceEmployeesPage() {
  const params = useParams()
  const router = useRouter()
  const placeId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [place, setPlace] = useState<any>(null)
  const [requests, setRequests] = useState<EmployeeRequest[]>([])
  const [employees, setEmployees] = useState<PlaceEmployee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [placeId])

  useEffect(() => {
    if (user && place) {
      loadRequests()
      loadEmployees()
    }
  }, [user, place])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setUser(user)

    // Check if user owns this place
    const { data: placeData, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .eq('user_id', user.id)
      .single()

    if (error || !placeData) {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard/places')
      return
    }

    setPlace(placeData)
    setLoading(false)
  }

  const loadRequests = async () => {
    try {
      const { data: requestsData, error } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('place_id', placeId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading requests:', error)
        return
      }

      // Load user profiles for requests
      if (requestsData && requestsData.length > 0) {
        const userIds = requestsData.map(r => r.user_id)
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', userIds)

        // Map user profiles to requests
        const profilesMap = new Map()
        if (userProfiles) {
          userProfiles.forEach(profile => {
            profilesMap.set(profile.id, profile)
          })
        }

        // Attach user profiles to requests
        requestsData.forEach(request => {
          request.user = profilesMap.get(request.user_id)
        })
      }

      setRequests(requestsData || [])
    } catch (error) {
      console.error('Error loading requests:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      const { data: employeesData, error } = await supabase
        .from('place_employees')
        .select('*')
        .eq('place_id', placeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading employees:', error)
        return
      }

      // Load user profiles for employees
      if (employeesData && employeesData.length > 0) {
        const userIds = employeesData.map(e => e.user_id)
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', userIds)

        // Map user profiles to employees
        const profilesMap = new Map()
        if (userProfiles) {
          userProfiles.forEach(profile => {
            profilesMap.set(profile.id, profile)
          })
        }

        // Attach user profiles to employees
        employeesData.forEach(employee => {
          employee.user = profilesMap.get(employee.user_id)
        })
      }

      setEmployees(employeesData || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const handleAcceptRequest = async (requestId: string, permissions: 'basic' | 'messages_posts' | 'full') => {
    try {
      const request = requests.find(r => r.id === requestId)
      if (!request) return

      // Update request status
      const { error: updateError } = await supabase
        .from('employee_requests')
        .update({ status: 'accepted', permissions })
        .eq('id', requestId)

      if (updateError) {
        showError('حدث خطأ في قبول الطلب')
        return
      }

      // Add to place_employees
      const { error: insertError } = await supabase
        .from('place_employees')
        .insert({
          user_id: request.user_id,
          place_id: placeId,
          permissions,
          phone: request.phone,
          is_active: true
        })

      if (insertError) {
        // If already exists, just update
        const { error: upsertError } = await supabase
          .from('place_employees')
          .update({ permissions, is_active: true })
          .eq('user_id', request.user_id)
          .eq('place_id', placeId)

        if (upsertError) {
          showError('حدث خطأ في إضافة الموظف')
          return
        }
      }

      showSuccess('تم قبول الطلب بنجاح')
      loadRequests()
      loadEmployees()
    } catch (error) {
      showError('حدث خطأ في قبول الطلب')
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('employee_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)

      if (error) {
        showError('حدث خطأ في رفض الطلب')
        return
      }

      showSuccess('تم رفض الطلب')
      loadRequests()
    } catch (error) {
      showError('حدث خطأ في رفض الطلب')
    }
  }

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا الموظف؟')) return

    try {
      const { error } = await supabase
        .from('place_employees')
        .update({ is_active: false })
        .eq('id', employeeId)

      if (error) {
        showError('حدث خطأ في إزالة الموظف')
        return
      }

      showSuccess('تم إزالة الموظف بنجاح')
      loadEmployees()
    } catch (error) {
      showError('حدث خطأ في إزالة الموظف')
    }
  }

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'basic':
        return 'قبول فقط'
      case 'messages_posts':
        return 'رد على العملاء ومنشورات'
      case 'full':
        return 'رد على العملاء وإضافة/حذف منتجات ومنشورات'
      default:
        return permission
    }
  }

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'basic':
        return <CheckCircle size={18} className="text-blue-500" />
      case 'messages_posts':
        return <MessageSquare size={18} className="text-green-500" />
      case 'full':
        return <Shield size={18} className="text-purple-500" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/dashboard/places/${placeId}`}
            className="text-blue-500 hover:text-blue-600 mb-4 inline-block"
          >
            ← العودة إلى صفحة المكان
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-slate-100">
            إدارة الموظفين - {place?.name_ar}
          </h1>
          <p className="text-gray-600 dark:text-slate-400">إدارة طلبات التوظيف والموظفين</p>
        </div>

        {/* Pending Requests */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <UserPlus size={24} />
            طلبات التوظيف ({requests.length})
          </h2>

          {requests.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-center py-8">
              لا توجد طلبات توظيف قيد الانتظار
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                        {request.user?.full_name || request.user?.email || 'مستخدم'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        رقم الهاتف: {request.phone}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => handleAcceptRequest(request.id, 'basic')}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      قبول
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(request.id, 'messages_posts')}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <MessageSquare size={16} />
                      قبول ورد على العملاء ومنشورات
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(request.id, 'full')}
                      className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <Shield size={16} />
                      قبول ورد على العملاء وإضافة/حذف منتجات ومنشورات
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Employees */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Package size={24} />
            الموظفين الحاليين ({employees.length})
          </h2>

          {employees.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-center py-8">
              لا يوجد موظفين حالياً
            </p>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getPermissionIcon(employee.permissions)}
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                          {employee.user?.full_name || employee.user?.email || 'مستخدم'}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                        الصلاحيات: {getPermissionLabel(employee.permissions)}
                      </p>
                      {employee.phone && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                          رقم الهاتف: {employee.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-slate-500">
                        انضم في: {new Date(employee.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveEmployee(employee.id)}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      إزالة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
