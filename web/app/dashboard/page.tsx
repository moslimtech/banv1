'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserProfile, Place, Package, Message } from '@/lib/types'
import Link from 'next/link'
import { Plus, Package as PackageIcon, MessageSquare, TrendingUp, Clock, Settings, Users, ChevronDown, FileCheck } from 'lucide-react'
import { showSuccess, showError } from '@/components/SweetAlert'

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
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setUser(user)

    // Load profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    setProfile(profileData || null)

    // Load user places
    const { data: placesData } = await supabase
      .from('places')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setPlaces(placesData || [])

    // Load messages for all user places
    if (placesData && placesData.length > 0) {
      const placeIds = placesData.map(p => p.id)
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*, sender:user_profiles(*)')
        .in('place_id', placeIds)
        .order('created_at', { ascending: false })
        .limit(50)

      if (messagesError) {
        console.error('Error loading messages:', messagesError)
      } else if (messagesData) {
        setMessages(messagesData)
        // Count unread messages (messages not from the owner)
        const unread = messagesData.filter(
          msg => !msg.is_read && msg.sender_id !== user.id
        ).length
        setUnreadCount(unread)
      }
    } else {
      // No places, so no messages
      setMessages([])
      setUnreadCount(0)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary-color)' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen app-bg-base">
      <Suspense fallback={null}>
        <YouTubeAuthHandler />
      </Suspense>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 app-text-main">لوحة التحكم</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="app-card shadow p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <PackageIcon className="flex-shrink-0 sm:w-8 sm:h-8" size={28} style={{ color: 'var(--primary-color)' }} />
              <div>
                <p className="text-sm sm:text-base app-text-muted">الأماكن</p>
                <p className="text-xl sm:text-2xl font-bold app-text-main">{places.length}</p>
              </div>
            </div>
          </div>
          <Link
            href="#messages"
            className="app-card shadow p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <MessageSquare className="flex-shrink-0 sm:w-8 sm:h-8" size={28} style={{ color: 'var(--secondary-color)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base app-text-muted">الرسائل</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xl sm:text-2xl font-bold app-text-main">{messages.length}</p>
                  {unreadCount > 0 && (
                    <span className="text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full" style={{ background: 'var(--status-error)' }}>
                      {unreadCount} غير مقروء
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
          <div className="app-card shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 sm:gap-4">
              <TrendingUp className="flex-shrink-0 sm:w-8 sm:h-8" size={28} style={{ color: 'var(--status-warning)' }} />
              <div>
                <p className="text-sm sm:text-base app-text-muted">المشاهدات</p>
                <p className="text-xl sm:text-2xl font-bold app-text-main">
                  {places.reduce((sum, p) => sum + p.total_views, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="app-card shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold app-text-main">أماكني</h2>
            <Link
              href="/dashboard/places/new"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-white rounded-lg text-sm sm:text-base"
              style={{ background: 'var(--primary-color)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">إضافة مكان جديد</span>
              <span className="sm:hidden">إضافة مكان</span>
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/dashboard/places/${place.id}`}
                className="block p-3 sm:p-4 border rounded-lg transition-colors app-hover-bg app-border"
              >
                <h3 className="font-bold text-sm sm:text-base app-text-main mb-1">{place.name_ar}</h3>
                <p className="text-xs sm:text-sm app-text-muted mb-1">{place.category}</p>
                <p className="text-[10px] sm:text-xs app-text-muted mt-1.5 sm:mt-2">
                  المشاهدات: {place.total_views} | اليوم: {place.today_views}
                </p>
              </Link>
            ))}
            {places.length === 0 && (
              <p className="text-center text-sm sm:text-base app-text-muted py-6 sm:py-8">لا توجد أماكن بعد</p>
            )}
          </div>
        </div>

        {/* Messages Section */}
        {messages.length > 0 && (
          <div id="messages" className="app-card shadow p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold app-text-main">الرسائل الأخيرة</h2>
              {unreadCount > 0 && (
                <span className="text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full" style={{ background: 'var(--status-error)' }}>
                  {unreadCount} رسالة غير مقروءة
                </span>
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
                    className={`block p-4 border rounded-lg transition-colors app-border ${
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
                          <h3 className="font-semibold app-text-main truncate">
                            {place?.name_ar || 'مكان غير معروف'}
                          </h3>
                          {isUnread && (
                            <span className="text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--primary-color)' }}>
                              جديد
                            </span>
                          )}
                        </div>
                        {message.sender && (
                          <p className="text-sm app-text-muted mb-1">
                            من: {message.sender.full_name || message.sender.email || 'مستخدم'}
                          </p>
                        )}
                        {message.content ? (
                          <p className="text-sm app-text-main line-clamp-2">{message.content}</p>
                        ) : message.image_url ? (
                          <p className="text-sm app-text-muted italic">صورة</p>
                        ) : null}
                        <div className="flex items-center gap-2 mt-2 text-xs app-text-muted">
                          <Clock size={14} />
                          <span>
                            {new Date(message.created_at).toLocaleString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
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
            className="hover:underline"
            style={{ color: 'var(--primary-color)' }}
          >
            عرض الباقات المتاحة والاشتراك
          </Link>
        </div>

        {profile?.is_admin && (
          <div className="app-card shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold app-text-main">لوحة الإدارة</h2>
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                  style={{ background: 'var(--status-error)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Settings size={18} />
                  <span>لوحة الإدارة</span>
                  <ChevronDown size={18} className={`transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {adminMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-lg shadow-lg border z-10 overflow-hidden app-card app-border">
                    <Link
                      href="/admin"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <Settings size={18} style={{ color: 'var(--status-error)' }} />
                      <span>لوحة الإدارة الرئيسية</span>
                    </Link>
                    <Link
                      href="/admin/packages"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <PackageIcon size={18} style={{ color: 'var(--primary-color)' }} />
                      <span>إدارة الباقات</span>
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <Users size={18} style={{ color: 'var(--secondary-color)' }} />
                      <span>المستخدمين</span>
                    </Link>
                    <Link
                      href="/admin/affiliates"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <TrendingUp size={18} style={{ color: 'var(--status-warning)' }} />
                      <span>المسوقين</span>
                    </Link>
                    <Link
                      href="/admin/youtube"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <MessageSquare size={18} style={{ color: 'var(--accent)' }} />
                      <span>إعدادات YouTube</span>
                    </Link>
                    <Link
                      href="/admin/discount-codes"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <PackageIcon size={18} style={{ color: 'var(--accent)' }} />
                      <span>كوبونات الخصم</span>
                    </Link>
                    <Link
                      href="/admin/subscriptions"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg border-b"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <FileCheck size={18} style={{ color: 'var(--primary-color)' }} />
                      <span>مراجعة الاشتراكات</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors app-text-main app-hover-bg"
                    >
                      <Settings size={18} style={{ color: 'var(--text-muted)' }} />
                      <span>الإعدادات</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {profile?.is_affiliate && (
          <div className="app-card shadow p-6">
            <h2 className="text-xl font-bold mb-4 app-text-main">التسويق بالعمولة</h2>
            <Link
              href="/dashboard/affiliate"
              className="hover:underline"
              style={{ color: 'var(--primary-color)' }}
            >
              عرض لوحة المسوق
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
