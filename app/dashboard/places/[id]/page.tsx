'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Place, Product } from '@/lib/types'
import { getPlaceById } from '@/lib/api/places'
import { getProductsByPlace } from '@/lib/api/products'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { MapPin, Phone, Edit, Trash2, Plus, Package, Eye, Video, Save, X, Upload, Image as ImageIcon, Users, FileText } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import YouTubeUpload from '@/components/YouTubeUpload'
import { useTheme } from '@/contexts/ThemeContext'

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false })
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

export default function PlaceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { colors } = useTheme()
  const placeId = params.id as string

  const [place, setPlace] = useState<Place | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    logo_url: '',
    video_url: '',
    phone_1: '',
    phone_2: '',
    address: '',
    latitude: 0,
    longitude: 0,
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    checkUser()
    loadData()
  }, [placeId])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
  }

  const loadData = async () => {
    try {
      const [placeData, productsData] = await Promise.all([
        getPlaceById(placeId),
        getProductsByPlace(placeId),
      ])

      if (!placeData) {
        showError('المكان غير موجود')
        router.push('/dashboard')
        return
      }

      // Check if user owns this place
      const { data: { user } } = await supabase.auth.getUser()
      if (placeData.user_id !== user?.id) {
        showError('ليس لديك صلاحية للوصول لهذا المكان')
        router.push('/dashboard')
        return
      }

      setPlace(placeData)
      setProducts(productsData)
      // Initialize edit data
      setEditData({
        name_ar: placeData.name_ar || '',
        name_en: placeData.name_en || '',
        description_ar: placeData.description_ar || '',
        logo_url: placeData.logo_url || '',
        video_url: placeData.video_url || '',
        phone_1: placeData.phone_1 || '',
        phone_2: placeData.phone_2 || '',
        address: placeData.address || '',
        latitude: placeData.latitude || 0,
        longitude: placeData.longitude || 0,
      })
    } catch (error) {
      showError('حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = () => {
    if (place) {
      setEditData({
        name_ar: place.name_ar || '',
        name_en: place.name_en || '',
        description_ar: place.description_ar || '',
        logo_url: place.logo_url || '',
        video_url: place.video_url || '',
        phone_1: place.phone_1 || '',
        phone_2: place.phone_2 || '',
        address: place.address || '',
        latitude: place.latitude || 0,
        longitude: place.longitude || 0,
      })
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (place) {
      setEditData({
        name_ar: place.name_ar || '',
        name_en: place.name_en || '',
        description_ar: place.description_ar || '',
        logo_url: place.logo_url || '',
        video_url: place.video_url || '',
        phone_1: place.phone_1 || '',
        phone_2: place.phone_2 || '',
        address: place.address || '',
        latitude: place.latitude || 0,
        longitude: place.longitude || 0,
      })
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('الرجاء اختيار ملف صورة صحيح')
      return
    }

    // Check file size (max 32MB for ImgBB free tier)
    if (file.size > 32 * 1024 * 1024) {
      showError('حجم الصورة كبير جداً. الحد الأقصى هو 32MB')
      return
    }

    setUploadingLogo(true)
    showLoading('جاري رفع الصورة...')
    try {
      // Use API route instead of direct client-side upload
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

      if (data.url) {
        setEditData({ ...editData, logo_url: data.url })
        closeLoading()
        showSuccess('تم رفع الصورة بنجاح')
      } else {
        throw new Error('لم يتم إرجاع رابط الصورة')
      }
    } catch (error: any) {
      closeLoading()
      const errorMessage = error.message || 'فشل رفع الصورة'
      showError(errorMessage)
      console.error('Image upload error:', error)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleVideoUploaded = (videoUrl: string) => {
    setEditData({ ...editData, video_url: videoUrl })
  }

  const handleSave = async () => {
    if (!editData.name_ar.trim()) {
      showError('الرجاء إدخال اسم المكان بالعربية')
      return
    }

    if (!editData.phone_1.trim()) {
      showError('الرجاء إدخال رقم الهاتف الأول')
      return
    }

    if (!editData.latitude || !editData.longitude) {
      showError('الرجاء تحديد الموقع على الخريطة')
      return
    }

    showLoading('جاري حفظ التعديلات...')
    try {
      const { error } = await supabase
        .from('places')
        .update({
          name_ar: editData.name_ar.trim(),
          name_en: editData.name_en.trim() || null,
          description_ar: editData.description_ar.trim() || null,
          logo_url: editData.logo_url || null,
          video_url: editData.video_url || null,
          phone_1: editData.phone_1.trim(),
          phone_2: editData.phone_2.trim() || null,
          address: editData.address.trim() || null,
          latitude: editData.latitude,
          longitude: editData.longitude,
        })
        .eq('id', placeId)

      if (error) throw error

      closeLoading()
      showSuccess('تم حفظ التعديلات بنجاح')
      setIsEditing(false)
      loadData() // Reload data to reflect changes
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في حفظ التعديلات')
    }
  }

  const handleLocationChange = (lat: number, lng: number, address?: string) => {
    setEditData({
      ...editData,
      latitude: lat,
      longitude: lng,
      address: address || editData.address,
    })
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المكان؟ سيتم حذف جميع المنتجات المرتبطة به أيضاً.')) {
      return
    }

    showLoading('جاري حذف المكان...')
    try {
      // Delete products first (if cascade delete is not set up)
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('place_id', placeId)

      if (productsError) throw productsError

      // Delete place
      const { error } = await supabase
        .from('places')
        .delete()
        .eq('id', placeId)

      if (error) throw error

      closeLoading()
      showSuccess('تم حذف المكان بنجاح')
      router.push('/dashboard')
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في حذف المكان')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary-color)' }}></div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="app-text-muted">المكان غير موجود</p>
      </div>
    )
  }

  const videoId = place.video_url ? place.video_url.replace('watch?v=', 'embed/') : null

  return (
    <div className="min-h-screen py-8 app-bg-base">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="hover:underline flex items-center gap-2 icon-primary"
          >
            ← العودة للوحة التحكم
          </Link>
          <div className="flex gap-2 flex-wrap">
            {!isEditing ? (
              <>
                <Link
                  href={`/dashboard/places/${placeId}/employees`}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                  style={{ background: 'var(--accent)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Users size={18} />
                  إدارة الموظفين
                </Link>
                <Link
                  href={`/dashboard/places/${placeId}/posts`}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                  style={{ background: 'var(--secondary-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <FileText size={18} />
                  إدارة المنشورات
                </Link>
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors badge-primary"
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Edit size={18} />
                  تعديل المعلومات
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors badge-error"
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Trash2 size={18} />
                  حذف المكان
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                  style={{ background: 'var(--secondary-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Save size={18} />
                  حفظ التعديلات
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
                  style={{ background: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <X size={18} />
                  إلغاء
                </button>
              </>
            )}
          </div>
        </div>

        {/* Place Info */}
        <div className="app-card shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              {isEditing ? (
                <div className="space-y-2">
                  {(editData.logo_url || place.logo_url) && (
                    <img
                      src={editData.logo_url || place.logo_url || ''}
                      alt={editData.name_ar || place.name_ar}
                      className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg border-2 app-border"
                    />
                  )}
                  <label className="flex flex-col items-center justify-center w-32 h-32 md:w-40 md:h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors app-border"
                    
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <Upload size={24} className="mb-2 icon-muted" />
                    <span className="text-xs text-center px-2 app-text-muted">رفع صورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>
              ) : (
                place.logo_url && (
                  <img
                    src={place.logo_url}
                    alt={place.name_ar}
                    className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg border-2 app-border"
                  />
                )
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold app-text-main mb-2">
                      اسم المكان (عربي) *
                    </label>
                    <input
                      type="text"
                      value={editData.name_ar}
                      onChange={(e) => setEditData({ ...editData, name_ar: e.target.value })}
                      className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                      
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      placeholder="اسم المكان بالعربية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold app-text-main mb-2">
                      اسم المكان (إنجليزي)
                    </label>
                    <input
                      type="text"
                      value={editData.name_en}
                      onChange={(e) => setEditData({ ...editData, name_en: e.target.value })}
                      className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                      
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      placeholder="اسم المكان بالإنجليزية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold app-text-main mb-2">
                      الوصف
                    </label>
                    <textarea
                      value={editData.description_ar}
                      onChange={(e) => setEditData({ ...editData, description_ar: e.target.value })}
                      rows={4}
                      className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                      
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      placeholder="وصف المكان"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold app-text-main mb-2">
                        رقم الهاتف الأول *
                      </label>
                      <input
                        type="tel"
                        value={editData.phone_1}
                        onChange={(e) => setEditData({ ...editData, phone_1: e.target.value })}
                        className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                      
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        placeholder="رقم الهاتف الأول"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold app-text-main mb-2">
                        رقم الهاتف الثاني
                      </label>
                      <input
                        type="tel"
                        value={editData.phone_2}
                        onChange={(e) => setEditData({ ...editData, phone_2: e.target.value })}
                        className="app-input w-full px-4 py-2 rounded-lg focus:outline-none"
                      
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        placeholder="رقم الهاتف الثاني (اختياري)"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold app-text-main mb-4">{place.name_ar}</h1>
                  {place.name_en && (
                    <p className="text-lg app-text-muted mb-2">{place.name_en}</p>
                  )}
                  {place.description_ar && (
                    <p className="app-text-muted mb-4">{place.description_ar}</p>
                  )}
                </>
              )}
              
              {!isEditing && (
                <div className="flex flex-wrap gap-4 text-sm app-text-muted mb-4">
                  <div className="flex items-center gap-2">
                    <Phone size={18} />
                    <span>{place.phone_1}</span>
                  </div>
                  {place.phone_2 && (
                    <div className="flex items-center gap-2">
                      <Phone size={18} />
                      <span>{place.phone_2}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>{place.address || 'العنوان غير متاح'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye size={18} />
                    <span>المشاهدات: {place.total_views} | اليوم: {place.today_views}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full text-sm" style={place.is_active ? {
                  background: 'var(--status-green-bg)',
                  color: 'var(--secondary-color)'
                } : {
                  background: 'var(--status-red-bg)',
                  color: 'var(--status-error)'
                }}>
                  {place.is_active ? 'نشط' : 'غير نشط'}
                </span>
                {place.is_featured && (
                  <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--status-yellow-bg)', color: 'var(--status-warning)' }}>
                    مميز
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--status-blue-bg)', color: 'var(--primary-color)' }}>
                  {place.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="app-card shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 app-text-main">الموقع على الخريطة</h2>
          {isEditing ? (
            <div className="h-96 rounded-lg overflow-hidden">
              <MapPicker
                latitude={editData.latitude || place.latitude}
                longitude={editData.longitude || place.longitude}
                onLocationChange={handleLocationChange}
              />
            </div>
          ) : (
            <div className="h-96 rounded-lg overflow-hidden">
              <MapComponent
                latitude={place.latitude}
                longitude={place.longitude}
                placeName={place.name_ar}
              />
            </div>
          )}
        </div>

        {/* Video */}
        <div className="app-card shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 app-text-main">فيديو المكان</h2>
          {isEditing ? (
            <div className="space-y-4">
              {(editData.video_url || place.video_url) && (
                <div className="aspect-video rounded-lg overflow-hidden app-bg-surface">
                  {(() => {
                    const currentVideoUrl = editData.video_url || place.video_url || ''
                    const currentVideoId = currentVideoUrl ? currentVideoUrl.replace('watch?v=', 'embed/') : null
                    return currentVideoId ? (
                      <iframe
                        src={currentVideoId}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : null
                  })()}
                </div>
              )}
              <YouTubeUpload
                onVideoUploaded={handleVideoUploaded}
                maxVideos={1}
                currentVideos={editData.video_url ? 1 : 0}
                allowReplace={true}
              />
            </div>
          ) : (
            videoId && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={videoId}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )
          )}
        </div>

        {/* Products */}
        <div className="app-card shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold app-text-main">المنتجات والخدمات ({products.length})</h2>
            <Link
              href={`/dashboard/places/${placeId}/products/new`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: colors.primary,
                color: colors.onPrimary,
              }}
            >
              <Plus size={20} />
              إضافة منتج جديد
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow app-border"
                >
                  {product.images && product.images.length > 0 && (
                    <img
                      src={product.images[0].image_url}
                      alt={product.name_ar}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-bold text-lg mb-2 app-text-main">{product.name_ar}</h3>
                  {product.description_ar && (
                    <p className="text-sm app-text-muted mb-2 line-clamp-2">{product.description_ar}</p>
                  )}
                  {product.price && (
                    <p className="text-lg font-semibold mb-2 icon-primary">
                      {product.price} {product.currency}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs app-text-muted">
                    {product.videos && product.videos.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Video size={14} />
                        <span>{product.videos.length}</span>
                      </div>
                    )}
                    {product.images && product.images.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Package size={14} />
                        <span>{product.images.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 app-text-muted">
              <Package size={48} className="mx-auto mb-4 icon-muted" />
              <p>لا توجد منتجات بعد</p>
              <Link
                href={`/dashboard/places/${placeId}/products/new`}
                className="inline-block mt-4 hover:underline icon-primary"
              >
                إضافة منتج جديد
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
