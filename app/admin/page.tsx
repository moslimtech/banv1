'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminManager } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { showError } from '@/components/SweetAlert'
import { LoadingSpinner } from '@/components/common'
import Link from 'next/link'
import { Package, Users, TrendingUp, Settings, Video, Ticket, FileCheck } from 'lucide-react'
import { HeadlineLarge, TitleMedium, BodySmall } from '@/components/m3'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const {
    isAdmin,
    loading: adminLoading,
  } = useAdminManager()

  // Redirect non-admin users
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      showError('ليس لديك صلاحيات للوصول إلى لوحة الإدارة')
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    )
  }

  if (!isAdmin) {
    return null // Redirecting...
  }

  const adminLinks = [
    {
      href: '/admin/packages',
      icon: Package,
      label: 'الباقات',
      description: 'إدارة الباقات',
      color: colors.primary,
    },
    {
      href: '/admin/users',
      icon: Users,
      label: 'المستخدمين',
      description: 'إدارة المستخدمين',
      color: colors.secondary,
    },
    {
      href: '/admin/affiliates',
      icon: TrendingUp,
      label: 'المسوقين',
      description: 'إدارة المسوقين',
      color: colors.warning,
    },
    {
      href: '/admin/youtube',
      icon: Video,
      label: 'YouTube',
      description: 'إعدادات YouTube',
      color: colors.error,
    },
    {
      href: '/admin/discount-codes',
      icon: Ticket,
      label: 'أكواد الخصم',
      description: 'إدارة أكواد الخصم',
      color: colors.warning,
    },
    {
      href: '/admin/subscriptions',
      icon: FileCheck,
      label: 'الاشتراكات',
      description: 'مراجعة الاشتراكات',
      color: colors.primary,
    },
    {
      href: '/admin/settings',
      icon: Settings,
      label: 'الإعدادات',
      description: 'إعدادات النظام',
      color: colors.secondary,
    },
  ]

  return (
    <div className="min-h-screen py-8 app-bg-base">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <HeadlineLarge className="mb-2">لوحة الإدارة</HeadlineLarge>
          <BodySmall color="onSurfaceVariant">إدارة النظام والمستخدمين</BodySmall>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="app-card shadow-lg rounded-3xl p-6 hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <Icon size={32} style={{ color: link.color }} />
                  <div>
                    <BodySmall color="onSurfaceVariant">{link.label}</BodySmall>
                    <TitleMedium>{link.description}</TitleMedium>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
