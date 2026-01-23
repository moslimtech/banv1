'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminManager } from '@/hooks'
import { DiscountCode } from '@/lib/types'
import { showError, showConfirm } from '@/components/SweetAlert'
import { LoadingSpinner, Button, Input, Card } from '@/components/common'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminDiscountCodesPage() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const {
    isAdmin,
    loading: adminLoading,
    discountCodes,
    discountCodesLoading,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
  } = useAdminManager({ autoLoadDiscountCodes: true })

  const [showForm, setShowForm] = useState(false)
  const [editingCode, setEditingCode] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    max_uses: null as number | null,
    start_date: '',
    end_date: '',
  })

  // Redirect non-admin users
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: 10,
      max_uses: null,
      start_date: '',
      end_date: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const codeData = {
      code: formData.code.toUpperCase().trim(),
      discount_percentage: formData.discount_percentage,
      max_uses: formData.max_uses,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    } as any

    const success = editingCode
      ? await updateDiscountCode(editingCode.id, codeData)
      : await createDiscountCode(codeData)

    if (success) {
      setShowForm(false)
      setEditingCode(null)
      resetForm()
    }
  }

  const handleEdit = (code: any) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      discount_percentage: code.discount_percentage,
      max_uses: code.max_uses,
      start_date: code.start_date ? new Date(code.start_date).toISOString().split('T')[0] : '',
      end_date: code.end_date ? new Date(code.end_date).toISOString().split('T')[0] : '',
    })
    setShowForm(true)
  }

  const handleToggleActive = async (code: DiscountCode) => {
    await updateDiscountCode(code.id, { is_active: !code.is_active })
  }

  const handleDelete = async (code: DiscountCode) => {
    const confirmed = await showConfirm('هل أنت متأكد من حذف هذا الكود؟')
    
    if (!confirmed.isConfirmed) return

    await deleteDiscountCode(code.id)
  }

  if (adminLoading || discountCodesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    )
  }

  if (!isAdmin) {
    return null // Redirecting...
  }

  return (
    <div 
      className="min-h-screen py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="mb-4 inline-block hover:underline"
            style={{ color: colors.primary }}
          >
            ← العودة للوحة الإدارة
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold app-text-main">إدارة أكواد الخصم</h1>
            <Button
              variant="filled"
              onClick={() => {
                setShowForm(true)
                setEditingCode(null)
                resetForm()
              }}
              className="flex items-center gap-2"
            >
              <Plus size={22} />
              إضافة كود جديد
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 app-text-main">
              {editingCode ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="الكود"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2026"
                />
                <Input
                  label="نسبة الخصم (%)"
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 10 })}
                  placeholder="10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="عدد الاستخدامات (اختياري)"
                  type="number"
                  min="1"
                  value={formData.max_uses || ''}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="غير محدود"
                  helperText="اتركه فارغاً للسماح باستخدامات غير محدودة"
                />
                <Input
                  label="تاريخ البداية"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
                <Input
                  label="تاريخ الانتهاء (اختياري)"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  helperText="اتركه فارغاً إذا لم يكن له تاريخ انتهاء"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit">
                  {editingCode ? 'تحديث الكود' : 'إضافة الكود'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => setShowForm(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card className="shadow-lg overflow-hidden" padding="none">
          <table className="w-full">
            <thead className="app-bg-surface">
              <tr >
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">الكود</th>
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">نسبة الخصم</th>
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">الاستخدامات</th>
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">تاريخ الانتهاء</th>
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">الحالة</th>
                <th className="px-6 py-4 text-right text-base font-bold app-text-main">الإجراءات</th>
              </tr>
            </thead>
            <tbody >
              {discountCodes.map((code) => (
                <tr key={code.id} className="app-hover-bg transition-colors" >
                  <td className="px-6 py-5">
                    <span className="font-mono text-base font-bold app-text-main">{code.code}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-base app-text-main">{code.discount_percentage}%</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-base app-text-main">
                      {code.max_uses ? `${code.used_count || 0} / ${code.max_uses}` : 'غير محدود'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm app-text-muted">
                      {code.end_date ? new Date(code.end_date).toLocaleDateString('ar-EG') : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => handleToggleActive(code)}
                      className="px-3 py-1 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                      style={{
                        backgroundColor: code.is_active 
                          ? `${colors.success}20`
                          : `${colors.error}20`,
                        color: code.is_active ? colors.success : colors.error,
                      }}
                    >
                      {code.is_active ? 'نشط' : 'معطل'}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-3">
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handleEdit(code)}
                        className="!p-2"
                        title="تعديل"
                      >
                        <Edit size={18} />
                      </Button>
                      <Button
                        variant="filled"
                        size="sm"
                        onClick={() => handleDelete(code)}
                        className="!p-2"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {discountCodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center app-text-muted">
                    لا توجد أكواد خصم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
