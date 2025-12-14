'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/lib/types'
import { showError, showSuccess, showConfirm } from '@/components/SweetAlert'
import { UserCheck, UserX, Crown, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAdmin()
    loadUsers()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard')
      return
    }

    setUser(user)
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'إلغاء صلاحيات المدير' : 'تعيين كمدير'
    const confirmed = await showConfirm(
      `هل تريد ${action} لهذا المستخدم؟`
    )

    if (!confirmed.isConfirmed) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      showSuccess(`تم ${action} بنجاح`)
      loadUsers()
    } catch (error: any) {
      showError(error.message)
    }
  }

  const toggleAffiliate = async (userId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        // Remove affiliate
        const { error: affiliateError } = await supabase
          .from('affiliates')
          .delete()
          .eq('user_id', userId)

        if (affiliateError) throw affiliateError

        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ is_affiliate: false, affiliate_code: null })
          .eq('id', userId)

        if (profileError) throw profileError
        showSuccess('تم إلغاء صلاحيات المسوق بنجاح')
      } else {
        // Create affiliate
        const affiliateCode = `AFF${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        
        const { error: affiliateError } = await supabase
          .from('affiliates')
          .insert({
            user_id: userId,
            code: affiliateCode,
            discount_percentage: 10,
            is_active: true,
          })

        if (affiliateError) throw affiliateError

        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ is_affiliate: true, affiliate_code: affiliateCode })
          .eq('id', userId)

        if (profileError) throw profileError
        showSuccess('تم تعيين المستخدم كمسوق بنجاح')
      }

      loadUsers()
    } catch (error: any) {
      showError(error.message)
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-blue-500 hover:underline mb-4 inline-block"
          >
            ← العودة للوحة الإدارة
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((userProfile) => (
                <tr key={userProfile.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {userProfile.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt={userProfile.full_name || userProfile.email || ''}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {(userProfile.full_name?.[0] || userProfile.email?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{userProfile.full_name || 'بدون اسم'}</div>
                        <div className="text-sm text-gray-500">
                          {userProfile.is_admin && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs mr-2">مدير</span>
                          )}
                          {userProfile.is_affiliate && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">مسوق</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{userProfile.email}</div>
                    {userProfile.affiliate_code && (
                      <div className="text-xs text-gray-500">كود: {userProfile.affiliate_code}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {userProfile.is_admin ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs w-fit">مدير</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs w-fit">مستخدم</span>
                      )}
                      {userProfile.is_affiliate && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs w-fit">مسوق</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAdmin(userProfile.id, userProfile.is_admin || false)}
                        className={`p-2 rounded ${
                          userProfile.is_admin
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-blue-500 hover:bg-blue-50'
                        }`}
                        title={userProfile.is_admin ? 'إلغاء صلاحيات المدير' : 'تعيين كمدير'}
                      >
                        <Crown size={18} />
                      </button>
                      <button
                        onClick={() => toggleAffiliate(userProfile.id, userProfile.is_affiliate || false)}
                        className={`p-2 rounded ${
                          userProfile.is_affiliate
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-yellow-500 hover:bg-yellow-50'
                        }`}
                        title={userProfile.is_affiliate ? 'إلغاء صلاحيات المسوق' : 'تعيين كمسوق'}
                      >
                        <TrendingUp size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
