/**
 * Unified Theme Context
 * 
 * Provides role-based theming and M3 design tokens.
 * 
 * Features:
 * - Role-based colors (Admin = Blue, Affiliate = Green, User = Purple)
 * - Dark mode support
 * - M3 color system
 * - Centralized theme configuration
 * 
 * Usage:
 * const { colors, isDark, toggleTheme } = useTheme()
 */

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuthContext } from './AuthContext'
import { getUserRole, type UserRole } from '@/config/navigation'

export interface ThemeColors {
  // Primary brand color
  primary: string
  primaryRgb: string
  primaryDark: string
  
  // Secondary accent color
  secondary: string
  secondaryRgb: string
  
  // Background colors
  background: string
  surface: string
  surfaceVariant: string
  surfaceContainer: string
  
  // Text colors
  onPrimary: string
  onSecondary: string
  onBackground: string
  onSurface: string
  onSurfaceVariant: string
  
  // Status colors
  success: string
  successContainer: string
  warning: string
  warningContainer: string
  error: string
  errorContainer: string
  info: string
  infoContainer: string
  
  // Border colors
  outline: string
  outlineVariant: string
}

interface ThemeContextType {
  colors: ThemeColors
  isDark: boolean
  role: UserRole
  toggleTheme: () => void
  setManualTheme: (dark: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Role-based color schemes
 * Primary brand color: GOLD (#D4AF37) - Premium Android app aesthetic
 */
const roleColors: Record<UserRole, { primary: string; primaryRgb: string; secondary: string }> = {
  admin: {
    primary: '#D4AF37', // Gold - Admin brand
    primaryRgb: '212, 175, 55',
    secondary: '#10b981', // Green for status
  },
  affiliate: {
    primary: '#D4AF37', // Gold - Unified brand
    primaryRgb: '212, 175, 55',
    secondary: '#10b981', // Green for earnings
  },
  user: {
    primary: '#D4AF37', // Gold - Unified brand
    primaryRgb: '212, 175, 55',
    secondary: '#ec4899', // Pink for accents
  },
  guest: {
    primary: '#9ca3af', // Gray for guests
    primaryRgb: '156, 163, 175',
    secondary: '#6b7280', // Darker gray
  },
}

/**
 * Light theme colors
 */
function getLightColors(role: UserRole): ThemeColors {
  const roleColor = roleColors[role]
  
  return {
    primary: roleColor.primary,
    primaryRgb: roleColor.primaryRgb,
    primaryDark: '#2563eb', // Darker shade
    secondary: roleColor.secondary,
    secondaryRgb: '16, 185, 129',
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceVariant: '#f3f4f6',
    surfaceContainer: '#e5e7eb',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: '#171717',
    onSurface: '#171717',
    onSurfaceVariant: '#525252',
    success: '#10b981',
    successContainer: '#d1fae5',
    warning: '#f59e0b',
    warningContainer: '#fef3c7',
    error: '#ef4444',
    errorContainer: '#fee2e2',
    info: '#3b82f6',
    infoContainer: '#dbeafe',
    outline: '#e5e7eb',
    outlineVariant: '#d1d5db',
  }
}

/**
 * Dark theme colors
 */
function getDarkColors(role: UserRole): ThemeColors {
  const roleColor = roleColors[role]
  
  return {
    primary: roleColor.primary,
    primaryRgb: roleColor.primaryRgb,
    primaryDark: '#60a5fa', // Lighter in dark mode
    secondary: roleColor.secondary,
    secondaryRgb: '52, 211, 153',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceVariant: '#1f2937',
    surfaceContainer: '#374151',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
    onBackground: '#ededed',
    onSurface: '#e5e5e5',
    onSurfaceVariant: '#a3a3a3',
    success: '#34d399',
    successContainer: '#064e3b',
    warning: '#fbbf24',
    warningContainer: '#78350f',
    error: '#f87171',
    errorContainer: '#7f1d1d',
    info: '#60a5fa',
    infoContainer: '#1e3a8a',
    outline: '#374151',
    outlineVariant: '#4b5563',
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuthContext()
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  const role = getUserRole(profile)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true)
    
    // Check localStorage first
    const savedTheme = localStorage.getItem('ban-theme')
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setIsDark(savedTheme === 'dark')
      return
    }

    // Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(prefersDark)
  }, [])

  // Apply theme to CSS variables
  useEffect(() => {
    if (!mounted) return

    const colors = isDark ? getDarkColors(role) : getLightColors(role)
    const root = document.documentElement

    // Apply M3 colors to CSS variables
    root.style.setProperty('--primary-color', colors.primary)
    root.style.setProperty('--primary-color-rgb', colors.primaryRgb)
    root.style.setProperty('--primary-dark', colors.primaryDark)
    root.style.setProperty('--secondary-color', colors.secondary)
    root.style.setProperty('--bg-color', colors.background)
    root.style.setProperty('--text-color', colors.onBackground)
    root.style.setProperty('--surface-color', colors.surface)
    root.style.setProperty('--surface-hover', colors.surfaceVariant)
    root.style.setProperty('--surface-active', colors.surfaceContainer)
    root.style.setProperty('--border-color', colors.outline)
    root.style.setProperty('--border-color-hover', colors.outlineVariant)
    root.style.setProperty('--status-online', colors.success)
    root.style.setProperty('--status-warning', colors.warning)
    root.style.setProperty('--status-error', colors.error)

    // Save to localStorage
    localStorage.setItem('ban-theme', isDark ? 'dark' : 'light')
  }, [isDark, role, mounted])

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  const setManualTheme = (dark: boolean) => {
    setIsDark(dark)
  }

  const colors = isDark ? getDarkColors(role) : getLightColors(role)

  return (
    <ThemeContext.Provider value={{ colors, isDark, role, toggleTheme, setManualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
