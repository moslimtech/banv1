/**
 * Material Design 3 Card Component
 * 
 * Features:
 * - Theme-aware colors from ThemeContext
 * - M3 shapes (rounded-3xl)
 * - Multiple variants (filled, outlined, elevated)
 * - Elevation support
 * - Hover effects
 * - Full TypeScript support
 * 
 * Usage:
 * <Card variant="elevated" elevation={2}>Content</Card>
 */

'use client'

import { ReactNode, HTMLAttributes } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Card variant (M3 styles) */
  variant?: 'filled' | 'outlined' | 'elevated'
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** M3 shape (border radius) */
  shape?: 'extra-large' | 'large' | 'medium' | 'small'
  /** M3 elevation level (0-5) */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5
  /** Hover effect */
  hover?: boolean
  /** Clickable card */
  clickable?: boolean
}

/**
 * M3 Card Component
 */
export default function Card({
  children,
  variant = 'filled',
  padding = 'md',
  shape = 'extra-large',
  elevation = 0,
  hover = false,
  clickable = false,
  className = '',
  style = {},
  ...restProps
}: CardProps) {
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

  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  }

  // Shape styles (M3 border radius) - rounded-3xl for modern Android look
  const shapeStyles = {
    'extra-large': 'rounded-3xl',  // 28px - Premium Android app aesthetic
    'large': 'rounded-2xl',        // 16px
    'medium': 'rounded-xl',        // 12px
    'small': 'rounded-lg',         // 8px
  }

  // Elevation styles (M3 shadow system)
  const elevationStyles = {
    0: 'shadow-none',
    1: 'shadow-sm',   // 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)
    2: 'shadow-md',   // 0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)
    3: 'shadow-lg',   // 0 4px 8px 3px rgba(0,0,0,0.15), 0 1px 3px 0 rgba(0,0,0,0.3)
    4: 'shadow-xl',   // 0 6px 10px 4px rgba(0,0,0,0.15), 0 2px 3px 0 rgba(0,0,0,0.3)
    5: 'shadow-2xl',  // 0 8px 12px 6px rgba(0,0,0,0.15), 0 4px 4px 0 rgba(0,0,0,0.3)
  }

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: colors.surfaceContainer,
          border: 'none',
        }
      
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          border: `1px solid ${colors.outline}`,
        }
      
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          border: 'none',
        }
      
      default:
        return {}
    }
  }

  // Hover/clickable styles
  const interactionClass = hover || clickable
    ? 'transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]'
    : ''

  const cursorClass = clickable ? 'cursor-pointer' : ''

  return (
    <div
      className={`
        ${paddingStyles[padding]}
        ${shapeStyles[shape]}
        ${elevationStyles[variant === 'elevated' ? elevation : 0]}
        ${interactionClass}
        ${cursorClass}
        ${className}
      `}
      style={{
        ...getVariantStyles(),
        color: colors.onSurface,
        ...style,
      }}
      {...domProps}
    >
      {children}
    </div>
  )
}
