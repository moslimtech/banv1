'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotifications } from '@/hooks/useNotifications'
import { getBottomNavigation, getUserRole, isNavigationItemActive } from '@/config/navigation'

export default function BottomNavigation() {
  const pathname = usePathname()
  const { user, profile } = useAuthContext()
  const { colors } = useTheme()
  const { unreadCount } = useNotifications(user?.id)

  // Get navigation items from unified config
  const role = getUserRole(profile)
  const navItems = getBottomNavigation(role)

  // Don't show on certain pages
  if (pathname.startsWith('/auth/') || pathname.startsWith('/places/')) {
    return null
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t safe-area-bottom"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.outline,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = isNavigationItemActive(item, pathname)
          
          // Add notification badge for messages
          const badge = item.id === 'messages' ? unreadCount : item.badge

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 relative min-w-[64px]"
              style={{
                backgroundColor: isActive 
                  ? `rgba(${colors.primaryRgb}, 0.12)` 
                  : 'transparent',
                color: isActive ? colors.primary : colors.onSurface,
              }}
            >
              {/* Icon with badge */}
              <div className="relative">
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-all duration-200"
                  style={{
                    filter: isActive ? `drop-shadow(0 2px 4px rgba(${colors.primaryRgb}, 0.3))` : 'none',
                  }}
                />
                {badge && Number(badge) > 0 && (
                  <div
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold rounded-full px-1"
                    style={{
                      backgroundColor: colors.error,
                      color: colors.onPrimary,
                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    {Number(badge) > 9 ? '9+' : badge}
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                className="text-[10px] font-medium transition-all duration-200 line-clamp-1"
                style={{
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: isActive ? '0.02em' : 'normal',
                }}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-t-full"
                  style={{ backgroundColor: colors.primary }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
