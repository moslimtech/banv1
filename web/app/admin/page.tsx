'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/lib/types'
import { showError } from '@/components/SweetAlert'
import Link from 'next/link'
import { Package, Users, TrendingUp, Settings, Video, Ticket, FileCheck } from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlaces: 0,
    totalAffiliates: 0,
  })

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (profile?.is_admin) {
      loadStats()
    }
  }, [profile])

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

      setProfile(profileData)
    } catch (error: any) {
      showError(error.message)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Get total places count
      const { count: placesCount } = await supabase
        .from('places')
        .select('*', { count: 'exact', head: true })

      // Get total affiliates count
      const { count: affiliatesCount } = await supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalUsers: usersCount || 0,
        totalPlaces: placesCount || 0,
        totalAffiliates: affiliatesCount || 0,
      })
    } catch (error: any) {
      console.error('Error loading stats:', error)
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
          <h1 className="text-3xl font-bold mb-2 app-text-main">لوحة الإدارة</h1>
          <p className="app-text-muted">إدارة النظام والمستخدمين</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/admin/packages"
            className="app-card shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Package size={32} style={{ color: 'var(--primary-color)' }} />
              <div>
                <p className="app-text-muted">الباقات</p>
                <p className="text-lg font-bold app-text-main">إدارة الباقات</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="app-card shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Users size={32} style={{ color: 'var(--secondary-color)' }} />
              <div>
                <p className="app-text-muted">المستخدمين</p>
                <p className="text-lg font-bold app-text-main">إدارة المستخدمين</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/affiliates"
            className="app-card shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <TrendingUp size={32} style={{ color: 'var(--status-warning)' }} />
              <div>
                <p className="app-text-muted">المسوقين</p>
                <p className="text-lg font-bold app-text-main">إدارة المسوقين</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/youtube"
            className="app-card shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Video size={32} style={{ color: 'var(--status-error)' }} />
              <div>
                <p className="app-text-muted">YouTube</p>
                <p className="text-lg font-bold app-text-main">إعدادات YouTube</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/discount-codes"
            className="app-card shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Ticket size={32} style={{ color: 'var(--accent)' }} />
              <div>
                <p className="app-text-muted">أكواد الخصم</p>
                <p className="text-lg font-bold app-text-main">إدارة أكواد الخصم</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/subscriptions"
            className="app-card shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <FileCheck size={32} style={{ color: 'var(--primary-color)' }} />
              <div>
                <p className="app-text-muted">الاشتراكات</p>
                <p className="text-lg font-bold app-text-main">مراجعة الاشتراكات</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="app-card shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Settings size={32} style={{ color: 'var(--accent)' }} />
              <div>
                <p className="app-text-muted">الإعدادات</p>
                <p className="text-lg font-bold app-text-main">إعدادات النظام</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="app-card shadow p-6">
          <h2 className="text-xl font-bold mb-4 app-text-main">إحصائيات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--status-blue-bg)' }}>
              <p className="text-sm app-text-muted mb-2">إجمالي المستخدمين</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--primary-color)' }}>{stats.totalUsers.toLocaleString('ar-EG')}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--status-green-bg)' }}>
              <p className="text-sm app-text-muted mb-2">إجمالي الأماكن</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--secondary-color)' }}>{stats.totalPlaces.toLocaleString('ar-EG')}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--status-yellow-bg)' }}>
              <p className="text-sm app-text-muted mb-2">إجمالي المسوقين</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--status-warning)' }}>{stats.totalAffiliates.toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
