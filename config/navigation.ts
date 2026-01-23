/**
 * Unified Navigation Configuration
 * 
 * Central source of truth for all navigation items across the app.
 * Used by:
 * - Desktop Sidebar
 * - Mobile Bottom Navigation
 * - NavBar
 * 
 * Features:
 * - Role-based visibility (Admin, Affiliate, User)
 * - Icon configuration
 * - Route definitions
 * - Badge support (for notifications)
 * - Active state detection
 */

import { 
  Home, 
  MessageCircle, 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Settings, 
  Users,
  MapPin,
  type LucideIcon 
} from 'lucide-react'

export type UserRole = 'admin' | 'affiliate' | 'user' | 'guest'

export interface NavigationItem {
  id: string
  label: string
  labelEn?: string
  icon: LucideIcon
  href: string
  badge?: number | string
  /** Roles that can see this item */
  visibleFor: UserRole[]
  /** Exact match for active state (default: false) */
  exactMatch?: boolean
  /** Desktop only (don't show in bottom nav) */
  desktopOnly?: boolean
  /** Mobile only (don't show in sidebar) */
  mobileOnly?: boolean
  /** Group for organization in sidebar */
  group?: 'main' | 'secondary' | 'admin'
}

/**
 * Primary Navigation Items
 * Shown to all users (filtered by role)
 */
export const primaryNavigation: NavigationItem[] = [
  {
    id: 'home',
    label: 'الرئيسية',
    labelEn: 'Home',
    icon: Home,
    href: '/',
    visibleFor: ['admin', 'affiliate', 'user', 'guest'],
    exactMatch: true,
    group: 'main',
  },
  {
    id: 'places',
    label: 'الأماكن',
    labelEn: 'Places',
    icon: MapPin,
    href: '/places',
    visibleFor: ['admin', 'affiliate', 'user', 'guest'],
    group: 'main',
  },
  {
    id: 'messages',
    label: 'المحادثات',
    labelEn: 'Messages',
    icon: MessageCircle,
    href: '/messages',
    visibleFor: ['admin', 'affiliate', 'user'],
    group: 'main',
  },
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    labelEn: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    visibleFor: ['admin', 'affiliate', 'user'],
    group: 'main',
  },
]

/**
 * User Dashboard Items
 * Shown in dashboard or as secondary navigation
 */
export const userDashboardNavigation: NavigationItem[] = [
  {
    id: 'dashboard-home',
    label: 'نظرة عامة',
    labelEn: 'Overview',
    icon: Home,
    href: '/dashboard',
    visibleFor: ['user'],
    exactMatch: true,
    desktopOnly: true,
    group: 'secondary',
  },
  {
    id: 'dashboard-places',
    label: 'أماكني',
    labelEn: 'My Places',
    icon: MapPin,
    href: '/dashboard/places',
    visibleFor: ['user'],
    desktopOnly: true,
    group: 'secondary',
  },
  {
    id: 'dashboard-packages',
    label: 'الباقات',
    labelEn: 'Packages',
    icon: Package,
    href: '/dashboard/packages',
    visibleFor: ['user'],
    desktopOnly: true,
    group: 'secondary',
  },
]

/**
 * Affiliate Navigation Items
 * Shown only to affiliates (users with record in affiliates table)
 */
export const affiliateNavigation: NavigationItem[] = [
  {
    id: 'affiliate-dashboard',
    label: 'أرباحي',
    labelEn: 'My Earnings',
    icon: TrendingUp,
    href: '/dashboard/affiliate',
    visibleFor: ['affiliate'],
    desktopOnly: true,
    group: 'secondary',
  },
]

/**
 * Admin Navigation Items
 * Shown only to admins
 */
export const adminNavigation: NavigationItem[] = [
  {
    id: 'admin-dashboard',
    label: 'لوحة الإدارة',
    labelEn: 'Admin Panel',
    icon: Settings,
    href: '/admin',
    visibleFor: ['admin'],
    exactMatch: true,
    desktopOnly: true,
    group: 'admin',
  },
  {
    id: 'admin-users',
    label: 'المستخدمين',
    labelEn: 'Users',
    icon: Users,
    href: '/admin/users',
    visibleFor: ['admin'],
    desktopOnly: true,
    group: 'admin',
  },
  {
    id: 'admin-packages',
    label: 'الباقات',
    labelEn: 'Packages',
    icon: Package,
    href: '/admin/packages',
    visibleFor: ['admin'],
    desktopOnly: true,
    group: 'admin',
  },
  {
    id: 'admin-affiliates',
    label: 'المسوقين',
    labelEn: 'Affiliates',
    icon: TrendingUp,
    href: '/admin/affiliates',
    visibleFor: ['admin'],
    desktopOnly: true,
    group: 'admin',
  },
]

/**
 * Get all navigation items for a specific role
 */
export function getNavigationForRole(role: UserRole): NavigationItem[] {
  const allItems = [
    ...primaryNavigation,
    ...userDashboardNavigation,
    ...affiliateNavigation,
    ...adminNavigation,
  ]

  return allItems.filter(item => item.visibleFor.includes(role))
}

/**
 * Get navigation items for bottom nav (mobile)
 * Excludes desktopOnly items, max 5 items
 */
export function getBottomNavigation(role: UserRole): NavigationItem[] {
  const items = getNavigationForRole(role)
    .filter(item => !item.desktopOnly)
    .slice(0, 5) // Bottom nav max 5 items

  return items
}

/**
 * Get navigation items for sidebar (desktop)
 * Excludes mobileOnly items, grouped
 */
export function getSidebarNavigation(role: UserRole): {
  main: NavigationItem[]
  secondary: NavigationItem[]
  admin: NavigationItem[]
} {
  const items = getNavigationForRole(role).filter(item => !item.mobileOnly)

  return {
    main: items.filter(item => item.group === 'main'),
    secondary: items.filter(item => item.group === 'secondary'),
    admin: items.filter(item => item.group === 'admin'),
  }
}

/**
 * Check if a path is active for a navigation item
 */
export function isNavigationItemActive(
  item: NavigationItem,
  currentPath: string
): boolean {
  if (item.exactMatch) {
    return currentPath === item.href
  }
  return currentPath.startsWith(item.href)
}

/**
 * Get the current user's role
 */
export function getUserRole(profile: {
  is_admin?: boolean
  is_affiliate?: boolean
} | null): UserRole {
  if (!profile) return 'guest'
  if (profile.is_admin) return 'admin'
  if (profile.is_affiliate) return 'affiliate'
  return 'user'
}
