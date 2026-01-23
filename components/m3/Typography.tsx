/**
 * Material Design 3 Typography Component
 * 
 * Provides consistent text styling following M3 type scale:
 * - Display: Large, high-impact text
 * - Headline: High-emphasis headings
 * - Title: Medium-emphasis titles
 * - Body: Regular content text
 * - Label: UI labels and buttons
 * 
 * Usage:
 * <Typography variant="headline-large">Page Title</Typography>
 * <Typography variant="body-medium">Paragraph text</Typography>
 */

'use client'

import { ReactNode, createElement, HTMLAttributes } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

type TypographyVariant =
  // Display - For hero/landing sections
  | 'display-large' | 'display-medium' | 'display-small'
  // Headline - For page/section titles
  | 'headline-large' | 'headline-medium' | 'headline-small'
  // Title - For card/dialog titles
  | 'title-large' | 'title-medium' | 'title-small'
  // Body - For paragraphs and content
  | 'body-large' | 'body-medium' | 'body-small'
  // Label - For buttons and labels
  | 'label-large' | 'label-medium' | 'label-small'

type TypographyElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label'

type TypographyColor = 'primary' | 'secondary' | 'onSurface' | 'onSurfaceVariant' | 'onPrimary' | 'error' | 'success' | 'warning' | 'info'

interface TypographyProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  /** Typography variant from M3 type scale */
  variant: TypographyVariant
  /** HTML element to render */
  as?: TypographyElement
  /** Text color from theme */
  color?: TypographyColor
  /** Additional CSS classes */
  className?: string
  /** Children content */
  children: ReactNode
}

/**
 * M3 Typography type scale configuration
 */
const typeScale: Record<TypographyVariant, { size: string; lineHeight: string; weight: string; letterSpacing?: string }> = {
  // Display
  'display-large': { size: '57px', lineHeight: '64px', weight: '400', letterSpacing: '-0.25px' },
  'display-medium': { size: '45px', lineHeight: '52px', weight: '400' },
  'display-small': { size: '36px', lineHeight: '44px', weight: '400' },
  
  // Headline
  'headline-large': { size: '32px', lineHeight: '40px', weight: '400' },
  'headline-medium': { size: '28px', lineHeight: '36px', weight: '400' },
  'headline-small': { size: '24px', lineHeight: '32px', weight: '400' },
  
  // Title
  'title-large': { size: '22px', lineHeight: '28px', weight: '400' },
  'title-medium': { size: '16px', lineHeight: '24px', weight: '500', letterSpacing: '0.15px' },
  'title-small': { size: '14px', lineHeight: '20px', weight: '500', letterSpacing: '0.1px' },
  
  // Body
  'body-large': { size: '16px', lineHeight: '24px', weight: '400', letterSpacing: '0.5px' },
  'body-medium': { size: '14px', lineHeight: '20px', weight: '400', letterSpacing: '0.25px' },
  'body-small': { size: '12px', lineHeight: '16px', weight: '400', letterSpacing: '0.4px' },
  
  // Label
  'label-large': { size: '14px', lineHeight: '20px', weight: '500', letterSpacing: '0.1px' },
  'label-medium': { size: '12px', lineHeight: '16px', weight: '500', letterSpacing: '0.5px' },
  'label-small': { size: '11px', lineHeight: '16px', weight: '500', letterSpacing: '0.5px' },
}

/**
 * Default HTML elements for each variant
 */
const defaultElements: Record<TypographyVariant, TypographyElement> = {
  'display-large': 'h1',
  'display-medium': 'h1',
  'display-small': 'h2',
  'headline-large': 'h2',
  'headline-medium': 'h3',
  'headline-small': 'h4',
  'title-large': 'h5',
  'title-medium': 'h6',
  'title-small': 'h6',
  'body-large': 'p',
  'body-medium': 'p',
  'body-small': 'p',
  'label-large': 'span',
  'label-medium': 'span',
  'label-small': 'span',
}

/**
 * M3 Typography Component
 */
export default function Typography({
  variant,
  as,
  color = 'onSurface',
  className = '',
  children,
  style = {},
  ...props
}: TypographyProps) {
  const { colors } = useTheme()
  
  const scale = typeScale[variant]
  const element = as || defaultElements[variant]
  
  const typographyStyle = {
    fontSize: scale.size,
    lineHeight: scale.lineHeight,
    fontWeight: scale.weight,
    letterSpacing: scale.letterSpacing || '0',
    color: colors[color as keyof typeof colors] || colors.onSurface,
    ...style,
  }
  
  return createElement(
    element,
    {
      className,
      style: typographyStyle,
      ...props,
    },
    children
  )
}

/**
 * Convenient shorthand components
 */
export function DisplayLarge(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="display-large" {...props} />
}

export function DisplayMedium(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="display-medium" {...props} />
}

export function DisplaySmall(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="display-small" {...props} />
}

export function HeadlineLarge(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="headline-large" {...props} />
}

export function HeadlineMedium(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="headline-medium" {...props} />
}

export function HeadlineSmall(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="headline-small" {...props} />
}

export function TitleLarge(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="title-large" {...props} />
}

export function TitleMedium(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="title-medium" {...props} />
}

export function TitleSmall(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="title-small" {...props} />
}

export function BodyLarge(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="body-large" {...props} />
}

export function BodyMedium(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="body-medium" {...props} />
}

export function BodySmall(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="body-small" {...props} />
}

export function LabelLarge(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="label-large" {...props} />
}

export function LabelMedium(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="label-medium" {...props} />
}

export function LabelSmall(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="label-small" {...props} />
}
