'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'

export default function PlacesRedirectPage() {
  const router = useRouter()
  const { colors } = useTheme()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div 
        className="animate-spin rounded-full h-12 w-12 border-b-2"
        style={{ borderBottomColor: colors.primary }}
      ></div>
    </div>
  )
}
