/**
 * WebView Detection Utilities
 * 
 * Detect if the app is running inside an Android/iOS WebView
 * and provide WebView-specific optimizations.
 * 
 * Detection Methods:
 * 1. User-Agent string
 * 2. URL parameter (?webview=true)
 * 3. Custom header check
 * 
 * Usage:
 * const { isWebView, platform } = useWebView()
 */

'use client'

import { useState, useEffect } from 'react'

export interface WebViewInfo {
  /** Is running in WebView */
  isWebView: boolean
  /** Platform (android, ios, or null) */
  platform: 'android' | 'ios' | null
  /** Is standalone mode (PWA) */
  isStandalone: boolean
  /** WebView variant */
  variant: 'webview' | 'pwa' | 'browser'
}

/**
 * Detect if running in WebView from User-Agent
 */
function detectWebViewFromUserAgent(): WebViewInfo {
  if (typeof window === 'undefined') {
    return { isWebView: false, platform: null, isStandalone: false, variant: 'browser' }
  }

  const userAgent = window.navigator.userAgent.toLowerCase()

  // Android WebView detection
  const isAndroidWebView = 
    userAgent.includes('wv') || // Android WebView marker
    userAgent.includes('android') && userAgent.includes('version/') && !userAgent.includes('chrome/') ||
    userAgent.includes('banapp') // Custom WebView identifier

  // iOS WebView detection
  const isIOSWebView =
    (userAgent.includes('iphone') || userAgent.includes('ipad')) &&
    !userAgent.includes('safari') &&
    !userAgent.includes('crios') // Chrome on iOS

  // PWA/Standalone detection
  const isStandalone = 
    (window.matchMedia('(display-mode: standalone)').matches) ||
    // @ts-ignore
    (window.navigator.standalone === true)

  if (isAndroidWebView) {
    return { isWebView: true, platform: 'android', isStandalone: false, variant: 'webview' }
  }

  if (isIOSWebView) {
    return { isWebView: true, platform: 'ios', isStandalone: false, variant: 'webview' }
  }

  if (isStandalone) {
    return { isWebView: false, platform: null, isStandalone: true, variant: 'pwa' }
  }

  return { isWebView: false, platform: null, isStandalone: false, variant: 'browser' }
}

/**
 * Check URL parameter for WebView flag
 */
function detectWebViewFromURL(): boolean {
  if (typeof window === 'undefined') return false
  
  const params = new URLSearchParams(window.location.search)
  return params.get('webview') === 'true' || params.get('app') === 'true'
}

/**
 * Get complete WebView information
 */
export function getWebViewInfo(): WebViewInfo {
  const fromUserAgent = detectWebViewFromUserAgent()
  const fromURL = detectWebViewFromURL()

  // URL parameter overrides User-Agent detection
  if (fromURL && !fromUserAgent.isWebView) {
    return {
      isWebView: true,
      platform: fromUserAgent.platform || 'android', // Default to Android if not detected
      isStandalone: false,
      variant: 'webview',
    }
  }

  return fromUserAgent
}

/**
 * React Hook for WebView detection
 */
export function useWebView(): WebViewInfo & { 
  loading: boolean
  shouldHideHeader: boolean
  safeAreaInsets: { top: number; bottom: number; left: number; right: number }
} {
  const [info, setInfo] = useState<WebViewInfo>({
    isWebView: false,
    platform: null,
    isStandalone: false,
    variant: 'browser',
  })
  const [loading, setLoading] = useState(true)
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })

  useEffect(() => {
    const detected = getWebViewInfo()
    setInfo(detected)

    // Get safe area insets (for devices with notch/home indicator)
    if (detected.isWebView || detected.isStandalone) {
      const computedStyle = getComputedStyle(document.documentElement)
      setSafeAreaInsets({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      })
    }

    setLoading(false)
  }, [])

  // Should hide desktop header in WebView/PWA
  const shouldHideHeader = info.isWebView || info.isStandalone

  return {
    ...info,
    loading,
    shouldHideHeader,
    safeAreaInsets,
  }
}

/**
 * Apply WebView-specific optimizations
 */
export function applyWebViewOptimizations() {
  if (typeof window === 'undefined') return

  const { isWebView, platform } = getWebViewInfo()

  if (!isWebView) return

  // Disable text selection (better mobile UX)
  document.body.style.userSelect = 'none'
  ;(document.body.style as any).webkitUserSelect = 'none'

  // Disable tap highlight
  ;(document.body.style as any).webkitTapHighlightColor = 'transparent'

  // Enable momentum scrolling on iOS
  ;(document.body.style as any).webkitOverflowScrolling = 'touch'

  // Prevent pull-to-refresh on Android
  document.body.style.overscrollBehavior = 'none'

  // Add platform class to body
  document.body.classList.add('webview')
  if (platform) {
    document.body.classList.add(`webview-${platform}`)
  }
}
