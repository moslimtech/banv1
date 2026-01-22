'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Package } from '@/lib/types'
import { useAuth } from '@/hooks'
import { showError, showSuccess, showConfirm } from '@/components/SweetAlert'
import { Check, Crown, Star, Upload, X } from 'lucide-react'
import { Input, LoadingSpinner } from '@/components/common'
import Link from 'next/link'

export default function PackagesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth(true)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
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
    if (user) {
      loadCurrentSubscription()
    }
    loadPackages()
  }, [user])

  const loadCurrentSubscription = async () => {
    if (!user) return

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
      loadCurrentSubscription() // Refresh subscription status
    } catch (error: any) {
      setUploadingReceipt(false)
      showError(error.message || 'حدث خطأ في الاشتراك')
    }
  }

  const getCardStyle = (pkg: Package): React.CSSProperties => {
    if (pkg.is_featured) {
      return {
        border: '2px solid var(--status-warning)',
        background: 'linear-gradient(to bottom right, var(--status-yellow-bg), rgba(245, 158, 11, 0.1))'
      }
    }
    if (pkg.card_style === 'gold') {
      return {
        border: '2px solid var(--status-warning)',
        background: 'linear-gradient(to bottom right, var(--status-yellow-bg), rgba(245, 158, 11, 0.1))'
      }
    }
    if (pkg.card_style === 'silver') {
      return {
        border: '1px solid var(--border-color)',
        background: 'linear-gradient(to bottom right, var(--surface-color), var(--bg-color))'
      }
    }
    return {
      border: '1px solid var(--border-color)',
      background: 'var(--background)'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 app-bg-base">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-block icon-primary"
          >
            ← العودة للوحة التحكم
          </Link>
          <h1 className="text-3xl font-bold app-text-main">الباقات المتاحة</h1>
          <p className="app-text-muted mt-2">اختر الباقة المناسبة لك</p>
        </div>

        {currentSubscription && (
          <div className="rounded-lg p-4 mb-6 border" style={{ background: 'var(--status-blue-bg)', borderColor: 'var(--primary-color)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold icon-primary">
                  اشتراكك الحالي: {(currentSubscription.package as Package)?.name_ar}
                </p>
                <p className="text-sm" style={{ color: 'var(--primary-color)', opacity: 0.8 }}>
                  ينتهي في: {new Date(currentSubscription.expires_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <span className="px-3 py-1 text-white rounded-full text-sm" style={{ background: 'var(--secondary-color)' }}>
                نشط
              </span>
            </div>
          </div>
        )}

        {/* Discount Code Input */}
        <div className="app-card shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold app-text-main whitespace-nowrap">
              كود الخصم:
            </label>
            <Input
              type="text"
              value={discountCode}
              onChange={(e) => handleDiscountCodeChange(e.target.value)}
              placeholder="أدخل كود الخصم (اختياري)"
              className="app-input flex-1 px-4 py-2 rounded-lg focus:outline-none"
              
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
            {selectedDiscount && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold" style={{ background: 'var(--status-green-bg)', color: 'var(--secondary-color)' }}>
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
                className="rounded-lg shadow-lg p-6 relative"
                style={getCardStyle(pkg)}
              >
                {pkg.is_featured && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1" style={{ background: 'var(--status-warning)', color: '#000' }}>
                    <Star size={12} />
                    مميز
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2 app-text-main">{pkg.name_ar}</h3>
                  <p className="app-text-muted text-sm mb-4">{pkg.name_en}</p>
                  {selectedDiscount ? (
                    <div>
                      <div className="text-2xl font-bold line-through mb-1 app-text-subtle">
                        {pkg.price} <span className="text-sm">EGP</span>
                      </div>
                      <div className="text-4xl font-bold mb-2 icon-secondary">
                        {(pkg.price - (pkg.price * selectedDiscount.discount_percentage) / 100).toFixed(2)} <span className="text-lg">EGP</span>
                      </div>
                      <div className="text-sm font-semibold icon-secondary">
                        خصم {selectedDiscount.discount_percentage}%
                      </div>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold mb-2 icon-primary">
                      {pkg.price} <span className="text-lg">EGP</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check size={18} className="icon-secondary" />
                    <span className="text-sm app-text-main">{pkg.max_places} مكان/خدمة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} className="icon-secondary" />
                    <span className="text-sm">{pkg.max_product_images} صورة لكل منتج</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} className="icon-secondary" />
                    <span className="text-sm">{pkg.max_product_videos} فيديو لكل منتج</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} className="icon-secondary" />
                    <span className="text-sm">{pkg.max_place_videos} فيديو للمكان</span>
                  </div>
                  {pkg.is_featured && (
                    <div className="flex items-center gap-2">
                      <Crown size={18} className="icon-warning" />
                      <span className="text-sm">ظهور مميز في الصفحة الرئيسية</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSubscribeClick(pkg)}
                  disabled={isCurrentPackage || !!currentSubscription}
                  className="w-full py-3 rounded-lg font-semibold transition-colors text-white"
                  style={isCurrentPackage || currentSubscription ? {
                    background: 'var(--surface-color)',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed'
                  } : {
                    background: 'var(--primary-color)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrentPackage && !currentSubscription) {
                      e.currentTarget.style.opacity = '0.9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentPackage && !currentSubscription) {
                      e.currentTarget.style.opacity = '1'
                    }
                  }}
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
          <div className="text-center py-12 app-text-muted">
            لا توجد باقات متاحة حالياً
          </div>
        )}

        {/* Receipt Upload Modal */}
        {showReceiptModal && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="app-card shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold app-text-main">رفع إيصال الدفع</h2>
                <button
                  onClick={() => {
                    setShowReceiptModal(false)
                    setReceiptFile(null)
                    setReceiptPreview(null)
                  }}
                  className="app-text-muted app-hover-bg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <p className="app-text-muted mb-2">الباقة: <span className="font-semibold">{selectedPackage.name_ar}</span></p>
                <p className="app-text-muted">المبلغ: <span className="font-semibold">{selectedPackage.price} EGP</span></p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium app-text-main mb-2">
                  رفع صورة إيصال الدفع <span className="icon-error">*</span>
                  <span className="block text-xs app-text-muted mt-1">(إلزامي - مطلوب للموافقة على الاشتراك)</span>
                </label>
                {receiptPreview ? (
                  <div className="relative">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-full h-64 object-contain border rounded-lg app-border"
                    />
                    <button
                      onClick={handleRemoveReceipt}
                      className="absolute top-2 left-2 text-white p-2 rounded-full"
                      className="badge-error"
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer app-hover-bg" style={{ borderColor: 'var(--border-color)', background: 'var(--surface-color)' }}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={48} className="mb-2 icon-muted" />
                      <p className="mb-2 text-sm app-text-muted">
                        <span className="font-semibold">اضغط للرفع</span> أو اسحب الصورة هنا
                      </p>
                      <p className="text-xs app-text-muted">PNG, JPG, GIF (MAX. 10MB)</p>
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
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--surface-color)', color: 'var(--text-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  disabled={uploadingReceipt}
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleSubscribe(selectedPackage)}
                  disabled={!receiptFile || uploadingReceipt}
                  className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  style={{ background: receiptFile && !uploadingReceipt ? 'var(--primary-color)' : 'var(--surface-color)' }}
                  onMouseEnter={(e) => {
                    if (receiptFile && !uploadingReceipt) {
                      e.currentTarget.style.opacity = '0.9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (receiptFile && !uploadingReceipt) {
                      e.currentTarget.style.opacity = '1'
                    }
                  }}
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
