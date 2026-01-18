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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary-color)' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 app-bg-base">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="mb-4 inline-block"
            style={{ color: 'var(--primary-color)' }}
          >
            ← العودة للوحة الإدارة
          </Link>
          <h1 className="text-3xl font-bold app-text-main">إدارة المستخدمين</h1>
        </div>

        <div className="app-card shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="app-bg-surface">
              <tr style={{ borderColor: 'var(--border-color)' }}>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">البريد</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">الإجراءات</th>
              </tr>
            </thead>
            <tbody style={{ borderColor: 'var(--border-color)' }}>
              {users.map((userProfile) => (
                <tr key={userProfile.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {userProfile.avatar_url ? (
                        <div className="relative">
                          <img
                            src={userProfile.avatar_url}
                            alt={userProfile.full_name || userProfile.email || ''}
                            className="w-10 h-10 rounded-full border-2 object-cover shadow-sm app-border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                const fallback = document.createElement('div')
                                fallback.className = 'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-sm border-2 app-border'
                                fallback.style.background = 'linear-gradient(to bottom right, var(--primary-color), var(--primary-dark))'
                                fallback.textContent = (userProfile.full_name?.[0] || userProfile.email?.[0] || 'U').toUpperCase()
                                parent.appendChild(fallback)
                              }
                            }}
                          />
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm border-2 app-border" style={{ background: 'linear-gradient(to bottom right, var(--primary-color), var(--primary-dark))' }}>
                            {(userProfile.full_name?.[0] || userProfile.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{userProfile.full_name || 'بدون اسم'}</div>
                        <div className="text-sm app-text-muted flex flex-wrap gap-1 mt-1">
                          {(() => {
                            const isAdmin = userProfile.is_admin || false
                            const isAffiliate = userProfile.is_affiliate || false
                            
                            if (isAdmin && isAffiliate) {
                              return (
                                <>
                                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--status-red-bg)', color: 'var(--status-error)' }}>مدير</span>
                                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--status-yellow-bg)', color: 'var(--status-warning)' }}>مسوق</span>
                                </>
                              )
                            } else if (isAdmin) {
                              return (
                                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--status-red-bg)', color: 'var(--status-error)' }}>مدير</span>
                              )
                            } else if (isAffiliate) {
                              return (
                                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--status-yellow-bg)', color: 'var(--status-warning)' }}>مسوق</span>
                              )
                            } else {
                              return (
                                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--surface-color)', color: 'var(--text-color)' }}>مستخدم</span>
                              )
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm app-text-main">{userProfile.email}</div>
                    {userProfile.affiliate_code && (
                      <div className="text-xs app-text-muted">كود: {userProfile.affiliate_code}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {(() => {
                        const isAdmin = userProfile.is_admin || false
                        const isAffiliate = userProfile.is_affiliate || false
                        
                        if (isAdmin && isAffiliate) {
                          return (
                            <>
                              <span className="px-2 py-1 rounded text-xs w-fit" style={{ background: 'var(--status-red-bg)', color: 'var(--status-error)' }}>مدير</span>
                              <span className="px-2 py-1 rounded text-xs w-fit" style={{ background: 'var(--status-yellow-bg)', color: 'var(--status-warning)' }}>مسوق</span>
                            </>
                          )
                        } else if (isAdmin) {
                          return (
                            <span className="px-2 py-1 rounded text-xs w-fit" style={{ background: 'var(--status-red-bg)', color: 'var(--status-error)' }}>مدير</span>
                          )
                        } else if (isAffiliate) {
                          return (
                            <span className="px-2 py-1 rounded text-xs w-fit" style={{ background: 'var(--status-yellow-bg)', color: 'var(--status-warning)' }}>مسوق</span>
                          )
                        } else {
                          return (
                            <span className="px-2 py-1 rounded text-xs w-fit" style={{ background: 'var(--surface-color)', color: 'var(--text-color)' }}>مستخدم</span>
                          )
                        }
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAdmin(userProfile.id, userProfile.is_admin || false)}
                        className="p-2 rounded app-hover-bg"
                        style={{ color: userProfile.is_admin ? 'var(--status-error)' : 'var(--primary-color)' }}
                        title={userProfile.is_admin ? 'إلغاء صلاحيات المدير' : 'تعيين كمدير'}
                      >
                        <Crown size={18} />
                      </button>
                      <button
                        onClick={() => toggleAffiliate(userProfile.id, userProfile.is_affiliate || false)}
                        className="p-2 rounded app-hover-bg"
                        style={{ color: userProfile.is_affiliate ? 'var(--status-error)' : 'var(--status-warning)' }}
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
