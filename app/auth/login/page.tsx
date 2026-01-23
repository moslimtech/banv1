'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { showError } from '@/components/SweetAlert'
import { LogIn } from 'lucide-react'
import { HeadlineMedium, Button } from '@/components/m3'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      // Use NEXT_PUBLIC_SITE_URL if available, otherwise use current origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectTo = `${siteUrl}/auth/callback`
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) throw error
    } catch (error: any) {
      showError(error.message || 'حدث خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center app-bg-base">
      <div className="app-card shadow-lg p-8 max-w-md w-full rounded-3xl">
        <HeadlineMedium className="text-center mb-6">تسجيل الدخول</HeadlineMedium>
        <Button
          variant="filled"
          size="lg"
          fullWidth
          onClick={handleGoogleLogin}
          loading={loading}
        >
          <LogIn size={20} />
          {loading ? 'جاري التحميل...' : 'تسجيل الدخول بحساب Google'}
        </Button>
      </div>
    </div>
  )
}
