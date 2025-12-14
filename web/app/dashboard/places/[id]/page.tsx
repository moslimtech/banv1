'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Place, Product } from '@/lib/types'
import { getPlaceById } from '@/lib/api/places'
import { getProductsByPlace } from '@/lib/api/products'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { MapPin, Phone, Edit, Trash2, Plus, Package, Eye, Video } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false })

export default function PlaceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const placeId = params.id as string

  const [place, setPlace] = useState<Place | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      showError('حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">المكان غير موجود</p>
      </div>
    )
  }

  const videoId = place.video_url ? place.video_url.replace('watch?v=', 'embed/') : null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-blue-500 hover:underline flex items-center gap-2"
          >
            ← العودة للوحة التحكم
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={18} />
              حذف المكان
            </button>
          </div>
        </div>

        {/* Place Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {place.logo_url && (
              <div className="flex-shrink-0">
                <img
                  src={place.logo_url}
                  alt={place.name_ar}
                  className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{place.name_ar}</h1>
              {place.name_en && (
                <p className="text-lg text-gray-600 mb-2">{place.name_en}</p>
              )}
              {place.description_ar && (
                <p className="text-gray-600 mb-4">{place.description_ar}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
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

              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  place.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {place.is_active ? 'نشط' : 'غير نشط'}
                </span>
                {place.is_featured && (
                  <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                    مميز
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  {place.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">الموقع على الخريطة</h2>
          <div className="h-96 rounded-lg overflow-hidden">
            <MapComponent
              latitude={place.latitude}
              longitude={place.longitude}
              placeName={place.name_ar}
            />
          </div>
        </div>

        {/* Video */}
        {videoId && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">فيديو المكان</h2>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={videoId}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Products */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">المنتجات والخدمات ({products.length})</h2>
            <Link
              href={`/dashboard/places/${placeId}/products/new`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {product.images && product.images.length > 0 && (
                    <img
                      src={product.images[0].image_url}
                      alt={product.name_ar}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{product.name_ar}</h3>
                  {product.description_ar && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description_ar}</p>
                  )}
                  {product.price && (
                    <p className="text-lg font-semibold text-blue-600 mb-2">
                      {product.price} {product.currency}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
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
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <p>لا توجد منتجات بعد</p>
              <Link
                href={`/dashboard/places/${placeId}/products/new`}
                className="inline-block mt-4 text-blue-500 hover:underline"
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
