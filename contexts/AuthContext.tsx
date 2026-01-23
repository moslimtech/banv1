'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  isAffiliate: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// LocalStorage keys
const STORAGE_KEYS = {
  USER: 'ban_user',
  PROFILE: 'ban_profile',
  SESSION: 'ban_session',
  LAST_SYNC: 'ban_last_sync',
} as const

// Session sync interval (5 minutes)
const SYNC_INTERVAL = 5 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // ✅ Save session to localStorage
  const saveToLocalStorage = (user: User | null, profile: UserProfile | null) => {
    if (typeof window === 'undefined') return

    try {
      if (user && profile) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile))
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString())
      } else {
        // Clear localStorage on logout
        localStorage.removeItem(STORAGE_KEYS.USER)
        localStorage.removeItem(STORAGE_KEYS.PROFILE)
        localStorage.removeItem(STORAGE_KEYS.LAST_SYNC)
      }
    } catch (error) {
      console.error('❌ [AUTH] Failed to save to localStorage:', error)
    }
  }

  // ✅ Load session from localStorage (for instant hydration)
  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return { user: null, profile: null }

    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER)
      const profileStr = localStorage.getItem(STORAGE_KEYS.PROFILE)
      const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC)

      if (!userStr || !profileStr) {
        return { user: null, profile: null }
      }

      // Check if data is stale (older than 24 hours)
      const lastSyncTime = parseInt(lastSync || '0', 10)
      const isStale = Date.now() - lastSyncTime > 24 * 60 * 60 * 1000

      if (isStale) {
      }

      const user = JSON.parse(userStr) as User
      const profile = JSON.parse(profileStr) as UserProfile

      return { user, profile }
    } catch (error) {
      console.error('❌ [AUTH] Failed to load from localStorage:', error)
      return { user: null, profile: null }
    }
  }

  // ✅ Load user from Supabase
  const loadUser = async (fromLocalStorageFirst = false) => {
    try {
      // If requested, try localStorage first for instant hydration
      if (fromLocalStorageFirst && !hydrated) {
        const cached = loadFromLocalStorage()
        if (cached.user && cached.profile) {
          setUser(cached.user)
          setProfile(cached.profile)
          setHydrated(true)
          // Continue to verify with server in background
        }
      }

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        setUser(null)
        setProfile(null)
        saveToLocalStorage(null, null)
        setLoading(false)
        return
      }

      setUser(authUser)

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (profileError) {
        console.error('Error loading profile:', profileError)
      }

      const newProfile = profileData || null
      setProfile(newProfile)

      // ✅ Save to localStorage
      saveToLocalStorage(authUser, newProfile)
    } catch (error) {
      console.error('Error in AuthProvider:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Mark as mounted to avoid hydration mismatch
    setIsMounted(true)
    
    // ✅ Load from localStorage first for instant hydration (critical for Android WebView)
    loadUser(true)

    // ✅ Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setProfile(null)
        saveToLocalStorage(null, null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUser()
      }
    })

    // ✅ Periodic sync to keep localStorage fresh (every 5 minutes)
    const syncInterval = setInterval(() => {
      if (user && profile) {
        loadUser()
      }
    }, SYNC_INTERVAL)

    return () => {
      subscription.unsubscribe()
      clearInterval(syncInterval)
    }
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAdmin: profile?.is_admin || false,
    isAffiliate: profile?.is_affiliate || false,
    refresh: loadUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context with optional redirect
 */
export function useAuthContext(redirectToLogin: boolean = false) {
  const router = useRouter()
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }

  useEffect(() => {
    if (redirectToLogin && !context.loading && !context.user) {
      router.push('/auth/login')
    }
  }, [redirectToLogin, context.loading, context.user, router])

  return context
}
