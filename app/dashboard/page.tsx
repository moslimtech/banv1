'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, usePlaces, useMessages } from '@/hooks'
import Link from 'next/link'
import { Plus, Package as PackageIcon, MessageSquare, TrendingUp, Clock, Settings, Users, ChevronDown, FileCheck, LogOut } from 'lucide-react'
import { showSuccess, showError } from '@/components/SweetAlert'
import { LoadingSpinner } from '@/components/common'
import { Button, HeadlineLarge, HeadlineMedium, TitleMedium, TitleLarge, BodyMedium, BodySmall, LabelSmall } from '@/components/m3'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'

// Component that uses useSearchParams - must be wrapped in Suspense
function YouTubeAuthHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for YouTube auth result
    const youtubeAuth = searchParams?.get('youtube_auth')
    const error = searchParams?.get('error')
    
    if (youtubeAuth === 'success') {
      showSuccess('تم ربط حساب YouTube بنجاح! يمكنك الآن رفع الفيديوهات.')
      router.replace('/dashboard')
    } else if (error === 'youtube_auth_failed') {
      showError('فشل ربط حساب YouTube. يرجى المحاولة مرة أخرى.')
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  return null
}

export default function DashboardPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)

  // Use custom hooks for data fetching
  const { user, profile, loading: authLoading } = useAuth(true)
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  const { places, loading: placesLoading } = usePlaces({ 
    userId: user?.id, 
    autoLoad: true  // Always load when hook mounts
  })
  
  // Get place IDs for messages
  const placeIds = places.map(p => p.id)
  const { 
    messages, 
    loading: messagesLoading, 
    unreadCount 
  } = useMessages({ 
    placeId: placeIds.length > 0 ? placeIds : undefined,
    autoLoad: true  // Always load when hook mounts
  })

  const loading = authLoading || (user && placesLoading)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen app-bg-base">
      <Suspense fallback={null}>
        <YouTubeAuthHandler />
      </Suspense>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <HeadlineLarge className="mb-4 sm:mb-6">لوحة التحكم</HeadlineLarge>

        {/* User Profile Section - Mobile & Desktop */}
        {user && profile && (
          <div className="app-card rounded-3xl shadow-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || ''}
                    className="w-16 h-16 rounded-full border-2 object-cover shadow-sm"
                    style={{ borderColor: colors.outline }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.onPrimary,
                    }}
                  >
                    {(profile.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                {/* Online indicator */}
                <div 
                  className="absolute bottom-0 right-0 w-4 h-4 border-2 rounded-full"
                  style={{ 
                    backgroundColor: '#10b981',
                    borderColor: colors.surface
                  }}
                />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <TitleLarge className="truncate">
                  {profile.full_name || 'مستخدم'}
                </TitleLarge>
                <BodySmall color="onSurfaceVariant" className="truncate">
                  {user.email}
                </BodySmall>
                {/* Badges */}
                <div className="flex items-center gap-2 mt-1">
                  {profile.is_admin && (
                    <LabelSmall 
                      as="span"
                      className="px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: `rgba(239, 68, 68, 0.1)`,
                        color: colors.error
                      }}
                    >
                      مدير
                    </LabelSmall>
                  )}
                  {profile.is_affiliate && !profile.is_admin && (
                    <LabelSmall 
                      as="span"
                      className="px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: '#f59e0b'
                      }}
                    >
                      مسوق
                    </LabelSmall>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="text"
                size="sm"
                onClick={handleLogout}
                style={{ color: colors.error }}
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="app-card shadow p-4 sm:p-6 rounded-3xl">
            <div className="flex items-center gap-3 sm:gap-4">
              <PackageIcon className="flex-shrink-0 sm:w-8 sm:h-8 icon-primary" size={28} />
              <div>
                <BodyMedium color="onSurfaceVariant">الأماكن</BodyMedium>
                <HeadlineMedium>{places.length}</HeadlineMedium>
              </div>
            </div>
          </div>
          <Link
            href="#messages"
            className="app-card shadow p-4 sm:p-6 rounded-3xl hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <MessageSquare className="flex-shrink-0 sm:w-8 sm:h-8 icon-secondary" size={28} />
              <div className="flex-1 min-w-0">
                <BodyMedium color="onSurfaceVariant">الرسائل</BodyMedium>
                <div className="flex items-center gap-2 flex-wrap">
                  <HeadlineMedium>{messages.length}</HeadlineMedium>
                  {unreadCount > 0 && (
                    <LabelSmall 
                      as="span"
                      className="badge-error px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                    >
                      {unreadCount} غير مقروء
                    </LabelSmall>
                  )}
                </div>
              </div>
            </div>
          </Link>
          <div className="app-card shadow p-4 sm:p-6 rounded-3xl sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 sm:gap-4">
              <TrendingUp className="flex-shrink-0 sm:w-8 sm:h-8 icon-warning" size={28} />
              <div>
                <BodyMedium color="onSurfaceVariant">المشاهدات</BodyMedium>
                <HeadlineMedium>
                  {places.reduce((sum, p) => sum + p.total_views, 0)}
                </HeadlineMedium>
              </div>
            </div>
          </div>
        </div>

        <div className="app-card shadow p-4 sm:p-6 mb-4 sm:mb-6 rounded-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <TitleLarge>أماكني</TitleLarge>
            <Button
              variant="filled"
              size="md"
              onClick={() => router.push('/dashboard/places/new')}
              className="w-full sm:w-auto"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">إضافة مكان جديد</span>
              <span className="sm:hidden">إضافة مكان</span>
            </Button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/dashboard/places/${place.id}`}
                className="block p-3 sm:p-4 border rounded-2xl transition-colors app-hover-bg app-border"
              >
                <TitleMedium className="mb-1">{place.name_ar}</TitleMedium>
                <BodySmall color="onSurfaceVariant" className="mb-1">{place.category}</BodySmall>
                <LabelSmall color="onSurfaceVariant" className="mt-1.5 sm:mt-2">
                  المشاهدات: {place.total_views} | اليوم: {place.today_views}
                </LabelSmall>
              </Link>
            ))}
            {places.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <BodyMedium color="onSurfaceVariant">لا توجد أماكن بعد</BodyMedium>
              </div>
            )}
          </div>
        </div>

        {/* Messages Section */}
        {messages.length > 0 && (
          <div id="messages" className="app-card shadow p-4 sm:p-6 mb-4 sm:mb-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <TitleLarge>الرسائل الأخيرة</TitleLarge>
              {unreadCount > 0 && (
                <LabelSmall 
                  as="span"
                  className="badge-error px-2 sm:px-3 py-1 rounded-full"
                >
                  {unreadCount} رسالة غير مقروءة
                </LabelSmall>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.slice(0, 10).map((message) => {
                const place = places.find(p => p.id === message.place_id)
                const isUnread = !message.is_read && message.sender_id !== user?.id
                
                return (
                  <Link
                    key={message.id}
                    href={`/places/${message.place_id}`}
                    className={`block p-4 border rounded-2xl transition-colors app-border ${
                      isUnread ? '' : 'app-hover-bg'
                    }`}
                    style={isUnread ? {
                      background: 'rgba(var(--primary-color-rgb), 0.1)',
                      borderColor: 'var(--primary-color)'
                    } : {}}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TitleMedium className="truncate">
                            {place?.name_ar || 'مكان غير معروف'}
                          </TitleMedium>
                          {isUnread && (
                            <LabelSmall 
                              as="span"
                              className="badge-primary px-2 py-0.5 rounded-full flex-shrink-0"
                            >
                              جديد
                            </LabelSmall>
                          )}
                        </div>
                        {message.sender && (
                          <BodySmall color="onSurfaceVariant" className="mb-1">
                            من: {message.sender.full_name || message.sender.email || 'مستخدم'}
                          </BodySmall>
                        )}
                        {message.content ? (
                          <BodySmall className="line-clamp-2">{message.content}</BodySmall>
                        ) : message.image_url ? (
                          <BodySmall color="onSurfaceVariant" className="italic">صورة</BodySmall>
                        ) : null}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={14} />
                          <LabelSmall color="onSurfaceVariant">
                            {new Date(message.created_at).toLocaleString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </LabelSmall>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            {messages.length > 10 && (
              <p className="text-center text-sm app-text-muted mt-4">
                عرض {messages.length - 10} رسالة أخرى
              </p>
            )}
          </div>
        )}

        <div className="app-card shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 app-text-main">الباقات والاشتراكات</h2>
          <Link
            href="/dashboard/packages"
            className="link-primary"
          >
            عرض الباقات المتاحة والاشتراك
          </Link>
        </div>

        {profile?.is_admin && (
          <div className="app-card shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold app-text-main">لوحة الإدارة</h2>
              <div className="relative">
                <Button
                  variant="filled"
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="flex items-center gap-2"
                >
                  <Settings size={18} />
                  <span>لوحة الإدارة</span>
                  <ChevronDown size={18} className={`transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {adminMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-lg shadow-lg border z-10 overflow-hidden app-card app-border">
                    <Link
                      href="/admin"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b border-app"
                    >
                      <Settings size={18} className="icon-error" />
                      <span>لوحة الإدارة الرئيسية</span>
                    </Link>
                    <Link
                      href="/admin/packages"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b border-app"
                    >
                      <PackageIcon size={18} className="icon-primary" />
                      <span>إدارة الباقات</span>
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b border-app"
                    >
                      <Users size={18} className="icon-secondary" />
                      <span>المستخدمين</span>
                    </Link>
                    <Link
                      href="/admin/affiliates"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b border-app"
                    >
                      <TrendingUp size={18} className="icon-warning" />
                      <span>المسوقين</span>
                    </Link>
                    <Link
                      href="/admin/youtube"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b border-app"
                    >
                      <MessageSquare size={18} className="icon-accent" />
                      <span>إعدادات YouTube</span>
                    </Link>
                    <Link
                      href="/admin/discount-codes"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b border-app"
                    >
                      <PackageIcon size={18} className="icon-accent" />
                      <span>كوبونات الخصم</span>
                    </Link>
                    <Link
                      href="/admin/subscriptions"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b border-app"
                    >
                      <FileCheck size={18} className="icon-primary" />
                      <span>مراجعة الاشتراكات</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg"
                    >
                      <Settings size={18} className="icon-muted" />
                      <span>الإعدادات</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {profile?.is_affiliate && (
          <div className="app-card shadow p-6 rounded-3xl">
            <TitleLarge className="mb-4">التسويق بالعمولة</TitleLarge>
            <Link
              href="/dashboard/affiliate"
              className="link-primary"
            >
              عرض لوحة المسوق
            </Link>
          </div>
        )}

        {/* Legal & Privacy Links */}
        <div className="app-card shadow p-6 rounded-3xl">
          <TitleLarge className="mb-4">القانونية والخصوصية</TitleLarge>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/privacy-ar"
              className="link-primary"
            >
              سياسة الخصوصية (عربي)
            </Link>
            <span className="hidden sm:inline app-text-muted">•</span>
            <Link
              href="/dashboard/privacy"
              className="link-primary"
            >
              Privacy Policy (English)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
