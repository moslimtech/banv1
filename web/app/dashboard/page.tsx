'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserProfile, Place, Package, Message } from '@/lib/types'
import Link from 'next/link'
import { Plus, Package as PackageIcon, MessageSquare, TrendingUp, Clock } from 'lucide-react'
import { showSuccess, showError } from '@/components/SweetAlert'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    
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
  }, [searchParams])

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
      .single()

    setProfile(profileData)

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">لوحة التحكم</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <PackageIcon className="text-blue-500" size={32} />
              <div>
                <p className="text-gray-600">الأماكن</p>
                <p className="text-2xl font-bold">{places.length}</p>
              </div>
            </div>
          </div>
          <Link
            href="#messages"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <MessageSquare className="text-green-500" size={32} />
              <div className="flex-1">
                <p className="text-gray-600">الرسائل</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{messages.length}</p>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount} غير مقروء
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="text-yellow-500" size={32} />
              <div>
                <p className="text-gray-600">المشاهدات</p>
                <p className="text-2xl font-bold">
                  {places.reduce((sum, p) => sum + p.total_views, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">أماكني</h2>
            <Link
              href="/dashboard/places/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus size={20} />
              إضافة مكان جديد
            </Link>
          </div>
          <div className="space-y-4">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/dashboard/places/${place.id}`}
                className="block p-4 border rounded-lg hover:bg-gray-50"
              >
                <h3 className="font-bold text-gray-900">{place.name_ar}</h3>
                <p className="text-sm text-gray-600">{place.category}</p>
                <p className="text-xs text-gray-500 mt-2">
                  المشاهدات: {place.total_views} | اليوم: {place.today_views}
                </p>
              </Link>
            ))}
            {places.length === 0 && (
              <p className="text-center text-gray-500 py-8">لا توجد أماكن بعد</p>
            )}
          </div>
        </div>

        {/* Messages Section */}
        {messages.length > 0 && (
          <div id="messages" className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">الرسائل الأخيرة</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">
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
                    className={`block p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      isUnread ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {place?.name_ar || 'مكان غير معروف'}
                          </h3>
                          {isUnread && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                              جديد
                            </span>
                          )}
                        </div>
                        {message.sender && (
                          <p className="text-sm text-gray-600 mb-1">
                            من: {message.sender.full_name || message.sender.email || 'مستخدم'}
                          </p>
                        )}
                        {message.content ? (
                          <p className="text-sm text-gray-700 line-clamp-2">{message.content}</p>
                        ) : message.image_url ? (
                          <p className="text-sm text-gray-500 italic">صورة</p>
                        ) : null}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
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
              <p className="text-center text-sm text-gray-500 mt-4">
                عرض {messages.length - 10} رسالة أخرى
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">الباقات والاشتراكات</h2>
          <Link
            href="/dashboard/packages"
            className="text-blue-500 hover:underline"
          >
            عرض الباقات المتاحة والاشتراك
          </Link>
        </div>

        {profile?.is_admin && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">لوحة الإدارة</h2>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              الوصول إلى لوحة الإدارة
            </Link>
          </div>
        )}

        {profile?.is_affiliate && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">التسويق بالعمولة</h2>
            <Link
              href="/dashboard/affiliate"
              className="text-blue-500 hover:underline"
            >
              عرض لوحة المسوق
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
