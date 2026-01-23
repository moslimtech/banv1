'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'global' | 'section' | 'component'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Prevents the entire app from crashing in Android WebView
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('❌ [ERROR BOUNDARY] Caught error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
    })

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to log to an error tracking service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI based on level
      const { level = 'component' } = this.props
      const { error, errorInfo } = this.state

      // Global level - full screen error
      if (level === 'global') {
        return (
          <div className="min-h-screen flex items-center justify-center app-bg-main p-4">
            <div className="max-w-md w-full text-center">
              <div className="mb-6">
                <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2 app-text-main">
                  عذراً، حدث خطأ غير متوقع
                </h1>
                <p className="app-text-muted mb-4">
                  نعتذر عن الإزعاج. يرجى المحاولة مرة أخرى.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && error && (
                <div className="mb-6 text-left p-4 rounded app-bg-surface border app-border">
                  <p className="text-sm font-mono text-red-600 mb-2">
                    {error.toString()}
                  </p>
                  {errorInfo && (
                    <details className="text-xs app-text-muted">
                      <summary className="cursor-pointer mb-2">Component Stack</summary>
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
                  style={{ background: 'var(--primary-color)' }}
                >
                  <RefreshCcw size={20} />
                  إعادة تحميل الصفحة
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg app-text-main font-semibold app-bg-surface app-border border transition-colors app-hover-bg"
                >
                  <Home size={20} />
                  العودة للصفحة الرئيسية
                </button>
              </div>
            </div>
          </div>
        )
      }

      // Section level - inline error
      if (level === 'section') {
        return (
          <div className="p-6 rounded-lg app-bg-surface border app-border">
            <div className="flex items-start gap-4">
              <AlertTriangle size={24} className="text-yellow-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 app-text-main">
                  فشل في تحميل هذا القسم
                </h3>
                <p className="app-text-muted mb-4 text-sm">
                  حدث خطأ أثناء تحميل هذا الجزء من الصفحة
                </p>

                {process.env.NODE_ENV === 'development' && error && (
                  <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm font-mono text-red-600 dark:text-red-400">
                      {error.toString()}
                    </p>
                  </div>
                )}

                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: 'var(--primary-color)' }}
                >
                  <RefreshCcw size={16} />
                  إعادة المحاولة
                </button>
              </div>
            </div>
          </div>
        )
      }

      // Component level - minimal error
      return (
        <div className="p-4 rounded app-bg-surface border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            <p className="text-sm font-semibold app-text-main">فشل في التحميل</p>
          </div>
          
          {process.env.NODE_ENV === 'development' && error && (
            <p className="text-xs text-red-600 dark:text-red-400 mb-2 font-mono">
              {error.message}
            </p>
          )}
          
          <button
            onClick={this.handleReset}
            className="text-xs app-text-link hover:underline"
          >
            إعادة المحاولة
          </button>
        </div>
      )
    }

    // No error, render children
    return this.props.children
  }
}

/**
 * Hook-based wrapper for Error Boundary (for functional components)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

export default ErrorBoundary
