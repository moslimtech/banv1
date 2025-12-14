'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { Upload, X, Plus } from 'lucide-react'
import { convertToWebP, uploadImageToImgBB } from '@/lib/imgbb'

export default function NewProductPage() {
  const params = useParams()
  const router = useRouter()
  const placeId = params.id as string

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    price: '',
    currency: 'EGP',
    category: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([''])
  const [variants, setVariants] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: placeData } = await supabase
      .from('places')
      .select('subscription_id, subscription:user_subscriptions(package:packages(*))')
      .eq('id', placeId)
      .single()

    if (placeData?.subscription) {
      setSubscription((placeData.subscription as any).package)
    }
  }

  const handleImageUpload = async (files: FileList) => {
    const maxImages = subscription?.max_product_images || 5
    if (images.length + files.length > maxImages) {
      showError(`الحد الأقصى للصور هو ${maxImages}`)
      return
    }

    const newImages = Array.from(files)
    setImages([...images, ...newImages])

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
    setImages(images.filter((_, i) => i !== index))
    setImageUrls(imageUrls.filter((_, i) => i !== index))
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
        const maxVideos = subscription?.max_product_videos || 0
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">إضافة منتج جديد</h1>

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
            <label className="block text-sm font-semibold mb-2 text-gray-900">الوصف</label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">السعر</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">الفئة</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              الصور ({imageUrls.length}/{subscription?.max_product_images || 5})
            </label>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img src={url} alt={`Image ${index + 1}`} className="w-full h-32 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
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

          <div>
            <label className="block text-sm font-medium mb-2">
              فيديوهات YouTube ({videos.filter((v) => v.trim()).length}/{subscription?.max_product_videos || 0})
            </label>
            {videos.map((video, index) => (
              <input
                key={index}
                type="url"
                value={video}
                onChange={(e) => {
                  const newVideos = [...videos]
                  newVideos[index] = e.target.value
                  setVideos(newVideos)
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 border rounded-lg mb-2"
              />
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-semibold text-gray-900">المتغيرات (ألوان، أحجام)</label>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus size={20} />
                إضافة متغير
              </button>
            </div>
            {variants.map((variant, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">النوع</label>
                    <select
                      value={variant.variant_type}
                      onChange={(e) => {
                        const newVariants = [...variants]
                        newVariants[index].variant_type = e.target.value
                        setVariants(newVariants)
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="color">لون</option>
                      <option value="size">حجم</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">القيمة</label>
                    <input
                      type="text"
                      value={variant.variant_value}
                      onChange={(e) => {
                        const newVariants = [...variants]
                        newVariants[index].variant_value = e.target.value
                        setVariants(newVariants)
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">الاسم بالعربية</label>
                    <input
                      type="text"
                      value={variant.variant_name_ar}
                      onChange={(e) => {
                        const newVariants = [...variants]
                        newVariants[index].variant_name_ar = e.target.value
                        setVariants(newVariants)
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">السعر الإضافي</label>
                    <input
                      type="number"
                      step="0.01"
                      value={variant.price_adjustment}
                      onChange={(e) => {
                        const newVariants = [...variants]
                        newVariants[index].price_adjustment = parseFloat(e.target.value) || 0
                        setVariants(newVariants)
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              إضافة المنتج
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
