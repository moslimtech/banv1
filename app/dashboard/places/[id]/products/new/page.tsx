'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { Upload, X, Plus, Trash2 } from 'lucide-react'
import { convertToWebP, uploadImageToImgBB } from '@/lib/imgbb'
import { useTheme } from '@/contexts/ThemeContext'
import type { Package } from '@/lib/types'

// Constants
const DEFAULT_MAX_IMAGES = 5
const DEFAULT_MAX_VIDEOS = 0
const DEFAULT_CURRENCY = 'IQD'

interface ProductFormData {
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  price: string
  currency: string
  category: string
}

interface ProductVariant {
  variant_type: 'color' | 'size'
  variant_name_ar: string
  variant_name_en: string
  variant_value: string
  price_adjustment: number
  stock_quantity: number | null
  is_available: boolean
}

export default function NewProductPage() {
  const params = useParams()
  const router = useRouter()
  const { colors } = useTheme()
  const placeId = params.id as string

  const [formData, setFormData] = useState<ProductFormData>({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    price: '',
    currency: DEFAULT_CURRENCY,
    category: '',
  })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [subscription, setSubscription] = useState<Package | null>(null)

  const checkSubscription = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: placeData } = await supabase
      .from('places')
      .select('subscription_id, subscription:user_subscriptions(package:packages(*))')
      .eq('id', placeId)
      .maybeSingle()

    if (placeData?.subscription) {
      setSubscription((placeData.subscription as any).package)
    }
  }, [placeId])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  const handleImageUpload = async (files: FileList) => {
    const maxImages = subscription?.max_product_images || DEFAULT_MAX_IMAGES
    if (imageUrls.length + files.length > maxImages) {
      showError(`الحد الأقصى للصور هو ${maxImages}`)
      return
    }

    const newImages = Array.from(files)

    // Upload images
    showLoading('جاري رفع الصور...')
    try {
      const uploadPromises = newImages.map(async (file) => {
        const webpBlob = await convertToWebP(file)
        const webpFile = new File([webpBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
          type: 'image/webp',
        })
        return await uploadImageToImgBB(webpFile)
      })

      const urls = await Promise.all(uploadPromises)
      setImageUrls([...imageUrls, ...urls])
      closeLoading()
      showSuccess('تم رفع الصور بنجاح')
    } catch (error) {
      closeLoading()
      showError('حدث خطأ في رفع الصور')
    }
  }

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const addVideo = () => {
    const maxVideos = subscription?.max_product_videos || DEFAULT_MAX_VIDEOS
    if (videos.length >= maxVideos) {
      showError(`الحد الأقصى للفيديوهات هو ${maxVideos}`)
      return
    }
    setVideos([...videos, ''])
  }

  const updateVideo = (index: number, value: string) => {
    const newVideos = [...videos]
    newVideos[index] = value
    setVideos(newVideos)
  }

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index))
  }

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        variant_type: 'color',
        variant_name_ar: '',
        variant_name_en: '',
        variant_value: '',
        price_adjustment: 0,
        stock_quantity: null,
        is_available: true,
      },
    ])
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    showLoading('جاري إضافة المنتج...')

    try {
      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          place_id: placeId,
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
        })
        .select()
        .single()

      if (productError) throw productError

      // Upload images
      if (imageUrls.length > 0) {
        const imageInserts = imageUrls.map((url, index) => ({
          product_id: product.id,
          image_url: url,
          order_index: index,
        }))

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageInserts)

        if (imagesError) throw imagesError
      }

      // Upload videos
      const validVideos = videos.filter((v) => v.trim())
      if (validVideos.length > 0) {
        const maxVideos = subscription?.max_product_videos || DEFAULT_MAX_VIDEOS
        if (validVideos.length > maxVideos) {
          throw new Error(`الحد الأقصى للفيديوهات هو ${maxVideos}`)
        }

        const videoInserts = validVideos.map((url, index) => ({
          product_id: product.id,
          video_url: url,
          order_index: index,
        }))

        const { error: videosError } = await supabase
          .from('product_videos')
          .insert(videoInserts)

        if (videosError) throw videosError
      }

      // Upload variants
      if (variants.length > 0) {
        const variantInserts = variants.map((v) => ({
          product_id: product.id,
          ...v,
        }))

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantInserts)

        if (variantsError) throw variantsError
      }

      closeLoading()
      showSuccess('تم إضافة المنتج بنجاح')
      router.push(`/dashboard/places/${placeId}`)
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في إضافة المنتج')
    }
  }

  return (
    <div 
      className="min-h-screen py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 
          className="text-3xl font-bold mb-6"
          style={{ color: colors.onSurface }}
        >
          إضافة منتج جديد
        </h1>

        <form 
          onSubmit={handleSubmit} 
          className="rounded-3xl shadow-lg p-6 space-y-6"
          style={{ backgroundColor: colors.surface }}
        >
          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.onSurface }}
              >
                الاسم بالعربية *
              </label>
              <input
                type="text"
                required
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.onSurface,
                }}
              />
            </div>
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.onSurface }}
              >
                الاسم بالإنجليزية *
              </label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.onSurface,
                }}
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.onSurface }}
              >
                الوصف بالعربية
              </label>
              <textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.onSurface,
                }}
              />
            </div>
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.onSurface }}
              >
                الوصف بالإنجليزية
              </label>
              <textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.onSurface,
                }}
              />
            </div>
          </div>

          {/* Price and Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.onSurface }}
              >
                السعر
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.onSurface,
                }}
              />
            </div>
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.onSurface }}
              >
                العملة
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.onSurface,
                }}
              >
                <option value="IQD">دينار عراقي (IQD)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EUR">يورو (EUR)</option>
              </select>
            </div>
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.onSurface }}
              >
                الفئة
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.onSurface,
                }}
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: colors.onSurface }}
            >
              الصور ({imageUrls.length}/{subscription?.max_product_images || DEFAULT_MAX_IMAGES})
            </label>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img src={url} alt={`Image ${index + 1}`} className="w-full h-32 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 left-2 text-white rounded-full p-1"
                    style={{ backgroundColor: colors.error }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <label 
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: colors.surfaceContainer,
                color: colors.onSurface,
              }}
            >
              <Upload size={20} />
              رفع صور
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              />
            </label>
          </div>

          {/* Videos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label 
                className="block text-sm font-medium"
                style={{ color: colors.onSurface }}
              >
                فيديوهات YouTube ({videos.filter((v) => v.trim()).length}/{subscription?.max_product_videos || DEFAULT_MAX_VIDEOS})
              </label>
              {(subscription?.max_product_videos || 0) > 0 && (
                <button
                  type="button"
                  onClick={addVideo}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.onPrimary,
                  }}
                >
                  <Plus size={16} />
                  إضافة فيديو
                </button>
              )}
            </div>
            {videos.map((video, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={video}
                  onChange={(e) => updateVideo(index, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-4 py-2 border-2 rounded-lg focus:outline-none transition-colors"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                    color: colors.onSurface,
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: colors.errorContainer,
                    color: colors.error,
                  }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            {videos.length === 0 && (subscription?.max_product_videos || 0) === 0 && (
              <p 
                className="text-sm"
                style={{ color: colors.onSurface }}
              >
                باقتك الحالية لا تدعم فيديوهات المنتجات
              </p>
            )}
          </div>

          {/* Variants */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label 
                className="block text-sm font-semibold"
                style={{ color: colors.onSurface }}
              >
                المتغيرات (ألوان، أحجام)
              </label>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.onPrimary,
                }}
              >
                <Plus size={20} />
                إضافة متغير
              </button>
            </div>
            {variants.map((variant, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-4 mb-4 space-y-4"
                style={{ borderColor: colors.outline }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 
                    className="font-semibold"
                    style={{ color: colors.onSurface }}
                  >
                    متغير {index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-1 rounded transition-colors"
                    style={{
                      color: colors.error,
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.onSurface }}
                    >
                      النوع
                    </label>
                    <select
                      value={variant.variant_type}
                      onChange={(e) => updateVariant(index, 'variant_type', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg focus:outline-none transition-colors"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.outline,
                        color: colors.onSurface,
                      }}
                    >
                      <option value="color">لون</option>
                      <option value="size">حجم</option>
                    </select>
                  </div>
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.onSurface }}
                    >
                      القيمة
                    </label>
                    <input
                      type="text"
                      value={variant.variant_value}
                      onChange={(e) => updateVariant(index, 'variant_value', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.outline,
                        color: colors.onSurface,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.onSurface }}
                    >
                      الاسم بالعربية
                    </label>
                    <input
                      type="text"
                      value={variant.variant_name_ar}
                      onChange={(e) => updateVariant(index, 'variant_name_ar', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.outline,
                        color: colors.onSurface,
                      }}
                    />
                  </div>
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.onSurface }}
                    >
                      الاسم بالإنجليزية
                    </label>
                    <input
                      type="text"
                      value={variant.variant_name_en}
                      onChange={(e) => updateVariant(index, 'variant_name_en', e.target.value)}
                      className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.outline,
                        color: colors.onSurface,
                      }}
                    />
                  </div>
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.onSurface }}
                    >
                      السعر الإضافي
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={variant.price_adjustment}
                      onChange={(e) => updateVariant(index, 'price_adjustment', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-colors"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.outline,
                        color: colors.onSurface,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg transition-colors font-semibold"
              style={{
                backgroundColor: colors.primary,
                color: colors.onPrimary,
              }}
            >
              إضافة المنتج
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg transition-colors"
              style={{
                backgroundColor: colors.surfaceContainer,
                color: colors.onSurface,
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
