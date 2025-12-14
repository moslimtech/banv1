'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showSuccess, showError } from '@/components/SweetAlert'
import { CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react'

// Component that uses useSearchParams - must be wrapped in Suspense
function YouTubeAuthHandler({ onAuthCheck }: { onAuthCheck: () => void }) {
  const router = useRouter()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, onAuthCheck])

  return null
}

export default function AdminYouTubePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showTokens, setShowTokens] = useState(false)

  useEffect(() => {
    checkAdmin()
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Suspense fallback={null}>
        <YouTubeAuthHandler onAuthCheck={checkYouTubeAuth} />
      </Suspense>
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">إعدادات YouTube</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-900">حساب YouTube للموقع</h2>
            <p className="text-gray-600 mb-4">
              جميع الفيديوهات التي يرفعها المستخدمون ستُرفع على حساب YouTube الخاص بك.
              يجب ربط حساب YouTube مرة واحدة فقط.
            </p>
          </div>

          {isAuthenticated ? (
            <>
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 mt-1" size={24} />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-2">
                      حساب YouTube مربوط بنجاح
                    </p>
                    <p className="text-sm text-green-700 mb-3">
                      يمكن للمستخدمين الآن رفع الفيديوهات على حسابك في YouTube.
                    </p>
                    <button
                      onClick={authenticateYouTube}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      إعادة ربط الحساب
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Credentials للتخزين في .env.local (اختياري)</h3>
                  <button
                    onClick={() => setShowTokens(!showTokens)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {showTokens ? 'إخفاء' : 'عرض'}
                  </button>
                </div>

                {showTokens && profile && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        YOUTUBE_ACCESS_TOKEN
                      </label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-white p-3 rounded border text-sm break-all">
                          {profile.youtube_access_token || 'غير متاح'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`YOUTUBE_ACCESS_TOKEN=${profile.youtube_access_token}`)}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-2"
                          title="نسخ"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        YOUTUBE_REFRESH_TOKEN
                      </label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-white p-3 rounded border text-sm break-all">
                          {profile.youtube_refresh_token || 'غير متاح'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`YOUTUBE_REFRESH_TOKEN=${profile.youtube_refresh_token}`)}
                          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-2"
                          title="نسخ"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    {profile.youtube_token_expiry && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          YOUTUBE_TOKEN_EXPIRY
                        </label>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-white p-3 rounded border text-sm">
                            {profile.youtube_token_expiry}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`YOUTUBE_TOKEN_EXPIRY=${profile.youtube_token_expiry}`)}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center gap-2"
                            title="نسخ"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>ملاحظة:</strong> انسخ هذه القيم وأضفها في ملف <code className="bg-white px-2 py-1 rounded">.env.local</code> في مجلد <code className="bg-white px-2 py-1 rounded">web</code>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-1" size={24} />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-2">
                    يجب ربط حساب YouTube أولاً
                  </p>
                  <p className="text-sm text-yellow-700 mb-3">
                    لرفع الفيديوهات إلى YouTube، يجب السماح للتطبيق بالوصول إلى قناة YouTube الخاصة بك.
                  </p>
                  <button
                    onClick={authenticateYouTube}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <ExternalLink size={18} />
                    ربط حساب YouTube
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-2 text-gray-900">معلومات مهمة:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>جميع الفيديوهات تُرفع على حسابك في YouTube</li>
              <li>يمكنك اختيار حالة الخصوصية لكل فيديو (خاص/غير مدرج/عام)</li>
              <li>لا يحتاج المستخدمون لربط حسابات YouTube الخاصة بهم</li>
              <li>يمكنك إدارة جميع الفيديوهات من قناة YouTube الخاصة بك</li>
              <li>يمكن حفظ credentials في <code className="bg-gray-100 px-1 rounded">.env.local</code> لتجنب الاعتماد على قاعدة البيانات</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
