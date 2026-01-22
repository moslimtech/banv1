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
  const { colors, isDark } = useTheme()
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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    )
  }

  if (!isAdmin) {
    return null // Redirecting...
  }

  return (
    <div className="min-h-screen app-bg-base py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="mb-4 inline-block hover:underline"
            className="icon-primary"
          >
            ← العودة للوحة الإدارة
          </Link>
          <h1 className="text-3xl font-bold app-text-main">إدارة المستخدمين</h1>
          <p className="app-text-muted mt-2">عدد المستخدمين: {users.length}</p>
        </div>

        <Card className="shadow-lg overflow-hidden" padding="none">
          <table className="w-full">
            <thead className="app-bg-surface">
              <tr >
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">المستخدم</th>
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">البريد الإلكتروني</th>
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">الهاتف</th>
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">تاريخ التسجيل</th>
                <th className="px-6 py-4 text-center text-base font-bold app-text-main">الصلاحيات</th>
              </tr>
            </thead>
            <tbody >
              {users.map((user) => (
                <tr key={user.id} className="app-hover-bg transition-colors" >
                  <td className="px-6 py-5">
                    <div className="font-semibold text-base app-text-main">
                      {user.full_name || 'لا يوجد اسم'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-base app-text-main">{user.email}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-base app-text-muted">{user.phone || '-'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm app-text-muted">
                      {new Date(user.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className={`p-2 rounded transition-colors ${
                          user.is_admin
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'app-bg-surface app-text-muted hover:bg-blue-50'
                        }`}
                        title={user.is_admin ? 'إلغاء صلاحيات المدير' : 'تعيين كمدير'}
                      >
                        <Crown size={20} />
                      </button>
                      <button
                        onClick={() => handleToggleAffiliate(user)}
                        className={`p-2 rounded transition-colors ${
                          user.is_affiliate
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'app-bg-surface app-text-muted hover:bg-green-50'
                        }`}
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
                  <td colSpan={5} className="px-6 py-8 text-center app-text-muted">
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
