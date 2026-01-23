'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'
import { showError, showSuccess } from '@/components/SweetAlert'
import Link from 'next/link'
import { Save, Globe, Eye } from 'lucide-react'

export default function AdminSettingsPage() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    siteName: 'دليل المحلات والصيدليات',
    siteDescription: 'دليل شامل للمحلات والصيدليات',
    siteEmail: '',
    maintenanceMode: false,
    allowRegistrations: true,
    enableNotifications: true,
    enableAnalytics: true,
  })

  useEffect(() => {
    checkAdmin()
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: colors.primary }}
        ></div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/admin"
            className="hover:underline mb-4 inline-block"
            style={{ color: colors.primary }}
          >
            ← العودة للوحة الإدارة
          </Link>
          <h1 className="text-3xl font-bold" app-text-main>إعدادات النظام</h1>
          <p className="mt-2" app-text-muted>إدارة إعدادات النظام العامة</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="rounded-lg shadow-lg p-6" app-card>
            <div className="flex items-center gap-3 mb-4">
              <Globe size={24} className="icon-primary" />
              <h2 className="text-xl font-bold" app-text-main>الإعدادات العامة</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" app-text-main>
                  اسم الموقع
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="app-input w-full px-6 py-3 rounded-full focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 app-text-main">
                  وصف الموقع
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  rows={3}
                  className="app-input w-full px-6 py-3 rounded-full focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" app-text-main>
                  البريد الإلكتروني للموقع
                </label>
                <input
                  type="email"
                  value={settings.siteEmail}
                  onChange={(e) => handleChange('siteEmail', e.target.value)}
                  className="app-input w-full px-6 py-3 rounded-full focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="rounded-3xl shadow-lg p-6 app-card">
            <div className="flex items-center gap-3 mb-4">
              <Eye size={24} className="icon-accent" />
              <h2 className="text-xl font-bold app-text-main">إعدادات النظام</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold" app-text-main>
                    وضع الصيانة
                  </label>
                  <p className="text-xs" app-text-muted>إغلاق الموقع للصيانة (للمستخدمين العاديين فقط)</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`toggle-switch ${settings.maintenanceMode ? 'checked' : ''}`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold app-text-main">
                    السماح بالتسجيل
                  </label>
                  <p className="text-xs app-text-muted">السماح للمستخدمين الجدد بالتسجيل</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowRegistrations}
                    onChange={(e) => handleChange('allowRegistrations', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`toggle-switch ${settings.allowRegistrations ? 'checked' : ''}`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold" app-text-main>
                    تفعيل الإشعارات
                  </label>
                  <p className="text-xs" app-text-muted>إرسال إشعارات للمستخدمين</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`toggle-switch ${settings.enableNotifications ? 'checked' : ''}`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold" app-text-main>
                    تفعيل التحليلات
                  </label>
                  <p className="text-xs" app-text-muted>تتبع إحصائيات الموقع</p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAnalytics}
                    onChange={(e) => handleChange('enableAnalytics', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`toggle-switch ${settings.enableAnalytics ? 'checked' : ''}`}></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-full disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center gap-2 font-semibold hover:scale-105 active:scale-95"
              style={{
                backgroundColor: saving ? colors.surfaceVariant : colors.primary,
                color: colors.onPrimary,
              }}
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
