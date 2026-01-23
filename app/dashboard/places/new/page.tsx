'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { MapPin, Phone, Upload, Video, Image as ImageIcon, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import YouTubeUpload from '@/components/YouTubeUpload'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

export default function NewPlacePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    category: 'shop',
    latitude: 30.0444, // Default: Cairo
    longitude: 31.2357, // Default: Cairo
    address: '',
    phone_1: '',
    phone_2: '',
    video_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('url')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

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

    // Check subscription
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('*, package:packages(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!subData) {
      showError('يجب الاشتراك في باقة أولاً')
      router.push('/dashboard/packages')
      return
    }

    // Check if user can add more places
    const { data: placesData } = await supabase
      .from('places')
      .select('id')
      .eq('user_id', user.id)

    const maxPlaces = (subData.package as any).max_places
    if ((placesData?.length || 0) >= maxPlaces) {
      showError(`لقد وصلت للحد الأقصى من الأماكن المسموحة في باقاتك (${maxPlaces})`)
      router.push('/dashboard')
      return
    }

    setSubscription(subData)
    setLoading(false)
  }

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true)
    try {
      // Upload via API route (automatically optimizes to WebP)
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الصورة')
      }

      setLogoUrl(data.url)
      showSuccess('تم رفع الشعار بنجاح')
    } catch (error: any) {
      showError(error.message || 'حدث خطأ في رفع الشعار')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      handleLogoUpload(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    showLoading('جاري إضافة المكان...')

    try {
      const { data, error } = await supabase
        .from('places')
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          ...formData,
          logo_url: logoUrl,
          is_featured: (subscription.package as any).is_featured || false,
        })
        .select()
        .single()

      if (error) throw error

      closeLoading()
      showSuccess('تم إضافة المكان بنجاح')
      router.push(`/dashboard/places/${data.id}`)
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في إضافة المكان')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary-color)' }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 app-bg-base">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 app-text-main">إضافة مكان جديد</h1>

        <form onSubmit={handleSubmit} className="app-card shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 app-text-main">الاسم بالعربية *</label>
              <input
                type="text"
                required
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="app-input w-full px-4 py-2.5 rounded-lg focus:outline-none"
                
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 app-text-main">الاسم بالإنجليزية *</label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="app-input w-full px-4 py-2.5 rounded-lg focus:outline-none"
                
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 app-text-main">الوصف بالعربية</label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              rows={3}
              className="app-input w-full px-4 py-2.5 rounded-lg focus:outline-none"
              
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 app-text-main">النوع *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="app-input w-full px-4 py-2.5 rounded-lg focus:outline-none"
              
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <option value="shop">محل</option>
              <option value="pharmacy">صيدلية</option>
              <option value="restaurant">مطعم</option>
              <option value="service">خدمة</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 app-text-main">شعار المكان</label>
            {logoPreview ? (
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="شعار المكان"
                  className="w-32 h-32 object-cover rounded-lg border-2 app-border"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 rounded-full p-1 transition-colors"
                  style={{ background: 'var(--status-error)', color: 'var(--background)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <X size={16} />
                </button>
                {uploadingLogo && (
                  <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ background: 'var(--overlay-bg)' }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--background)' }}></div>
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors app-border app-hover-bg">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-10 h-10 mb-2 icon-muted" />
                  <p className="mb-2 text-sm app-text-muted">
                    <span className="font-semibold">اضغط لرفع</span> شعار المكان
                  </p>
                  <p className="text-xs app-text-muted">PNG, JPG, WEBP (حد أقصى 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-xs app-text-muted mt-1">
              الشعار سيتم تحويله تلقائياً إلى WebP لتحسين الأداء
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 app-text-main">رقم الهاتف الأول *</label>
              <input
                type="tel"
                required
                value={formData.phone_1}
                onChange={(e) => setFormData({ ...formData, phone_1: e.target.value })}
                className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 app-text-main">رقم الهاتف الثاني</label>
              <input
                type="tel"
                value={formData.phone_2}
                onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 app-text-main">فيديو YouTube</label>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  uploadMethod !== 'url'
                    ? 'app-bg-surface app-text-main app-hover-bg'
                    : ''
                }`}
                style={uploadMethod === 'url' ? { background: 'var(--primary-color)', color: 'var(--background)' } : {}}
                onMouseEnter={(e) => uploadMethod !== 'url' && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => uploadMethod !== 'url' && (e.currentTarget.style.opacity = '1')}
              >
                إدخال رابط
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('upload')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  uploadMethod !== 'upload'
                    ? 'app-bg-surface app-text-main app-hover-bg'
                    : ''
                }`}
                style={uploadMethod === 'upload' ? { background: 'var(--primary-color)', color: 'var(--background)' } : {}}
                onMouseEnter={(e) => uploadMethod !== 'upload' && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => uploadMethod !== 'upload' && (e.currentTarget.style.opacity = '1')}
              >
                رفع فيديو
              </button>
            </div>

            {uploadMethod === 'url' ? (
              <div>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                  
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
                <p className="text-xs app-text-muted mt-1">
                  الحد الأقصى: {(subscription.package as any).max_place_videos} فيديو
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 app-bg-surface app-border">
                <YouTubeUpload
                  onVideoUploaded={(videoUrl) => {
                    setFormData({ ...formData, video_url: videoUrl })
                    setUploadMethod('url') // Switch back to URL view after upload
                  }}
                  maxVideos={(subscription.package as any).max_place_videos || 1}
                  currentVideos={formData.video_url ? 1 : 0}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 app-text-main">اختر الموقع على الخريطة *</label>
            <div className="h-96 rounded-lg overflow-hidden border mb-4 app-border">
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(lat, lng, address) => {
                  setFormData({ 
                    ...formData, 
                    latitude: lat, 
                    longitude: lng,
                    address: address || formData.address // Update address if provided
                  })
                }}
              />
            </div>
            <p className="text-xs app-text-muted mb-2">
              اضغط على زر تحديد الموقع في الخريطة لسحب موقعك تلقائياً. يمكنك أيضاً سحب العلامة أو النقر على الخريطة لتغيير الموقع.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 app-text-main">العنوان</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="سيتم ملؤه تلقائياً من الخريطة"
              className="app-input w-full px-4 py-2.5 rounded-lg focus:outline-none"
              
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
            <p className="text-xs app-text-muted mt-1">
              العنوان سيتم تحديثه تلقائياً عند اختيار موقع على الخريطة
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg transition-colors"
              style={{ background: 'var(--primary-color)', color: 'var(--background)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              إضافة المكان
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg transition-colors app-bg-surface app-text-main app-hover-bg"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
