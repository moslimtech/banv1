'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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

  // Links visible to everyone
  const publicLinks = [
    { href: '/', label: 'الرئيسية', icon: Home },
  ]

  // Links visible to authenticated users
  const authLinks = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: Package },
    { href: '/dashboard/packages', label: 'الباقات', icon: Package },
  ]

  // Links visible to admins only
  const adminLinks = [
    { href: '/admin', label: 'لوحة الإدارة', icon: Settings },
    { href: '/admin/packages', label: 'إدارة الباقات', icon: Package },
    { href: '/admin/users', label: 'المستخدمين', icon: Users },
    { href: '/admin/affiliates', label: 'المسوقين', icon: TrendingUp },
  ]

  // Combine visible links
  const visibleLinks = [
    ...publicLinks,
    ...(user ? authLinks : []),
    ...(userProfile?.is_admin ? adminLinks : []),
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
              <Image
                src="/logo.webp"
                alt="بان - دليل المحلات"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-base sm:text-lg font-bold text-gray-900 hidden sm:inline">
              دليل المحلات
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              const isAdminLink = adminLinks.some(al => al.href === link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isActive(link.href)
                      ? isAdminLink 
                        ? 'bg-red-50 text-red-600'
                        : 'bg-blue-50 text-blue-600'
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
                <div className="hidden sm:flex items-center gap-2.5 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                  {userProfile?.avatar_url ? (
                    <div className="relative">
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name || user.email}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-gray-200 group-hover:border-blue-300 transition-all object-cover shadow-sm"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const fallback = document.createElement('div')
                            fallback.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-sm border-2 border-gray-200'
                            fallback.textContent = (userProfile?.full_name?.[0] || userProfile?.email?.[0] || 'U').toUpperCase()
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-sm border-2 border-gray-200 group-hover:border-blue-300 transition-all relative">
                      {(userProfile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm sm:text-base font-medium text-gray-900 hidden lg:inline truncate max-w-[150px]">
                      {userProfile?.full_name || user.email}
                    </span>
                    {userProfile?.is_admin && (
                      <span className="text-[10px] text-red-600 font-medium hidden lg:inline">مدير</span>
                    )}
                    {userProfile?.is_affiliate && !userProfile?.is_admin && (
                      <span className="text-[10px] text-yellow-600 font-medium hidden lg:inline">مسوق</span>
                    )}
                  </div>
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
              const isAdminLink = adminLinks.some(al => al.href === link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? isAdminLink
                        ? 'bg-red-50 text-red-600 font-medium'
                        : 'bg-blue-50 text-blue-600 font-medium'
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
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg mb-2">
                  {userProfile?.avatar_url ? (
                    <div className="relative">
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name || user.email}
                        className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const fallback = document.createElement('div')
                            fallback.className = 'w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base font-bold shadow-sm border-2 border-gray-200'
                            fallback.textContent = (userProfile?.full_name?.[0] || userProfile?.email?.[0] || 'U').toUpperCase()
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base font-bold shadow-sm border-2 border-gray-200">
                        {(userProfile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {userProfile?.full_name || user.email}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {userProfile?.is_admin && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">مدير</span>
                      )}
                      {userProfile?.is_affiliate && !userProfile?.is_admin && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">مسوق</span>
                      )}
                    </div>
                  </div>
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
