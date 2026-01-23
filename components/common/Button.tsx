/**
 * Material Design 3 Button Component
 * 
 * Features:
 * - Theme-aware colors from ThemeContext
 * - M3 shapes (rounded-full)
 * - Multiple variants (filled, tonal, outlined, text)
 * - Loading states
 * - Size variants
 * - Full TypeScript support
 * 
 * Usage:
 * <Button variant="filled" shape="full">Click me</Button>
 */

'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant (M3 styles) */
  variant?: 'filled' | 'filled-tonal' | 'outlined' | 'text' | 'elevated'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** M3 shape (border radius) */
  shape?: 'full' | 'large' | 'medium' | 'small'
  /** Loading state */
  loading?: boolean
  /** Full width button */
  fullWidth?: boolean
  children: ReactNode
}

/**
 * M3 Button Component
 */
export default function Button({
  variant = 'filled',
  size = 'md',
  shape = 'full',
  loading = false,
  children,
  fullWidth = false,
  className = '',
  disabled,
  style = {},
  ...restProps
}: ButtonProps) {
  const { colors } = useTheme()
  
  // Filter out custom props that shouldn't be passed to DOM
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    'app-card': _appCard,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    'app-text-main': _appTextMain,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    'app-text-muted': _appTextMuted,
    ...domProps
  } = restProps as any

  // Size styles (M3 recommended)
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  // Shape styles (M3 border radius)
  const shapeStyles = {
    full: 'rounded-full',      // Pill shape (recommended for Android)
    large: 'rounded-2xl',      // 16px
    medium: 'rounded-xl',      // 12px
    small: 'rounded-lg',       // 8px
  }

  // Variant styles (M3 design system)
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: disabled ? colors.surfaceVariant : colors.primary,
          color: colors.onPrimary,
          border: 'none',
          boxShadow: disabled ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',
        }
      
      case 'filled-tonal':
        return {
          backgroundColor: disabled 
            ? colors.surfaceVariant 
            : `rgba(${colors.primaryRgb}, 0.12)`,
          color: disabled ? colors.onSurface : colors.primary,
          border: 'none',
        }
      
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          color: disabled ? colors.onSurface : colors.primary,
          border: `1px solid ${disabled ? colors.outline : colors.primary}`,
        }
      
      case 'text':
        return {
          backgroundColor: 'transparent',
          color: disabled ? colors.onSurface : colors.primary,
          border: 'none',
          padding: size === 'sm' ? '8px 12px' : size === 'md' ? '12px 16px' : '16px 20px',
        }
      
      case 'elevated':
        return {
          backgroundColor: disabled ? colors.surfaceVariant : colors.surface,
          color: disabled ? colors.onSurface : colors.primary,
          border: 'none',
          boxShadow: disabled 
            ? 'none' 
            : '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15)',
        }
      
      default:
        return {}
    }
  }

  return (
    <button
      className={`
        font-semibold
        transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed
        hover:scale-[1.02] active:scale-[0.98]
        flex items-center justify-center gap-2
        ${sizeStyles[size]}
        ${shapeStyles[shape]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        ...getVariantStyles(),
        ...style,
      }}
      disabled={disabled || loading}
      {...domProps}
    >
      {loading && (
        <Loader2 
          size={size === 'sm' ? 16 : size === 'md' ? 18 : 20} 
          className="animate-spin" 
        />
      )}
      {children}
    </button>
  )
}
