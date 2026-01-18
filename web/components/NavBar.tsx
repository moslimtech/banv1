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

  // Combine visible links
  const visibleLinks = [
    ...publicLinks,
    ...(user ? authLinks : []),
    ...(userProfile?.is_admin ? [{ href: '/admin', label: 'لوحة الإدارة', icon: Settings }] : []),
  ]

  return (
    <nav 
      className="sticky top-0 z-50 border-b shadow-sm"
      style={{ 
        background: 'var(--bg-color)',
        borderColor: 'var(--border-color)'
      }}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
              <Image
                src="/logo.webp"
                alt="بان - دليل المحلات"
                fill
                sizes="56px"
                className="object-contain"
                priority
                suppressHydrationWarning
              />
            </div>
            <span 
              className="text-base sm:text-lg font-bold hidden sm:inline"
              style={{ color: 'var(--text-color)' }}
            >
              دليل المحلات
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  style={{
                    background: active ? 'rgba(var(--primary-color-rgb), 0.1)' : 'transparent',
                    color: active ? 'var(--primary-color)' : 'var(--text-color)'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--surface-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
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
                <div 
                  className="hidden sm:flex items-center gap-2.5 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors cursor-pointer group"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {userProfile?.avatar_url ? (
                    <div className="relative">
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name || user.email}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 object-cover shadow-sm transition-all"
                        style={{ borderColor: 'var(--border-color)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary-color)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)'
                        }}
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const fallback = document.createElement('div')
                            fallback.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-sm border-2'
                            fallback.style.background = 'var(--primary-color)'
                            fallback.style.borderColor = 'var(--border-color)'
                            fallback.textContent = (userProfile?.full_name?.[0] || userProfile?.email?.[0] || 'U').toUpperCase()
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                      <div 
                        className="absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full"
                        style={{ 
                          background: 'var(--status-online)',
                          borderColor: 'var(--bg-color)'
                        }}
                      ></div>
                    </div>
                  ) : (
                    <div 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-sm border-2 transition-all relative"
                      style={{ 
                        background: 'var(--primary-color)',
                        borderColor: 'var(--border-color)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-color)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)'
                      }}
                    >
                      {(userProfile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      <div 
                        className="absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full"
                        style={{ 
                          background: 'var(--status-online)',
                          borderColor: 'var(--bg-color)'
                        }}
                      ></div>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span 
                      className="text-sm sm:text-base font-medium hidden lg:inline truncate max-w-[150px]"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {userProfile?.full_name || user.email}
                    </span>
                    {userProfile?.is_admin && (
                      <span 
                        className="text-[10px] font-medium hidden lg:inline"
                        style={{ color: 'var(--status-error)' }}
                      >مدير</span>
                    )}
                    {userProfile?.is_affiliate && !userProfile?.is_admin && (
                      <span 
                        className="text-[10px] font-medium hidden lg:inline"
                        style={{ color: 'var(--status-warning)' }}
                      >مسوق</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                  title="تسجيل الخروج"
                >
                  <LogOut size={18} />
                  <span className="hidden lg:inline">خروج</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm"
                style={{ background: 'var(--primary-color)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                <User size={18} />
                <span>تسجيل الدخول</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-color)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden border-t py-3 space-y-1"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {visibleLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors"
                  style={{
                    background: active ? 'rgba(var(--primary-color-rgb), 0.1)' : 'transparent',
                    color: active ? 'var(--primary-color)' : 'var(--text-color)',
                    fontWeight: active ? 600 : 400
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--surface-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            {user ? (
              <div 
                className="border-t pt-2 mt-2"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div 
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-2"
                  style={{ background: 'var(--surface-color)' }}
                >
                  {userProfile?.avatar_url ? (
                    <div className="relative">
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name || user.email}
                        className="w-10 h-10 rounded-full border-2 object-cover shadow-sm"
                        style={{ borderColor: 'var(--border-color)' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const fallback = document.createElement('div')
                            fallback.className = 'w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shadow-sm border-2'
                            fallback.style.background = 'var(--primary-color)'
                            fallback.style.borderColor = 'var(--border-color)'
                            fallback.textContent = (userProfile?.full_name?.[0] || userProfile?.email?.[0] || 'U').toUpperCase()
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                      <div 
                        className="absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full"
                        style={{ 
                          background: 'var(--status-online)',
                          borderColor: 'var(--bg-color)'
                        }}
                      ></div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shadow-sm border-2"
                        style={{ 
                          background: 'var(--primary-color)',
                          borderColor: 'var(--border-color)'
                        }}
                      >
                        {(userProfile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                      <div 
                        className="absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full"
                        style={{ 
                          background: 'var(--status-online)',
                          borderColor: 'var(--bg-color)'
                        }}
                      ></div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {userProfile?.full_name || user.email}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {userProfile?.is_admin && (
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--status-error)'
                          }}
                        >مدير</span>
                      )}
                      {userProfile?.is_affiliate && !userProfile?.is_admin && (
                        <span 
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ 
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: 'var(--status-warning)'
                          }}
                        >مسوق</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-right"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <LogOut size={20} />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-white rounded-lg transition-colors mt-2"
                style={{ background: 'var(--primary-color)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
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
