'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Home } from 'lucide-react'

export default function Breadcrumbs() {
  const pathname = usePathname()

  // Don't show breadcrumbs on home page
  if (pathname === '/') return null

  const pathSegments = pathname.split('/').filter(Boolean)
  
  const breadcrumbMap: Record<string, string> = {
    'dashboard': 'لوحة التحكم',
    'admin': 'لوحة الإدارة',
    'places': 'الأماكن',
    'auth': 'المصادقة',
    'login': 'تسجيل الدخول',
    'packages': 'الباقات',
    'affiliate': 'التسويق بالعمولة',
    'users': 'المستخدمين',
    'affiliates': 'المسوقين',
    'discount-codes': 'أكواد الخصم',
    'settings': 'الإعدادات',
    'youtube': 'YouTube',
    'products': 'المنتجات',
    'new': 'جديد',
  }

  // Get place/product name from URL if it's a dynamic route
  const getDynamicLabel = (segment: string, index: number) => {
    // If it's a UUID or ID, try to get the actual name
    // For now, we'll just show a generic label
    if (segment.length > 20 && /^[a-f0-9-]+$/i.test(segment)) {
      if (pathSegments[index - 1] === 'places') {
        return 'تفاصيل المكان'
      }
      if (pathSegments[index - 1] === 'products') {
        return 'تفاصيل المنتج'
      }
    }
    return breadcrumbMap[segment] || segment
  }

  const breadcrumbs = [
    { label: 'الرئيسية', href: '/' },
    ...pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/')
      const label = getDynamicLabel(segment, index)
      return { label, href }
    }),
  ]

  return (
    <nav className="py-2 sm:py-3 border-b app-bg-surface app-border">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronLeft size={14} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="app-text-main font-medium flex items-center gap-1">
                  {index === 0 && <Home size={14} />}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="app-text-muted transition-colors flex items-center gap-1"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {index === 0 && <Home size={14} />}
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}
