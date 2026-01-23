'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminManager } from '@/hooks'
import { showError, showConfirm } from '@/components/SweetAlert'
import { LoadingSpinner, Card } from '@/components/common'
import { Crown, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function AdminUsersPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const {
    isAdmin,
    loading: adminLoading,
    users,
    usersLoading,
    updateUserAdminStatus,
    updateUserAffiliateStatus,
  } = useAdminManager({ autoLoadUsers: true })

  // Redirect non-admin users
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  const handleToggleAdmin = async (user: any) => {
    const action = user.is_admin ? 'إلغاء صلاحيات المدير' : 'تعيين كمدير'
    const confirmed = await showConfirm(`هل تريد ${action} لهذا المستخدم؟`)

    if (!confirmed.isConfirmed) return

    await updateUserAdminStatus(user.id, !user.is_admin)
  }

  const handleToggleAffiliate = async (user: any) => {
    const action = user.is_affiliate ? 'إلغاء صلاحيات المسوق' : 'تعيين كمسوق'
    const confirmed = await showConfirm(`هل تريد ${action} لهذا المستخدم؟`)

    if (!confirmed.isConfirmed) return

    await updateUserAffiliateStatus(user.id, !user.is_affiliate)
  }

  if (adminLoading || usersLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    )
  }

  if (!isAdmin) {
    return null // Redirecting...
  }

  return (
    <div 
      className="min-h-screen py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="mb-4 inline-block hover:underline"
            style={{ color: colors.primary }}
          >
            ← العودة للوحة الإدارة
          </Link>
          <h1 
            className="text-3xl font-bold"
            style={{ color: colors.onSurfaceVariant }}
          >
            إدارة المستخدمين
          </h1>
          <p 
            className="mt-2"
            style={{ color: colors.onSurfaceVariant, opacity: 0.7 }}
          >
            عدد المستخدمين: {users.length}
          </p>
        </div>

        <Card className="shadow-lg overflow-hidden" padding="none">
          <table className="w-full">
            <thead style={{ backgroundColor: colors.surfaceVariant }}>
              <tr>
                <th 
                  className="px-6 py-4 text-right text-base font-bold"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  المستخدم
                </th>
                <th 
                  className="px-6 py-4 text-right text-base font-bold"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  البريد الإلكتروني
                </th>
                <th 
                  className="px-6 py-4 text-right text-base font-bold"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  الهاتف
                </th>
                <th 
                  className="px-6 py-4 text-right text-base font-bold"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  تاريخ التسجيل
                </th>
                <th 
                  className="px-6 py-4 text-center text-base font-bold"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  الصلاحيات
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  className="transition-colors hover:opacity-90"
                  style={{ borderBottom: `1px solid ${colors.outline}` }}
                >
                  <td className="px-6 py-5">
                    <div 
                      className="font-semibold text-base"
                      style={{ color: colors.onSurfaceVariant }}
                    >
                      {user.full_name || 'لا يوجد اسم'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span 
                      className="text-base"
                      style={{ color: colors.onSurfaceVariant }}
                    >
                      {user.email}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span 
                      className="text-base"
                      style={{ color: colors.onSurfaceVariant }}
                    >
                      {user.phone || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span 
                      className="text-sm"
                      style={{ color: colors.onSurfaceVariant }}
                    >
                      {new Date(user.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
                        style={{
                          backgroundColor: user.is_admin 
                            ? `${colors.primary}20`
                            : colors.surfaceVariant,
                          color: user.is_admin ? colors.primary : colors.onSurfaceVariant,
                        }}
                        title={user.is_admin ? 'إلغاء صلاحيات المدير' : 'تعيين كمدير'}
                      >
                        <Crown size={20} />
                      </button>
                      <button
                        onClick={() => handleToggleAffiliate(user)}
                        className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
                        style={{
                          backgroundColor: user.is_affiliate 
                            ? `${colors.success}20`
                            : colors.surfaceVariant,
                          color: user.is_affiliate ? colors.success : colors.onSurfaceVariant,
                        }}
                        title={user.is_affiliate ? 'إلغاء صلاحيات المسوق' : 'تعيين كمسوق'}
                      >
                        <TrendingUp size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td 
                    colSpan={5} 
                    className="px-6 py-8 text-center"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    لا يوجد مستخدمين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
