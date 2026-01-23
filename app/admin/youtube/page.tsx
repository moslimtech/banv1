'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'
import { showSuccess, showError } from '@/components/SweetAlert'
import { CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react'

// Component that uses useSearchParams - must be wrapped in Suspense
function YouTubeAuthHandler({ onAuthCheck }: { onAuthCheck: () => void }) {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for auth result after component mounts
    if (typeof window === 'undefined' || !searchParams) return
    
    const youtubeAuth = searchParams.get('youtube_auth')
    const error = searchParams.get('error')
    
    if (youtubeAuth === 'success') {
      showSuccess('تم ربط حساب YouTube بنجاح!')
      // Reload credentials
      setTimeout(() => {
        onAuthCheck()
        router.replace('/admin/youtube')
      }, 500)
    } else if (error === 'youtube_auth_failed') {
      showError('فشل ربط حساب YouTube. يرجى المحاولة مرة أخرى.')
      router.replace('/admin/youtube')
    }
     
  }, [searchParams, router, onAuthCheck])

  return null
}

export default function AdminYouTubePage() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showTokens, setShowTokens] = useState(false)

  useEffect(() => {
    checkAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirect=/admin/youtube')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData?.is_admin) {
        showError('غير مصرح لك بالوصول إلى هذه الصفحة')
        router.push('/dashboard')
        return
      }

      setProfile(profileData)
      setLoading(false)
      // Check YouTube auth after loading profile
      await checkYouTubeAuth()
    } catch (error) {
      console.error('Error checking admin:', error)
      router.push('/dashboard')
    }
  }

  const checkYouTubeAuth = async () => {
    if (!user) {
      // Try to get any admin user's credentials
      const { data: adminProfile } = await supabase
        .from('user_profiles')
        .select('youtube_access_token, youtube_refresh_token, youtube_token_expiry')
        .eq('is_admin', true)
        .not('youtube_access_token', 'is', null)
        .limit(1)
        .single()

      if (adminProfile) {
        setIsAuthenticated(true)
        setProfile(adminProfile)
        return
      }
      return
    }

    // Check current user first
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('youtube_access_token, youtube_refresh_token, youtube_token_expiry')
      .eq('id', user.id)
      .single()

    if (profileData?.youtube_access_token) {
      setIsAuthenticated(true)
      setProfile(profileData)
    } else {
      // Fallback: check any admin user
      const { data: adminProfile } = await supabase
        .from('user_profiles')
        .select('youtube_access_token, youtube_refresh_token, youtube_token_expiry')
        .eq('is_admin', true)
        .not('youtube_access_token', 'is', null)
        .limit(1)
        .single()

      if (adminProfile) {
        setIsAuthenticated(true)
        setProfile(adminProfile)
      } else {
        setIsAuthenticated(false)
      }
    }
  }

  const authenticateYouTube = async () => {
    try {
      // Get auth URL
      const response = await fetch('/api/youtube/auth')
      const data = await response.json()

      if (data.authUrl) {
        // Redirect to YouTube OAuth with 'admin' state
        window.location.href = `${data.authUrl}&state=admin`
      } else {
        showError('فشل في الحصول على رابط المصادقة')
      }
    } catch (error: any) {
      console.error('Error authenticating:', error)
      showError('حدث خطأ في المصادقة مع YouTube')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('تم النسخ إلى الحافظة')
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: colors.primary }}
        ></div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen py-8"
      style={{ backgroundColor: colors.background }}
    >
      <Suspense fallback={null}>
        <YouTubeAuthHandler onAuthCheck={checkYouTubeAuth} />
      </Suspense>
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 
          className="text-3xl font-bold mb-6"
          style={{ color: colors.onSurfaceVariant }}
        >
          إعدادات YouTube
        </h1>

        <div 
          className="shadow-lg p-6 space-y-6 rounded-3xl"
          style={{ backgroundColor: colors.surface }}
        >
          <div>
            <h2 
              className="text-xl font-bold mb-4"
              style={{ color: colors.onSurfaceVariant }}
            >
              حساب YouTube للموقع
            </h2>
            <p 
              className="mb-4"
              style={{ color: colors.onSurfaceVariant }}
            >
              جميع الفيديوهات التي يرفعها المستخدمون ستُرفع على حساب YouTube الخاص بك.
              يجب ربط حساب YouTube مرة واحدة فقط.
            </p>
          </div>

          {isAuthenticated ? (
            <>
              <div 
                className="p-4 border rounded-xl"
                style={{
                  backgroundColor: `${colors.success}15`,
                  borderColor: colors.success,
                }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle style={{ color: colors.success }} className="mt-1" size={24} />
                  <div className="flex-1">
                    <p 
                      className="font-semibold mb-2"
                      style={{ color: colors.success }}
                    >
                      حساب YouTube مربوط بنجاح
                    </p>
                    <p 
                      className="text-sm mb-3 opacity-80"
                      style={{ color: colors.success }}
                    >
                      يمكن للمستخدمين الآن رفع الفيديوهات على حسابك في YouTube.
                    </p>
                    <button
                      onClick={authenticateYouTube}
                      className="px-6 py-3 rounded-full transition-all font-semibold hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: colors.primary,
                        color: colors.onPrimary,
                      }}
                    >
                      إعادة ربط الحساب
                    </button>
                  </div>
                </div>
              </div>

              <div 
                className="border-t pt-6"
                style={{ borderColor: colors.outline }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 
                    className="font-semibold"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    Credentials للتخزين في .env.local (اختياري)
                  </h3>
                  <button
                    onClick={() => setShowTokens(!showTokens)}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: colors.surfaceContainer,
                      color: colors.primary,
                    }}
                  >
                    {showTokens ? 'إخفاء' : 'عرض'}
                  </button>
                </div>

                {showTokens && profile && (
                  <div 
                    className="space-y-4 p-4 rounded-lg"
                    style={{ backgroundColor: colors.surfaceVariant }}
                  >
                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: colors.onSurfaceVariant }}
                      >
                        YOUTUBE_ACCESS_TOKEN
                      </label>
                      <div className="flex gap-2">
                        <code 
                          className="flex-1 p-3 rounded border text-sm break-all"
                          style={{
                            backgroundColor: colors.surface,
                            borderColor: colors.outline,
                            color: colors.onSurfaceVariant,
                          }}
                        >
                          {profile.youtube_access_token || 'غير متاح'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`YOUTUBE_ACCESS_TOKEN=${profile.youtube_access_token}`)}
                          className="px-3 py-2 rounded flex items-center gap-2 transition-colors"
                          style={{
                            backgroundColor: colors.surfaceContainer,
                            color: colors.onSurfaceVariant,
                          }}
                          title="نسخ"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: colors.onSurfaceVariant }}
                      >
                        YOUTUBE_REFRESH_TOKEN
                      </label>
                      <div className="flex gap-2">
                        <code 
                          className="flex-1 p-3 rounded border text-sm break-all"
                          style={{
                            backgroundColor: colors.surface,
                            borderColor: colors.outline,
                            color: colors.onSurfaceVariant,
                          }}
                        >
                          {profile.youtube_refresh_token || 'غير متاح'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`YOUTUBE_REFRESH_TOKEN=${profile.youtube_refresh_token}`)}
                          className="px-3 py-2 rounded flex items-center gap-2 transition-colors"
                          style={{
                            backgroundColor: colors.surfaceContainer,
                            color: colors.onSurfaceVariant,
                          }}
                          title="نسخ"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    {profile.youtube_token_expiry && (
                      <div>
                        <label 
                          className="block text-sm font-medium mb-2"
                          style={{ color: colors.onSurfaceVariant }}
                        >
                          YOUTUBE_TOKEN_EXPIRY
                        </label>
                        <div className="flex gap-2">
                          <code 
                            className="flex-1 p-3 rounded border text-sm"
                            style={{
                              backgroundColor: colors.surface,
                              borderColor: colors.outline,
                              color: colors.onSurfaceVariant,
                            }}
                          >
                            {profile.youtube_token_expiry}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`YOUTUBE_TOKEN_EXPIRY=${profile.youtube_token_expiry}`)}
                            className="px-3 py-2 rounded flex items-center gap-2 transition-colors"
                            style={{
                              backgroundColor: colors.surfaceContainer,
                              color: colors.onSurfaceVariant,
                            }}
                            title="نسخ"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div 
                      className="mt-4 p-3 rounded border"
                      style={{
                        backgroundColor: `${colors.info}15`,
                        borderColor: colors.info,
                      }}
                    >
                      <p 
                        className="text-sm"
                        style={{ color: colors.info }}
                      >
                        <strong>ملاحظة:</strong> انسخ هذه القيم وأضفها في ملف <code 
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: colors.surface }}
                        >.env.local</code> في مجلد <code 
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: colors.surface }}
                        >web</code>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div 
              className="p-4 border rounded-xl"
              style={{
                backgroundColor: `${colors.warning}15`,
                borderColor: colors.warning,
              }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle style={{ color: colors.warning }} className="mt-1" size={24} />
                <div className="flex-1">
                  <p 
                    className="font-semibold mb-2"
                    style={{ color: colors.warning }}
                  >
                    يجب ربط حساب YouTube أولاً
                  </p>
                  <p 
                    className="text-sm mb-3 opacity-80"
                    style={{ color: colors.warning }}
                  >
                    لرفع الفيديوهات إلى YouTube، يجب السماح للتطبيق بالوصول إلى قناة YouTube الخاصة بك.
                  </p>
                  <button
                    onClick={authenticateYouTube}
                    className="px-6 py-3 rounded-full transition-all font-semibold flex items-center gap-2 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: colors.error,
                      color: colors.onPrimary,
                    }}
                  >
                    <ExternalLink size={18} />
                    ربط حساب YouTube
                  </button>
                </div>
              </div>
            </div>
          )}

          <div 
            className="border-t pt-6"
            style={{ borderColor: colors.outline }}
          >
            <h3 
              className="font-semibold mb-2"
              style={{ color: colors.onSurfaceVariant }}
            >
              معلومات مهمة:
            </h3>
            <ul 
              className="list-disc list-inside space-y-2 text-sm"
              style={{ color: colors.onSurfaceVariant }}
            >
              <li>جميع الفيديوهات تُرفع على حسابك في YouTube</li>
              <li>يمكنك اختيار حالة الخصوصية لكل فيديو (خاص/غير مدرج/عام)</li>
              <li>لا يحتاج المستخدمون لربط حسابات YouTube الخاصة بهم</li>
              <li>يمكنك إدارة جميع الفيديوهات من قناة YouTube الخاصة بك</li>
              <li>يمكن حفظ credentials في <code 
                className="px-1 rounded"
                style={{ backgroundColor: colors.surfaceVariant }}
              >.env.local</code> لتجنب الاعتماد على قاعدة البيانات</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
