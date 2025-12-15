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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdmin()
    loadAffiliates()
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
          user:user_profiles(*)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-blue-500 hover:underline mb-4 inline-block"
          >
            ← العودة للوحة الإدارة
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المسوقين</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المسوق</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">كود التسويق</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نسبة الخصم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي الأرباح</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
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
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {(affiliate.user?.full_name?.[0] || affiliate.user?.email?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{affiliate.user?.full_name || 'بدون اسم'}</div>
                        <div className="text-sm text-gray-500">{affiliate.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {affiliate.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {affiliate.discount_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">
                    {affiliate.total_earnings} EGP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {affiliate.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">نشط</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">غير نشط</span>
                    )}
                  </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateCode(affiliate)}
                      className="p-2 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                      title="تعديل الكود"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteAffiliate(affiliate)}
                      className="p-2 rounded text-red-600 hover:bg-red-50 transition-colors"
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
