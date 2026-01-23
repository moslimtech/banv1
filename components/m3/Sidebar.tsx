/**
 * Material Design 3 Sidebar Navigation
 * 
 * Desktop-only sidebar (hidden on mobile)
 * 
 * Features:
 * - Role-based navigation items
 * - Grouped navigation (main, secondary, admin)
 * - Active state detection
 * - Collapsible
 * - M3 design tokens
 * 
 * Usage:
 * <Sidebar />
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme, type ThemeColors } from '@/contexts/ThemeContext'
import { getSidebarNavigation, getUserRole, isNavigationItemActive, type NavigationItem } from '@/config/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarSectionProps {
  title?: string
  items: NavigationItem[]
  pathname: string
  colors: ThemeColors
  collapsed: boolean
}

function SidebarSection({ title, items, pathname, colors, collapsed }: SidebarSectionProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-6">
      {title && !collapsed && (
        <div className="px-4 mb-2">
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: colors.onSurface, opacity: 0.6 }}
          >
            {title}
          </h3>
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = isNavigationItemActive(item, pathname)

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 transition-all duration-300 relative group"
              style={{
                backgroundColor: isActive
                  ? `rgba(${colors.primaryRgb}, 0.16)` // Stronger active state
                  : 'transparent',
                color: isActive ? colors.primary : colors.onSurface,
                borderRadius: collapsed ? '12px' : '16px', // M3 pill-like shape
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
              }}
              title={collapsed ? item.label : undefined}
            >
              {/* M3 Active Pill Indicator (Enhanced right-side bar) */}
              {isActive && (
                <div
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1.5 h-10 rounded-l-full transition-all duration-300"
                  style={{ 
                    backgroundColor: colors.primary,
                    boxShadow: `0 0 12px rgba(${colors.primaryRgb}, 0.6)`, // Gold glow effect
                  }}
                />
              )}

              {/* Icon with enhanced active state */}
              <Icon
                size={24}
                strokeWidth={isActive ? 2.8 : 2}
                className="flex-shrink-0 transition-all duration-200"
                style={{
                  filter: isActive ? 'drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3))' : 'none',
                }}
              />

              {/* Label */}
              {!collapsed && (
                <>
                  <span 
                    className="flex-1 text-base transition-all duration-200"
                    style={{
                      fontWeight: isActive ? 700 : 500, // Bolder when active
                      letterSpacing: isActive ? '0.02em' : 'normal',
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Badge with pulse animation */}
                  {item.badge && (
                    <div
                      className="min-w-[20px] h-5 flex items-center justify-center text-[11px] font-bold rounded-full px-2 animate-pulse"
                      style={{
                        backgroundColor: colors.error,
                        color: colors.onPrimary,
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      {item.badge}
                    </div>
                  )}
                </>
              )}

              {/* Enhanced hover effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                style={{
                  backgroundColor: isActive
                    ? `rgba(${colors.primaryRgb}, 0.08)` // Subtle hover on active
                    : `rgba(${colors.primaryRgb}, 0.08)`,
                  borderRadius: collapsed ? '12px' : '16px',
                }}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { profile } = useAuthContext()
  const { colors } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  const role = getUserRole(profile)
  const navigation = getSidebarNavigation(role)

  return (
    <aside
      className="hidden lg:flex flex-col fixed right-0 top-16 bottom-0 border-l app-bg-main z-40 transition-all duration-300"
      style={{
        width: collapsed ? '80px' : '280px',
        borderColor: colors.outline,
      }}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-4 w-6 h-6 rounded-full border flex items-center justify-center app-bg-main transition-all hover:scale-110"
        style={{
          borderColor: colors.outline,
          color: colors.onSurface,
        }}
      >
        {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto py-6 px-2">
        {/* Main Navigation */}
        <SidebarSection
          items={navigation.main}
          pathname={pathname}
          colors={colors}
          collapsed={collapsed}
        />

        {/* Secondary Navigation */}
        {navigation.secondary.length > 0 && (
          <>
            {!collapsed && <div className="border-t mx-4 my-4" style={{ borderColor: colors.outline }} />}
            <SidebarSection
              title={!collapsed ? "حسابي" : undefined}
              items={navigation.secondary}
              pathname={pathname}
              colors={colors}
              collapsed={collapsed}
            />
          </>
        )}

        {/* Admin Navigation */}
        {navigation.admin.length > 0 && (
          <>
            {!collapsed && <div className="border-t mx-4 my-4" style={{ borderColor: colors.outline }} />}
            <SidebarSection
              title={!collapsed ? "الإدارة" : undefined}
              items={navigation.admin}
              pathname={pathname}
              colors={colors}
              collapsed={collapsed}
            />
          </>
        )}
      </div>

      {/* Footer (optional) */}
      {!collapsed && profile && (
        <div className="border-t p-4" style={{ borderColor: colors.outline }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
              style={{
                backgroundColor: colors.primary,
                color: colors.onPrimary,
              }}
            >
              {profile.full_name?.[0] || profile.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: colors.onSurface }}>
                {profile.full_name || 'مستخدم'}
              </p>
              <p className="text-xs truncate" style={{ color: colors.onSurface, opacity: 0.6 }}>
                {profile.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
