'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DiscountCode } from '@/lib/types'
import { showError, showSuccess, showConfirm } from '@/components/SweetAlert'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function AdminDiscountCodesPage() {
  const router = useRouter()
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    start_date: '',
    end_date: '',
    max_uses: null as number | null,
    description_ar: '',
    description_en: '',
    is_active: true,
  })

  useEffect(() => {
    checkAdmin()
    loadDiscountCodes()
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

  const loadDiscountCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDiscountCodes(data || [])
    } catch (error: any) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const codeData = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        created_by: user.id,
        max_uses: formData.max_uses || null,
      }

      if (editingCode) {
        const { error } = await supabase
          .from('discount_codes')
          .update(codeData)
          .eq('id', editingCode.id)

        if (error) throw error
        showSuccess('تم تحديث كود الخصم بنجاح')
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert(codeData)

        if (error) throw error
        showSuccess('تم إنشاء كود الخصم بنجاح')
      }

      setShowForm(false)
      setEditingCode(null)
      resetForm()
      loadDiscountCodes()
    } catch (error: any) {
      showError(error.message || 'حدث خطأ أثناء حفظ كود الخصم')
    }
  }

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      discount_percentage: code.discount_percentage,
      start_date: new Date(code.start_date).toISOString().slice(0, 16),
      end_date: new Date(code.end_date).toISOString().slice(0, 16),
      max_uses: code.max_uses,
      description_ar: code.description_ar || '',
      description_en: code.description_en || '',
      is_active: code.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm('هل أنت متأكد من حذف كود الخصم هذا؟')
    if (!confirmed.isConfirmed) return

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSuccess('تم حذف كود الخصم بنجاح')
      loadDiscountCodes()
    } catch (error: any) {
      showError(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: 10,
      start_date: '',
      end_date: '',
      max_uses: null,
      description_ar: '',
      description_en: '',
      is_active: true,
    })
  }

  const isCodeActive = (code: DiscountCode) => {
    const now = new Date()
    const start = new Date(code.start_date)
    const end = new Date(code.end_date)
    return (
      code.is_active &&
      now >= start &&
      now <= end &&
      (code.max_uses === null || code.used_count < code.max_uses)
    )
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
            className="mb-4 inline-block"
            style={{ color: 'var(--primary-color)' }}
          >
            ← العودة للوحة الإدارة
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold app-text-main">إدارة أكواد الخصم</h1>
              <p className="app-text-muted mt-2">إنشاء وإدارة أكواد الخصم مع تواريخ البداية والنهاية</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingCode(null)
                resetForm()
              }}
              className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
              style={{ background: 'var(--primary-color)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={20} />
              إضافة كود خصم
            </button>
          </div>
        </div>

        {showForm && (
          <div className="app-card shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 app-text-main">
              {editingCode ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold app-text-main mb-2">
                    كود الخصم *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="app-input w-full focus:outline-none"
                    style={{ borderColor: 'var(--border-color)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    placeholder="مثال: SUMMER2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold app-text-main mb-2">
                    نسبة الخصم (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    className="app-input w-full focus:outline-none"
                    style={{ borderColor: 'var(--border-color)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold app-text-main mb-2">
                    تاريخ البداية *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="app-input w-full focus:outline-none"
                    style={{ borderColor: 'var(--border-color)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold app-text-main mb-2">
                    تاريخ النهاية *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="app-input w-full focus:outline-none"
                    style={{ borderColor: 'var(--border-color)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold app-text-main mb-2">
                    الحد الأقصى للاستخدام (اختياري)
                  </label>
                  <input
                    type="number"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                    min="1"
                    className="app-input w-full focus:outline-none"
                    style={{ borderColor: 'var(--border-color)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    placeholder="اتركه فارغاً للاستخدام غير المحدود"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold app-text-main">نشط</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold app-text-main mb-2">
                    الوصف (عربي)
                  </label>
                  <textarea
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    rows={2}
                    className="app-input w-full focus:outline-none"
                    style={{ borderColor: 'var(--border-color)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    placeholder="وصف كود الخصم بالعربية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold app-text-main mb-2">
                    الوصف (إنجليزي)
                  </label>
                  <textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    rows={2}
                    className="app-input w-full focus:outline-none"
                    style={{ borderColor: 'var(--border-color)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    placeholder="Discount code description in English"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 text-white rounded-lg transition-colors"
                  style={{ background: 'var(--primary-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {editingCode ? 'تحديث' : 'إنشاء'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCode(null)
                    resetForm()
                  }}
                  className="px-6 py-2 text-white rounded-lg transition-colors"
                  style={{ background: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="app-card shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="app-bg-surface">
                <tr style={{ borderColor: 'var(--border-color)' }}>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase app-text-main">الكود</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase app-text-main">الخصم</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase app-text-main">تاريخ البداية</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase app-text-main">تاريخ النهاية</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase app-text-main">الاستخدام</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase app-text-main">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase app-text-main">الإجراءات</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--border-color)' }}>
                {discountCodes.map((code) => {
                  const active = isCodeActive(code)
                  return (
                    <tr key={code.id} className="app-hover-bg" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold app-text-main">{code.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold" style={{ color: 'var(--secondary-color)' }}>{code.discount_percentage}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm app-text-main">
                          <Calendar size={14} />
                          {new Date(code.start_date).toLocaleString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm app-text-main">
                          <Calendar size={14} />
                          {new Date(code.end_date).toLocaleString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm app-text-main">
                          {code.used_count} / {code.max_uses || '∞'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={active ? { background: 'var(--status-green-bg)', color: 'var(--secondary-color)' } : { background: 'var(--surface-color)', color: 'var(--text-color)' }}
                        >
                          {active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(code)}
                            className="p-2 rounded transition-colors app-hover-bg"
                            style={{ color: 'var(--primary-color)' }}
                            title="تعديل"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(code.id)}
                            className="p-2 rounded transition-colors app-hover-bg"
                            style={{ color: 'var(--status-error)' }}
                            title="حذف"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {discountCodes.length === 0 && (
            <div className="text-center py-12 app-text-muted">
              لا توجد أكواد خصم حالياً
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
