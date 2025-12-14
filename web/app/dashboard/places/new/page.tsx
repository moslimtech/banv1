'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { MapPin, Phone, Upload, Video, Image as ImageIcon, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import YouTubeUpload from '@/components/YouTubeUpload'
import { uploadImageToImgBB, convertToWebP } from '@/lib/imgbb'

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
      .single()

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
      // Convert to WebP
      const webpBlob = await convertToWebP(file)
      const webpFile = new File([webpBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
        type: 'image/webp',
      })
      
      // Upload to ImgBB
      const url = await uploadImageToImgBB(webpFile)
      setLogoUrl(url)
      showSuccess('تم رفع الشعار بنجاح')
    } catch (error) {
      showError('حدث خطأ في رفع الشعار')
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">إضافة مكان جديد</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">الاسم بالعربية *</label>
              <input
                type="text"
                required
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">الاسم بالإنجليزية *</label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">الوصف بالعربية</label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">النوع *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="shop">محل</option>
              <option value="pharmacy">صيدلية</option>
              <option value="restaurant">مطعم</option>
              <option value="service">خدمة</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">شعار المكان</label>
            {logoPreview ? (
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="شعار المكان"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-10 h-10 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">اضغط لرفع</span> شعار المكان
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP (حد أقصى 5MB)</p>
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
            <p className="text-xs text-gray-500 mt-1">
              الشعار سيتم تحويله تلقائياً إلى WebP لتحسين الأداء
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">رقم الهاتف الأول *</label>
              <input
                type="tel"
                required
                value={formData.phone_1}
                onChange={(e) => setFormData({ ...formData, phone_1: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">رقم الهاتف الثاني</label>
              <input
                type="tel"
                value={formData.phone_2}
                onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">فيديو YouTube</label>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  uploadMethod === 'url'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                إدخال رابط
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('upload')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  uploadMethod === 'upload'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
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
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  الحد الأقصى: {(subscription.package as any).max_place_videos} فيديو
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
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
            <label className="block text-sm font-semibold mb-2 text-gray-900">اختر الموقع على الخريطة *</label>
            <div className="h-96 rounded-lg overflow-hidden border mb-4">
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
            <p className="text-xs text-gray-500 mb-2">
              اضغط على زر تحديد الموقع في الخريطة لسحب موقعك تلقائياً. يمكنك أيضاً سحب العلامة أو النقر على الخريطة لتغيير الموقع.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">العنوان</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="سيتم ملؤه تلقائياً من الخريطة"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              العنوان سيتم تحديثه تلقائياً عند اختيار موقع على الخريطة
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              إضافة المكان
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
