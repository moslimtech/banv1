/**
 * Material Design 3 App Shell
 * 
 * Main layout component that provides:
 * - Responsive navigation (Sidebar on desktop, Bottom Nav on mobile)
 * - WebView detection and optimization
 * - Content area with proper spacing
 * - Theme-aware styling
 * - Safe area handling for mobile devices
 * 
 * Features:
 * - Desktop: Sidebar (right side, Arabic)
 * - Mobile/WebView: Bottom Navigation
 * - Automatic padding for navigation
 * - WebView-specific optimizations
 * - Safe area insets support
 * 
 * Usage:
 * <AppShell>
 *   <YourPageContent />
 * </AppShell>
 */

'use client'

import { ReactNode, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useWebView, applyWebViewOptimizations } from '@/lib/webview-detection'
import BottomNavigation from './BottomNavigation'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { colors } = useTheme()
  const { isWebView, platform, variant, loading, safeAreaInsets } = useWebView()

  // Apply WebView optimizations on mount
  useEffect(() => {
    if (isWebView) {
      applyWebViewOptimizations()
    }
  }, [isWebView])

  // Don't render until WebView detection is complete
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
          style={{ borderColor: colors.primary }}
        />
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${isWebView ? 'webview-optimized' : ''}`}
      style={{
        backgroundColor: colors.background,
        color: colors.onBackground,
        // Safe area insets for WebView
        paddingTop: isWebView ? `${safeAreaInsets.top}px` : '0',
      }}
    >
      {/* Main Content Area */}
      <main
        className="min-h-screen transition-all duration-300"
        style={{
          // Add padding for bottom nav on mobile/WebView
          paddingBottom: 'var(--bottom-nav-height, 0px)',
        }}
      >
        {children}
      </main>

      {/* Mobile/WebView Bottom Navigation */}
      <BottomNavigation />

      {/* WebView Status Indicator (dev mode only) */}
      {process.env.NODE_ENV === 'development' && isWebView && (
        <div
          className="fixed top-2 left-2 px-3 py-1 rounded-full text-xs font-bold z-[9999]"
          style={{
            backgroundColor: colors.primary,
            color: colors.onPrimary,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          📱 WebView: {platform || 'unknown'}
        </div>
      )}

      {/* CSS Variables for Layout */}
      <style jsx global>{`
        :root {
          --bottom-nav-height: ${isWebView ? 'calc(64px + env(safe-area-inset-bottom))' : '0px'};
        }

        @media (max-width: 1024px) {
          :root {
            --bottom-nav-height: calc(64px + env(safe-area-inset-bottom));
          }
        }

        /* WebView-specific optimizations */
        .webview-optimized {
          -webkit-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }

        .webview-optimized input,
        .webview-optimized textarea {
          -webkit-user-select: text;
          user-select: text;
        }

        /* Safe area support */
        @supports (padding: max(0px)) {
          .webview-optimized {
            padding-left: max(0px, env(safe-area-inset-left));
            padding-right: max(0px, env(safe-area-inset-right));
          }
        }
      `}</style>
    </div>
  )
}
