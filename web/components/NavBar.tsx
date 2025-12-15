'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Home, Package, MessageSquare, Settings, Users, TrendingUp, LogOut, User, Menu, X } from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    window.location.href = '/'
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/dashboard', label: 'لوحة التحكم', icon: Package, requireAuth: true },
    { href: '/dashboard/packages', label: 'الباقات', icon: Package, requireAuth: true },
  ]

  const adminLinks = [
    { href: '/admin', label: 'لوحة الإدارة', icon: Settings },
    { href: '/admin/packages', label: 'إدارة الباقات', icon: Package },
    { href: '/admin/users', label: 'المستخدمين', icon: Users },
    { href: '/admin/affiliates', label: 'المسوقين', icon: TrendingUp },
  ]

  const visibleLinks = navLinks.filter(link => !link.requireAuth || user)
  const visibleAdminLinks = userProfile?.is_admin ? adminLinks : []

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="text-white" size={18} className="sm:w-5 sm:h-5" />
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 hidden sm:inline">
              دليل المحلات
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isActive(link.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            {visibleAdminLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isActive(link.href)
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.full_name || user.email}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {(userProfile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-700 hidden lg:inline">
                    {userProfile?.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut size={18} />
                  <span className="hidden lg:inline">خروج</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <User size={18} />
                <span>تسجيل الدخول</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            {visibleAdminLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-red-50 text-red-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            {user ? (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center gap-3 px-4 py-2.5">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.full_name || user.email}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {(userProfile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-700">
                    {userProfile?.full_name || user.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-right"
                >
                  <LogOut size={20} />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-2"
              >
                <User size={20} />
                <span>تسجيل الدخول</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
