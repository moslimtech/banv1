'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess } from '@/components/SweetAlert'
import Link from 'next/link'
import { Save, Globe, Mail, Shield, Eye, Key } from 'lucide-react'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    siteName: 'دليل المحلات والصيدليات',
    siteDescription: 'دليل شامل للمحلات والصيدليات',
    siteEmail: '',
    maintenanceMode: false,
    allowRegistrations: true,
    maxPlacesPerUser: 10,
    maxProductsPerPlace: 100,
    enableAffiliates: true,
    affiliateCommission: 10,
    enableNotifications: true,
    enableAnalytics: true,
  })

  useEffect(() => {
    checkAdmin()
    loadSettings()
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

    setLoading(false)
  }

  const loadSettings = async () => {
    try {
      // Load settings from localStorage or database
      const savedSettings = localStorage.getItem('admin_settings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to localStorage (can be extended to save to database)
      localStorage.setItem('admin_settings', JSON.stringify(settings))
      showSuccess('تم حفظ الإعدادات بنجاح')
    } catch (error: any) {
      showError('حدث خطأ أثناء حفظ الإعدادات: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
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
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-blue-500 hover:underline mb-4 inline-block"
          >
            ← العودة للوحة الإدارة
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">إعدادات النظام</h1>
          <p className="text-gray-600 mt-2">إدارة إعدادات النظام العامة</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-blue-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">الإعدادات العامة</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  اسم الموقع
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  وصف الموقع
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  البريد الإلكتروني للموقع
                </label>
                <input
                  type="email"
                  value={settings.siteEmail}
                  onChange={(e) => handleChange('siteEmail', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Limits Settings */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="text-green-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">الحدود والقيود</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  الحد الأقصى للأماكن لكل مستخدم
                </label>
                <input
                  type="number"
                  value={settings.maxPlacesPerUser}
                  onChange={(e) => handleChange('maxPlacesPerUser', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  الحد الأقصى للمنتجات لكل مكان
                </label>
                <input
                  type="number"
                  value={settings.maxProductsPerPlace}
                  onChange={(e) => handleChange('maxProductsPerPlace', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Affiliate Settings */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-yellow-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">إعدادات التسويق بالعمولة</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    تفعيل نظام التسويق بالعمولة
                  </label>
                  <p className="text-xs text-gray-600">السماح للمستخدمين بالتسجيل كمسوقين</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAffiliates}
                    onChange={(e) => handleChange('enableAffiliates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {settings.enableAffiliates && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    نسبة العمولة (%)
                  </label>
                  <input
                    type="number"
                    value={settings.affiliateCommission}
                    onChange={(e) => handleChange('affiliateCommission', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="text-purple-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">إعدادات النظام</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    وضع الصيانة
                  </label>
                  <p className="text-xs text-gray-600">إغلاق الموقع للصيانة (للمستخدمين العاديين فقط)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    السماح بالتسجيل
                  </label>
                  <p className="text-xs text-gray-600">السماح للمستخدمين الجدد بالتسجيل</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowRegistrations}
                    onChange={(e) => handleChange('allowRegistrations', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    تفعيل الإشعارات
                  </label>
                  <p className="text-xs text-gray-600">إرسال إشعارات للمستخدمين</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    تفعيل التحليلات
                  </label>
                  <p className="text-xs text-gray-600">تتبع إحصائيات الموقع</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAnalytics}
                    onChange={(e) => handleChange('enableAnalytics', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold"
            >
              <Save size={20} />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
