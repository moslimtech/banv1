'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Package } from '@/lib/types'
import { showError, showSuccess, showConfirm } from '@/components/SweetAlert'
import { Check, Crown, Star, Upload, X } from 'lucide-react'
import Link from 'next/link'

export default function PackagesPage() {
  const router = useRouter()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null)
  const [discountType, setDiscountType] = useState<'affiliate' | 'code' | null>(null)
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

  useEffect(() => {
    checkUser()
    loadPackages()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)

    // Load current subscription
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('*, package:packages(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    setCurrentSubscription(subData || null)
  }

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('priority', { ascending: false })
        .order('price', { ascending: true })

      if (error) throw error
      setPackages(data || [])
    } catch (error: any) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const validateDiscountCode = async (code: string) => {
    if (!code.trim()) {
      setSelectedDiscount(null)
      setDiscountType(null)
      return null
    }

    const codeUpper = code.toUpperCase().trim()

    try {
      // First, try to find in discount_codes table
      const now = new Date().toISOString()
      const { data: discountCodeData, error: discountError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', codeUpper)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .single()

      if (!discountError && discountCodeData) {
        // Check if max_uses is reached
        if (discountCodeData.max_uses && discountCodeData.used_count >= discountCodeData.max_uses) {
          setSelectedDiscount(null)
          setDiscountType(null)
          return null
        }
        setSelectedDiscount(discountCodeData)
        setDiscountType('code')
        return { ...discountCodeData, type: 'code' }
      }

      // If not found in discount_codes, try affiliates table
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('code', codeUpper)
        .eq('is_active', true)
        .single()

      if (!affiliateError && affiliateData) {
        setSelectedDiscount(affiliateData)
        setDiscountType('affiliate')
        return { ...affiliateData, type: 'affiliate' }
      }

      setSelectedDiscount(null)
      setDiscountType(null)
      return null
    } catch (error) {
      setSelectedDiscount(null)
      setDiscountType(null)
      return null
    }
  }

  const handleDiscountCodeChange = async (code: string) => {
    setDiscountCode(code)
    if (code.trim()) {
      await validateDiscountCode(code)
    } else {
      setSelectedDiscount(null)
      setDiscountType(null)
    }
  }

  const handleSubscribeClick = (pkg: Package) => {
    setSelectedPackage(pkg)
    setShowReceiptModal(true)
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceiptFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const handleSubscribe = async (pkg: Package) => {
    // Validate discount code if provided
    let discount = null
    if (discountCode.trim()) {
      discount = await validateDiscountCode(discountCode)
      if (!discount) {
        showError('كود الخصم غير صحيح أو غير نشط أو منتهي الصلاحية')
        return
      }
    }

    // Calculate final price
    let finalPrice = pkg.price
    let discountAmount = 0
    if (discount) {
      discountAmount = (pkg.price * discount.discount_percentage) / 100
      finalPrice = pkg.price - discountAmount
    }

    const confirmed = await showConfirm(
      discount
        ? `هل تريد الاشتراك في باقة "${pkg.name_ar}" بسعر ${pkg.price} EGP مع خصم ${discount.discount_percentage}% (${discountAmount.toFixed(2)} EGP) = ${finalPrice.toFixed(2)} EGP؟`
        : `هل تريد الاشتراك في باقة "${pkg.name_ar}" بسعر ${pkg.price} EGP؟`
    )

    if (!confirmed.isConfirmed) return

    try {
      // Check if user has active subscription
      if (currentSubscription) {
        showError('لديك اشتراك نشط بالفعل. يجب إلغاء الاشتراك الحالي أولاً')
        return
      }

      // Check if receipt is uploaded
      if (!receiptFile) {
        showError('يرجى رفع صورة إيصال الدفع')
        return
      }

      setUploadingReceipt(true)

      // Upload receipt image via API route
      const formData = new FormData()
      formData.append('image', receiptFile)
      
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      
      const uploadData = await uploadResponse.json()
      
      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.error || 'فشل رفع صورة الإيصال')
      }
      
      const receiptImageUrl = uploadData.url

      // Ensure user profile exists (required for foreign key constraint)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingProfile) {
        // Create user profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: user.email || null,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            is_admin: false,
            is_affiliate: false,
          }, {
            onConflict: 'id',
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          throw new Error('فشل في إنشاء ملف المستخدم. يرجى المحاولة مرة أخرى.')
        }
      }

      // Create subscription with pending status
      const { data: subscriptionData, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          amount_paid: finalPrice,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          receipt_image_url: receiptImageUrl,
          status: 'pending',
          is_active: false, // Will be activated after admin approval
        })
        .select()
        .single()

      if (subError) throw subError

      setUploadingReceipt(false)

      // Handle discount code usage
      if (discount && subscriptionData) {
        if (discount.type === 'code') {
          // Increment usage count for discount code
          const { error: incrementError } = await supabase.rpc('increment_discount_code_usage', {
            code_id: discount.id
          })
          if (incrementError) {
            console.error('Error incrementing discount code usage:', incrementError)
          }
        } else if (discount.type === 'affiliate') {
          // Create affiliate transaction
          const commissionAmount = (finalPrice * discount.discount_percentage) / 100
          
          const { error: transError } = await supabase
            .from('affiliate_transactions')
            .insert({
              affiliate_id: discount.id,
              subscription_id: subscriptionData.id,
              amount: commissionAmount,
              commission_percentage: discount.discount_percentage,
              status: 'pending',
            })

          if (transError) {
            console.error('Error creating affiliate transaction:', transError)
          }
        }
      }

      showSuccess('تم إرسال طلب الاشتراك بنجاح! سيتم مراجعة الإيصال وتفعيل الاشتراك قريباً.')
      setShowReceiptModal(false)
      setReceiptFile(null)
      setReceiptPreview(null)
      setSelectedPackage(null)
      checkUser() // Refresh subscription status
    } catch (error: any) {
      setUploadingReceipt(false)
      showError(error.message || 'حدث خطأ في الاشتراك')
    }
  }

  const getCardStyle = (pkg: Package) => {
    if (pkg.is_featured) return 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50'
    if (pkg.card_style === 'gold') return 'border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50'
    if (pkg.card_style === 'silver') return 'border border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50'
    return 'border border-gray-200 bg-white'
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
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-500 hover:underline mb-4 inline-block"
          >
            ← العودة للوحة التحكم
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">الباقات المتاحة</h1>
          <p className="text-gray-600 mt-2">اختر الباقة المناسبة لك</p>
        </div>

        {currentSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">
                  اشتراكك الحالي: {(currentSubscription.package as Package)?.name_ar}
                </p>
                <p className="text-sm text-blue-700">
                  ينتهي في: {new Date(currentSubscription.expires_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm">
                نشط
              </span>
            </div>
          </div>
        )}

        {/* Discount Code Input */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              كود الخصم:
            </label>
            <input
              type="text"
              value={discountCode}
              onChange={(e) => handleDiscountCodeChange(e.target.value)}
              placeholder="أدخل كود الخصم (اختياري)"
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
            />
            {selectedDiscount && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                <Check size={16} />
                خصم {selectedDiscount.discount_percentage}%
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isCurrentPackage = currentSubscription?.package_id === pkg.id
            return (
              <div
                key={pkg.id}
                className={`rounded-lg shadow-lg p-6 ${getCardStyle(pkg)} relative`}
              >
                {pkg.is_featured && (
                  <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star size={12} />
                    مميز
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">{pkg.name_ar}</h3>
                  <p className="text-gray-600 text-sm mb-4">{pkg.name_en}</p>
                  {selectedDiscount ? (
                    <div>
                      <div className="text-2xl font-bold text-gray-400 line-through mb-1">
                        {pkg.price} <span className="text-sm">EGP</span>
                      </div>
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {(pkg.price - (pkg.price * selectedDiscount.discount_percentage) / 100).toFixed(2)} <span className="text-lg">EGP</span>
                      </div>
                      <div className="text-sm text-green-600 font-semibold">
                        خصم {selectedDiscount.discount_percentage}%
                      </div>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {pkg.price} <span className="text-lg">EGP</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-green-500" />
                    <span className="text-sm">{pkg.max_places} مكان/خدمة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-green-500" />
                    <span className="text-sm">{pkg.max_product_images} صورة لكل منتج</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-green-500" />
                    <span className="text-sm">{pkg.max_product_videos} فيديو لكل منتج</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-green-500" />
                    <span className="text-sm">{pkg.max_place_videos} فيديو للمكان</span>
                  </div>
                  {pkg.is_featured && (
                    <div className="flex items-center gap-2">
                      <Crown size={18} className="text-yellow-500" />
                      <span className="text-sm">ظهور مميز في الصفحة الرئيسية</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSubscribeClick(pkg)}
                  disabled={isCurrentPackage || !!currentSubscription}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    isCurrentPackage
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : currentSubscription
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isCurrentPackage
                    ? 'الباقة الحالية'
                    : currentSubscription
                    ? 'لديك اشتراك نشط'
                    : 'اشترك الآن'}
                </button>
              </div>
            )
          })}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            لا توجد باقات متاحة حالياً
          </div>
        )}

        {/* Receipt Upload Modal */}
        {showReceiptModal && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">رفع إيصال الدفع</h2>
                <button
                  onClick={() => {
                    setShowReceiptModal(false)
                    setReceiptFile(null)
                    setReceiptPreview(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-2">الباقة: <span className="font-semibold">{selectedPackage.name_ar}</span></p>
                <p className="text-gray-600">المبلغ: <span className="font-semibold">{selectedPackage.price} EGP</span></p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رفع صورة إيصال الدفع <span className="text-red-500">*</span>
                  <span className="block text-xs text-gray-500 mt-1">(إلزامي - مطلوب للموافقة على الاشتراك)</span>
                </label>
                {receiptPreview ? (
                  <div className="relative">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-full h-64 object-contain border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={handleRemoveReceipt}
                      className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={48} className="text-gray-400 mb-2" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">اضغط للرفع</span> أو اسحب الصورة هنا
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleReceiptChange}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReceiptModal(false)
                    setReceiptFile(null)
                    setReceiptPreview(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={uploadingReceipt}
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleSubscribe(selectedPackage)}
                  disabled={!receiptFile || uploadingReceipt}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {uploadingReceipt ? 'جاري الرفع...' : 'إرسال الطلب'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
