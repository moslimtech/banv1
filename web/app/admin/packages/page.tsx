'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Package } from '@/lib/types'
import { showError, showSuccess } from '@/components/SweetAlert'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminPackagesPage() {
  const router = useRouter()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    price: 0,
    max_places: 1,
    max_product_videos: 0,
    max_product_images: 5,
    max_place_videos: 1,
    priority: 0,
    card_style: 'default',
    is_featured: false,
  })

  useEffect(() => {
    checkAdmin()
    loadPackages()
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

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('priority', { ascending: false })

      if (error) throw error
      setPackages(data || [])
    } catch (error: any) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingPackage) {
        const { error } = await supabase
          .from('packages')
          .update(formData)
          .eq('id', editingPackage.id)

        if (error) throw error
        showSuccess('تم تحديث الباقة بنجاح')
      } else {
        const { error } = await supabase.from('packages').insert(formData)

        if (error) throw error
        showSuccess('تم إضافة الباقة بنجاح')
      }

      setShowForm(false)
      setEditingPackage(null)
      setFormData({
        name_ar: '',
        name_en: '',
        price: 0,
        max_places: 1,
        max_product_videos: 0,
        max_product_images: 5,
        max_place_videos: 1,
        priority: 0,
        card_style: 'default',
        is_featured: false,
      })
      loadPackages()
    } catch (error: any) {
      showError(error.message)
    }
  }

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setFormData({
      name_ar: pkg.name_ar,
      name_en: pkg.name_en,
      price: pkg.price,
      max_places: pkg.max_places,
      max_product_videos: pkg.max_product_videos,
      max_product_images: pkg.max_product_images,
      max_place_videos: pkg.max_place_videos,
      priority: pkg.priority,
      card_style: pkg.card_style || 'default',
      is_featured: pkg.is_featured,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await (window as any).Swal.fire({
      icon: 'warning',
      title: 'تأكيد الحذف',
      text: 'هل أنت متأكد من حذف هذه الباقة؟',
      showCancelButton: true,
      confirmButtonText: 'نعم',
      cancelButtonText: 'لا',
    })

    if (confirmed.isConfirmed) {
      try {
        const { error } = await supabase.from('packages').delete().eq('id', id)
        if (error) throw error
        showSuccess('تم حذف الباقة بنجاح')
        loadPackages()
      } catch (error: any) {
        showError(error.message)
      }
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">إدارة الباقات</h1>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingPackage(null)
                setFormData({
                  name_ar: '',
                  name_en: '',
                  price: 0,
                  max_places: 1,
                  max_product_videos: 0,
                  max_product_images: 5,
                  max_place_videos: 1,
                  priority: 0,
                  card_style: 'default',
                  is_featured: false,
                })
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={22} />
              إضافة باقة جديدة
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingPackage ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-700">
                    الاسم بالعربية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="أدخل الاسم بالعربية"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-700">
                    الاسم بالإنجليزية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter name in English"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-700">
                    السعر <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-700">
                    عدد الأماكن <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.max_places || ''}
                    onChange={(e) => setFormData({ ...formData, max_places: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-700">
                    الأولوية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.priority || ''}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-700">
                    فيديوهات المنتج
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_product_videos || ''}
                    onChange={(e) => setFormData({ ...formData, max_product_videos: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-700">
                    صور المنتج
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_product_images || ''}
                    onChange={(e) => setFormData({ ...formData, max_product_images: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-700">
                    فيديوهات المكان
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_place_videos || ''}
                    onChange={(e) => setFormData({ ...formData, max_place_videos: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-semibold mb-3 text-gray-700">
                    نمط الكارت
                  </label>
                  <select
                    value={formData.card_style}
                    onChange={(e) => setFormData({ ...formData, card_style: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="default">افتراضي</option>
                    <option value="silver">فضي</option>
                    <option value="gold">ذهبي</option>
                    <option value="premium">مميز</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-6 h-6 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is_featured" className="text-base font-semibold text-gray-700 cursor-pointer">
                    باقة مميزة (تظهر في الأعلى)
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-base font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  {editingPackage ? 'تحديث الباقة' : 'إضافة الباقة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-base font-semibold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-base font-bold text-gray-700">الاسم</th>
                <th className="px-6 py-4 text-right text-base font-bold text-gray-700">السعر</th>
                <th className="px-6 py-4 text-right text-base font-bold text-gray-700">الأماكن</th>
                <th className="px-6 py-4 text-right text-base font-bold text-gray-700">الأولوية</th>
                <th className="px-6 py-4 text-right text-base font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div>
                      <div className="font-semibold text-base text-gray-900">{pkg.name_ar}</div>
                      <div className="text-sm text-gray-600 mt-1">{pkg.name_en}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-base font-bold text-blue-600">{pkg.price} EGP</span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-base text-gray-700">{pkg.max_places}</span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-base text-gray-700">{pkg.priority}</span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={20} />
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
