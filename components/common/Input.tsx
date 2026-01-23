/**
 * Material Design 3 Input Component
 * 
 * Features:
 * - Theme-aware colors from ThemeContext
 * - M3 shapes (rounded-2xl)
 * - Multiple variants (filled, outlined)
 * - Label and helper text support
 * - Error states
 * - Full TypeScript support
 * 
 * Usage:
 * <Input label="Name" variant="outlined" />
 */

'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  /** Input variant (M3 styles) */
  variant?: 'filled' | 'outlined'
  /** M3 shape (border radius) */
  shape?: 'large' | 'medium' | 'small'
}

/**
 * M3 Input Component
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    variant = 'outlined',
    shape = 'large',
    className = '', 
    style = {},
    ...restProps 
  }, ref) => {
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

    // Shape styles (M3 border radius)
    const shapeStyles = {
      large: 'rounded-2xl',   // 16px - Modern Android aesthetic
      medium: 'rounded-xl',   // 12px
      small: 'rounded-lg',    // 8px
    }

    // Variant styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'filled':
          return {
            backgroundColor: colors.surfaceVariant,
            border: 'none',
            borderBottom: `2px solid ${error ? colors.error : colors.outline}`,
            borderRadius: `${shape === 'large' ? '16px' : shape === 'medium' ? '12px' : '8px'} ${shape === 'large' ? '16px' : shape === 'medium' ? '12px' : '8px'} 0 0`,
          }
        
        case 'outlined':
        default:
          return {
            backgroundColor: 'transparent',
            border: `2px solid ${error ? colors.error : colors.outline}`,
          }
      }
    }

    return (
      <div className="w-full">
        {label && (
          <label 
            className="block mb-2 text-sm font-semibold"
            style={{ color: colors.onSurface }}
          >
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          className={`
            w-full
            px-4 py-3
            text-base font-medium
            transition-all duration-200
            focus:outline-none
            placeholder:opacity-60
            ${shapeStyles[shape]}
            ${className}
          `}
          style={{
            ...getVariantStyles(),
            color: colors.onSurface,
            fontSize: '16px', // Prevent iOS zoom on focus
            ...style,
          }}
          onFocus={(e) => {
            // M3 focus state
            e.currentTarget.style.borderColor = colors.primary
            e.currentTarget.style.borderWidth = '2px'
          }}
          onBlur={(e) => {
            // Reset border on blur
            e.currentTarget.style.borderColor = error ? colors.error : colors.outline
          }}
          {...domProps}
        />
        
        {error && (
          <p 
            className="mt-1.5 text-xs font-medium flex items-center gap-1"
            style={{ color: colors.error }}
          >
            <span className="inline-block">⚠️</span>
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            className="mt-1.5 text-xs"
            style={{ color: colors.onSurface, opacity: 0.7 }}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
