'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess, showConfirm } from '@/components/SweetAlert'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'

export default function AdminAffiliatesPage() {
  const router = useRouter()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [availableDiscountCodes, setAvailableDiscountCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAffiliate, setEditingAffiliate] = useState<any | null>(null)

  useEffect(() => {
    checkAdmin()
    loadAffiliates()
    loadAvailableDiscountCodes()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard')
      return
    }
  }

  const loadAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select(`
          *,
          user:user_profiles(*),
          discount_code:discount_codes(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAffiliates(data || [])
    } catch (error: any) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableDiscountCodes = async () => {
    try {
      // Get all discount codes
      const { data: allCodes, error: codesError } = await supabase
        .from('discount_codes')
        .select('id, code, discount_percentage, is_active, start_date, end_date')
        .order('code', { ascending: true })

      if (codesError) throw codesError
      setAvailableDiscountCodes(allCodes || [])
    } catch (error: any) {
      console.error('Error loading discount codes:', error)
    }
  }

  // Get available codes for a specific affiliate (exclude codes used by other affiliates)
  const getAvailableCodesForAffiliate = (affiliateId: string, currentDiscountCodeId: string | null) => {
    const usedCodeIds = affiliates
      .filter(a => a.id !== affiliateId && a.discount_code_id)
      .map(a => a.discount_code_id)
    
    return availableDiscountCodes.filter(code => 
      !usedCodeIds.includes(code.id) || code.id === currentDiscountCodeId
    )
  }

  const handleUpdateCode = async (affiliate: any) => {
    const newCode = window.prompt('أدخل كود تسويق جديد', affiliate.code || '')
    if (!newCode || newCode.trim() === affiliate.code) return

    try {
      const trimmedCode = newCode.trim().toUpperCase()
      const { error } = await supabase
        .from('affiliates')
        .update({ code: trimmedCode })
        .eq('id', affiliate.id)

      if (error) throw error

      // حافظ على تزامن الكود في جدول المستخدمين
      await supabase
        .from('user_profiles')
        .update({ affiliate_code: trimmedCode })
        .eq('id', affiliate.user_id)

      showSuccess('تم تحديث كود المسوق بنجاح')
      loadAffiliates()
    } catch (error: any) {
      showError(error.message || 'تعذر تحديث الكود')
    }
  }

  const handleSelectDiscountCode = async (affiliate: any, discountCodeId: string | null) => {
    try {
      let updateData: any = { discount_code_id: discountCodeId }

      // إذا تم اختيار كود خصم، نسخ الكود ونسبة الخصم إلى كود التسويق
      if (discountCodeId) {
        const selectedDiscountCode = availableDiscountCodes.find(dc => dc.id === discountCodeId)
        if (selectedDiscountCode) {
          updateData.code = selectedDiscountCode.code
          updateData.discount_percentage = selectedDiscountCode.discount_percentage

          // تحديث affiliate_code في user_profiles أيضاً
          await supabase
            .from('user_profiles')
            .update({ affiliate_code: selectedDiscountCode.code })
            .eq('id', affiliate.user_id)
        }
      }

      const { error } = await supabase
        .from('affiliates')
        .update(updateData)
        .eq('id', affiliate.id)

      if (error) throw error

      showSuccess('تم تحديث كود الخصم والتسويق بنجاح')
      setEditingAffiliate(null)
      await loadAffiliates()
      await loadAvailableDiscountCodes()
    } catch (error: any) {
      showError(error.message || 'تعذر تحديث كود الخصم')
    }
  }

  const handleDeleteAffiliate = async (affiliate: any) => {
    const confirmed = await showConfirm('حذف هذا المسوق؟ سيتم إزالة صلاحياته وكوده.')
    if (!confirmed.isConfirmed) return

    try {
      const { error } = await supabase
        .from('affiliates')
        .delete()
        .eq('id', affiliate.id)

      if (error) throw error

      await supabase
        .from('user_profiles')
        .update({ is_affiliate: false, affiliate_code: null })
        .eq('id', affiliate.user_id)

      showSuccess('تم حذف المسوق وإزالة صلاحياته بنجاح')
      loadAffiliates()
    } catch (error: any) {
      showError(error.message || 'تعذر حذف المسوق')
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
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-blue-500 hover:underline mb-4 inline-block"
          >
            ← العودة للوحة الإدارة
          </Link>
          <h1 className="text-3xl font-bold app-text-main">إدارة المسوقين</h1>
        </div>

        <div className="app-card shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="app-bg-surface">
              <tr style={{ borderColor: 'var(--border-color)' }}>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">المسوق</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">كود الخصم</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">نسبة الخصم</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">إجمالي الأرباح</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase app-text-muted">الإجراءات</th>
              </tr>
            </thead>
            <tbody style={{ borderColor: 'var(--border-color)' }}>
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {affiliate.user?.avatar_url ? (
                        <img
                          src={affiliate.user.avatar_url}
                          alt={affiliate.user.full_name || affiliate.user.email}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--primary-color)' }}>
                          {(affiliate.user?.full_name?.[0] || affiliate.user?.email?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{affiliate.user?.full_name || 'بدون اسم'}</div>
                        <div className="text-sm app-text-muted">{affiliate.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingAffiliate?.id === affiliate.id ? (
                      <select
                        value={editingAffiliate.discount_code_id || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value || null
                          handleSelectDiscountCode(affiliate, selectedId)
                        }}
                        onBlur={() => setEditingAffiliate(null)}
                        className="px-3 py-1 app-input rounded-lg text-sm focus:outline-none"
                        style={{ borderColor: 'var(--border-color)' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        autoFocus
                      >
                        <option value="">بدون كود خصم</option>
                        {getAvailableCodesForAffiliate(affiliate.id, affiliate.discount_code_id).map((dc) => (
                          <option key={dc.id} value={dc.id}>
                            {dc.code} ({dc.discount_percentage}%)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {affiliate.discount_code?.code || 'بدون'}
                        </span>
                        <button
                          onClick={() => setEditingAffiliate(affiliate)}
                          className="app-hover-bg"
                          style={{ color: 'var(--primary-color)' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          title="تغيير كود الخصم"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {affiliate.discount_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    {affiliate.total_earnings} EGP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {affiliate.is_active ? (
                      <span className="px-2 py-1 rounded text-xs" style={{ background: 'var(--status-green-bg)', color: 'var(--secondary-color)' }}>نشط</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs" style={{ background: 'var(--surface-color)', color: 'var(--text-color)' }}>غير نشط</span>
                    )}
                  </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {editingAffiliate?.id !== affiliate.id && (
                      <>
                        <button
                          onClick={() => setEditingAffiliate({ ...affiliate })}
                          className="p-2 rounded transition-colors app-hover-bg"
                          style={{ color: 'var(--secondary-color)' }}
                          title={affiliate.discount_code_id ? "تغيير كود الخصم" : "اختيار كود خصم"}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleUpdateCode(affiliate)}
                          className="p-2 rounded transition-colors app-hover-bg"
                          style={{ color: 'var(--primary-color)' }}
                          title="تعديل الكود"
                        >
                          <Edit size={18} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteAffiliate(affiliate)}
                      className="p-2 rounded transition-colors app-hover-bg"
                      style={{ color: 'var(--status-error)' }}
                      title="حذف المسوق"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
