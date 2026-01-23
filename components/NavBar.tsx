'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotifications } from '@/hooks/useNotifications'
import { getNavigationForRole, getUserRole, isNavigationItemActive } from '@/config/navigation'
import { LogOut, User, Moon, Sun } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { TitleMedium, LabelMedium, LabelSmall, Button } from '@/components/m3'

export default function NavBar() {
  const pathname = usePathname()
  const { user, profile } = useAuthContext()
  const { colors, isDark, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications(user?.id)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Get navigation items from unified config
  const role = getUserRole(profile)
  const navItems = getNavigationForRole(role)
    .filter(item => item.group === 'main') // Only main navigation in header
    .map(item => {
      // Add notification badge for messages
      if (item.id === 'messages' && unreadCount > 0) {
        return { ...item, badge: unreadCount }
      }
      return item
    })

  return (
    <nav 
      className="sticky top-0 z-50 border-b shadow-sm"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.outline
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
            <TitleMedium className="hidden sm:inline">
              دليل المحلات
            </TitleMedium>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isNavigationItemActive(item, pathname)
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium"
                  style={{
                    backgroundColor: active 
                      ? `rgba(${colors.primaryRgb}, 0.12)` 
                      : 'transparent',
                    color: active ? colors.primary : colors.onSurface,
                    fontWeight: active ? 600 : 500
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = colors.surfaceVariant
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1"
                      style={{
                        backgroundColor: colors.error,
                        color: colors.onPrimary,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-all"
              style={{ 
                color: colors.onSurface,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surfaceVariant
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell userId={user.id} />
                <div 
                  className="hidden sm:flex items-center gap-2.5 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors cursor-pointer group"
                  style={{ color: colors.onSurface }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.surfaceVariant
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {profile?.avatar_url ? (
                    <div className="relative">
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || user.email || ''}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 object-cover shadow-sm transition-all"
                        style={{ borderColor: colors.outline }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = colors.primary
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = colors.outline
                        }}
                      />
                      <div 
                        className="absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full"
                        style={{ 
                          backgroundColor: '#10b981',
                          borderColor: colors.surface
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-sm border-2 transition-all relative"
                      style={{ 
                        backgroundColor: colors.primary,
                        borderColor: colors.outline
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.outline
                      }}
                    >
                      {(profile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      <div 
                        className="absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full"
                        style={{ 
                          backgroundColor: '#10b981',
                          borderColor: colors.surface
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <LabelMedium className="hidden lg:inline truncate max-w-[150px]">
                      {profile?.full_name || user.email}
                    </LabelMedium>
                    {profile?.is_admin && (
                      <LabelSmall 
                        className="hidden lg:inline"
                        style={{ color: colors.error }}
                      >
                        مدير
                      </LabelSmall>
                    )}
                    {profile?.is_affiliate && !profile?.is_admin && (
                      <LabelSmall 
                        className="hidden lg:inline"
                        style={{ color: '#f59e0b' }}
                      >
                        مسوق
                      </LabelSmall>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full border transition-all text-sm font-medium"
                  style={{
                    borderColor: colors.outline,
                    color: colors.onSurface
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.primary
                    e.currentTarget.style.color = colors.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.outline
                    e.currentTarget.style.color = colors.onSurface
                  }}
                  title="تسجيل الخروج"
                >
                  <LogOut size={18} />
                  <span className="hidden lg:inline">خروج</span>
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="hidden sm:flex">
                <Button variant="filled" size="sm">
                  <User size={18} />
                  <span>تسجيل الدخول</span>
                </Button>
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  )
}
