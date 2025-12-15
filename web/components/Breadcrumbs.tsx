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

  const breadcrumbs = [
    { label: 'الرئيسية', href: '/' },
    ...pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/')
      const label = getDynamicLabel(segment, index)
      return { label, href }
    }),
  ]

  return (
    <nav className="bg-gray-50 border-b border-gray-200 py-2 sm:py-3">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronLeft size={14} className="text-gray-400 flex-shrink-0" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-medium flex items-center gap-1">
                  {index === 0 && <Home size={14} />}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
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
