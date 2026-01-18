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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">لوحة الإدارة</h1>
          <p className="text-gray-600">إدارة النظام والمستخدمين</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/admin/packages"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Package className="text-blue-500" size={32} />
              <div>
                <p className="text-gray-600">الباقات</p>
                <p className="text-lg font-bold">إدارة الباقات</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Users className="text-green-500" size={32} />
              <div>
                <p className="text-gray-600">المستخدمين</p>
                <p className="text-lg font-bold">إدارة المستخدمين</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/affiliates"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <TrendingUp className="text-yellow-500" size={32} />
              <div>
                <p className="text-gray-600">المسوقين</p>
                <p className="text-lg font-bold">إدارة المسوقين</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/youtube"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Video className="text-red-500" size={32} />
              <div>
                <p className="text-gray-600">YouTube</p>
                <p className="text-lg font-bold">إعدادات YouTube</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/discount-codes"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Ticket className="text-orange-500" size={32} />
              <div>
                <p className="text-gray-600">أكواد الخصم</p>
                <p className="text-lg font-bold">إدارة أكواد الخصم</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/subscriptions"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <FileCheck className="text-indigo-500" size={32} />
              <div>
                <p className="text-gray-600">الاشتراكات</p>
                <p className="text-lg font-bold">مراجعة الاشتراكات</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Settings className="text-purple-500" size={32} />
              <div>
                <p className="text-gray-600">الإعدادات</p>
                <p className="text-lg font-bold">إعدادات النظام</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">إحصائيات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">إجمالي المستخدمين</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers.toLocaleString('ar-EG')}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">إجمالي الأماكن</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalPlaces.toLocaleString('ar-EG')}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">إجمالي المسوقين</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.totalAffiliates.toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
