'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess } from '@/components/SweetAlert'
import Link from 'next/link'
import { Save, Globe, Mail, Shield, Eye } from 'lucide-react'

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
    <div className="min-h-screen py-8" style={{ background: 'var(--bg-color)' }}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/admin"
            className="hover:underline mb-4 inline-block"
            style={{ color: 'var(--primary-color)' }}
          >
            ← العودة للوحة الإدارة
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>إعدادات النظام</h1>
          <p className="mt-2" style={{ color: 'var(--text-color)', opacity: 0.7 }}>إدارة إعدادات النظام العامة</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="rounded-lg shadow-lg p-6" style={{ background: 'var(--background)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Globe size={24} style={{ color: 'var(--primary-color)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>الإعدادات العامة</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  اسم الموقع
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  وصف الموقع
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  البريد الإلكتروني للموقع
                </label>
                <input
                  type="email"
                  value={settings.siteEmail}
                  onChange={(e) => handleChange('siteEmail', e.target.value)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="rounded-lg shadow-lg p-6" style={{ background: 'var(--background)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Eye size={24} style={{ color: 'var(--accent)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>إعدادات النظام</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
                    وضع الصيانة
                  </label>
                  <p className="text-xs" style={{ color: 'var(--text-color)', opacity: 0.6 }}>إغلاق الموقع للصيانة (للمستخدمين العاديين فقط)</p>
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
                  <label className="block text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
                    السماح بالتسجيل
                  </label>
                  <p className="text-xs" style={{ color: 'var(--text-color)', opacity: 0.6 }}>السماح للمستخدمين الجدد بالتسجيل</p>
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
                  <label className="block text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
                    تفعيل الإشعارات
                  </label>
                  <p className="text-xs" style={{ color: 'var(--text-color)', opacity: 0.6 }}>إرسال إشعارات للمستخدمين</p>
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
                  <label className="block text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
                    تفعيل التحليلات
                  </label>
                  <p className="text-xs" style={{ color: 'var(--text-color)', opacity: 0.6 }}>تتبع إحصائيات الموقع</p>
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
              className="px-6 py-3 text-white rounded-lg disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold"
              style={{
                background: saving ? '#9ca3af' : 'var(--primary-color)'
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.opacity = '1'
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
